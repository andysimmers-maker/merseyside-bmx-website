// Merseyside BMX Club: shop checkout Worker (bmx-checkout)
//
// This file is the source of truth for the Worker. To deploy, open the bmx-checkout
// Worker in the Cloudflare dashboard, choose "Edit code", replace everything with this
// file and click Deploy. See worker/README.md.
//
// Environment (set in the dashboard, never in this file):
//   SUMUP_API_KEY        SumUp API key (secret)
//   SUMUP_MERCHANT_CODE  SumUp merchant code (secret)
//   GOOGLE_CREDENTIALS   Google service account JSON as a string (secret)
//   SHEET_ID             Google Sheets spreadsheet ID
//   ORDERS_KV            KV namespace binding (BMX_ORDERS)

// ── PRODUCT CATALOGUE ─────────────────────────────────────────────
// Prices live here, not in the browser. Keep in step with PRICES in shop.html.
// live: false means the Worker refuses orders for that product.
const PRODUCTS = {
  stickers: { name: 'Race Plate Stickers', pence: 1250, live: true },
  youth:    { name: 'Youth Race Jersey',   pence: 3200, live: false },
  adult:    { name: 'Adult Race Jersey',   pence: 3500, live: false },
};

const STICKER_SIZES   = ['Small', 'Large'];
const STICKER_COLOURS = ['Yellow (Male/Open)', 'Blue (Female)', 'Red (Cruiser)'];
const YOUTH_SIZES     = ['5-6', '7-8', '9-10', '11-12', '13-14'];
const ADULT_SIZES     = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const MAX_ITEMS       = 20;

const SITE_ORIGINS = [
  'https://merseysidebmx.co.uk',
  'https://www.merseysidebmx.co.uk',
  'https://merseyside-bmx-website.andy-simmers.workers.dev',
];
const DEFAULT_ORIGIN = 'https://merseysidebmx.co.uk';

const PENDING_TTL = 60 * 60 * 24 * 7;   // keep unconfirmed checkouts for 7 days
const DONE_TTL    = 60 * 60 * 24 * 90;  // remember logged orders for 90 days

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const origin = request.headers.get('origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : DEFAULT_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    // CREATE CHECKOUT
    if (url.pathname === '/create-checkout' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const rawItems = Array.isArray(body.items) ? body.items : [];
        if (!rawItems.length) return json({ error: 'Your basket is empty' }, 400, cors);
        if (rawItems.length > MAX_ITEMS) return json({ error: 'Too many items in one order' }, 400, cors);

        const customer = {
          name:  clean(body.customer?.name, 80),
          email: clean(body.customer?.email, 120),
        };
        if (!customer.name) return json({ error: 'Please enter your name' }, 400, cors);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return json({ error: 'Please enter a valid email address' }, 400, cors);

        const items = [];
        for (const raw of rawItems) {
          const result = validateItem(raw);
          if (result.error) return json({ error: result.error }, 400, cors);
          items.push(result.item);
        }

        const totalPence = items.reduce((s, i) => s + i.pence, 0);
        const ref        = 'BMX-' + Date.now() + '-' + crypto.randomUUID().slice(0, 6);
        const siteOrigin = isSiteOrigin(origin) ? origin : DEFAULT_ORIGIN;
        const description = 'Merseyside BMX Club order: ' + items.length + (items.length > 1 ? ' items' : ' item');

        const res = await fetch('https://api.sumup.com/v0.1/checkouts', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + env.SUMUP_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            checkout_reference: ref,
            amount: totalPence / 100,
            currency: 'GBP',
            merchant_code: env.SUMUP_MERCHANT_CODE,
            description,
            redirect_url: siteOrigin + '/shop.html?order=' + ref + '&status=success',
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error('SumUp error:', JSON.stringify(data));
          return json({ error: 'The payment provider could not start the payment' }, 502, cors);
        }

        await env.ORDERS_KV.put(
          'pending:' + ref,
          JSON.stringify({ ref, sumupId: data.id, items, customer, totalPence, created: new Date().toISOString() }),
          { expirationTtl: PENDING_TTL }
        );

        return json({ id: data.id, ref }, 200, cors);

      } catch (e) {
        console.error('Checkout exception:', e.message);
        return json({ error: 'Something went wrong starting the payment' }, 500, cors);
      }
    }

    // CONFIRM ORDER
    if (url.pathname === '/confirm-order' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const ref  = typeof body.ref === 'string' ? body.ref : '';
        if (!/^BMX-[0-9]+(-[0-9a-f]{6})?$/.test(ref)) return json({ error: 'Invalid order reference' }, 400, cors);

        const status = await confirmOrder(env, ref);
        return json({ status }, 200, cors);

      } catch (e) {
        console.error('Confirm exception:', e.message);
        return json({ error: 'Could not confirm the order' }, 500, cors);
      }
    }

    return new Response('Not found', { status: 404 });
  },

  // Safety net: if a parent pays but closes the browser before the confirm step,
  // this picks the order up and logs it. Needs a Cron Trigger on the Worker
  // (dashboard > bmx-checkout > Settings > Triggers), e.g. every 15 minutes.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sweepPending(env));
  },
};

// Checks SumUp and logs a paid order to the Sheet exactly once.
// Returns 'PAID', the SumUp status (e.g. 'PENDING', 'FAILED') or 'NOT_FOUND'.
async function confirmOrder(env, ref) {
  if (await env.ORDERS_KV.get('done:' + ref)) return 'PAID';

  const pendingRaw = await env.ORDERS_KV.get('pending:' + ref);
  if (!pendingRaw) return 'NOT_FOUND';

  const pending = JSON.parse(pendingRaw);
  const res = await fetch('https://api.sumup.com/v0.1/checkouts/' + pending.sumupId, {
    headers: { 'Authorization': 'Bearer ' + env.SUMUP_API_KEY },
  });
  const data = await res.json().catch(() => ({}));
  if (data.status !== 'PAID') return data.status || 'UNKNOWN';

  // Claim the order before writing, so two confirm calls arriving together
  // don't both add rows: each writes its own token, and only the call whose
  // token is still there afterwards logs it. If the write fails, the claim is
  // cleared and the pending order stays, so the next confirm or sweep retries.
  if (await env.ORDERS_KV.get('done:' + ref)) return 'PAID';
  const token = crypto.randomUUID();
  await env.ORDERS_KV.put('done:' + ref, token, { expirationTtl: DONE_TTL });
  await new Promise(r => setTimeout(r, 250));
  if (await env.ORDERS_KV.get('done:' + ref) !== token) return 'PAID';
  try {
    await logToSheets(env, pending, data.transaction_code || data.transactions?.[0]?.transaction_code || '');
  } catch (e) {
    await env.ORDERS_KV.delete('done:' + ref);
    throw e;
  }
  await env.ORDERS_KV.delete('pending:' + ref);
  return 'PAID';
}

async function sweepPending(env) {
  let cursor;
  do {
    const page = await env.ORDERS_KV.list({ prefix: 'pending:', cursor });
    for (const key of page.keys) {
      const ref = key.name.slice('pending:'.length);
      try { await confirmOrder(env, ref); }
      catch (e) { console.error('Sweep failed for', ref, e.message); }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
}

// ── VALIDATION ────────────────────────────────────────────────────
function validateItem(raw) {
  const type    = raw?.type;
  const product = PRODUCTS[type];
  if (!product) return { error: 'Unknown product' };
  if (!product.live) return { error: 'The ' + product.name + ' is not available to order right now' };

  const f = raw.fields || {};
  const size = clean(f.size, 10);
  const name = clean(f.name, 20);
  if (!name) return { error: 'Please enter the rider name' };

  let fields;
  if (type === 'stickers') {
    const colour = clean(f.colour, 30);
    const number = clean(f.number, 4);
    const age    = clean(f.age, 2);
    if (!STICKER_SIZES.includes(size))     return { error: 'Please choose a sticker size' };
    if (!STICKER_COLOURS.includes(colour)) return { error: 'Please choose a race category' };
    if (!/^\d{1,4}$/.test(number))         return { error: 'Please enter a valid race number' };
    if (!/^\d{1,2}$/.test(age))            return { error: 'Please enter a valid age' };
    fields = { size, colour, name, number, age };
  } else {
    const sizes = type === 'youth' ? YOUTH_SIZES : ADULT_SIZES;
    if (!sizes.includes(size)) return { error: 'Please choose a jersey size' };
    fields = { size, colour: '', name, number: '', age: '' };
  }

  return { item: { type, name: product.name, pence: product.pence, fields } };
}

// Trims, strips control characters and the · separator, and caps the length.
function clean(v, max) {
  return String(v ?? '').replace(/[\u0000-\u001f\u007f·]/g, '').trim().slice(0, max);
}

// Stops values like "=IMPORTXML(...)" being run as Sheet formulas.
function sheetSafe(v) {
  const s = String(v ?? '');
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

// ── GOOGLE SHEETS ─────────────────────────────────────────────────
// Row 1 headers (A to M): Date, Name, Email, Product, Size, Colour, Rider Name,
// Race Number, Age, Amount, Payment Reference, SumUp Transaction, Status
async function logToSheets(env, order, transactionCode) {
  const creds = JSON.parse(env.GOOGLE_CREDENTIALS);
  const token = await getAccessToken(creds);
  const now   = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' });

  const rows = order.items.map(item => [
    now,
    sheetSafe(order.customer?.name),
    sheetSafe(order.customer?.email),
    item.name,
    sheetSafe(item.fields.size),
    sheetSafe(item.fields.colour),
    sheetSafe(item.fields.name),
    sheetSafe(item.fields.number),
    sheetSafe(item.fields.age),
    '£' + (item.pence / 100).toFixed(2),
    order.ref,
    transactionCode,
    'PAID',
  ]);

  const res = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets/' + env.SHEET_ID +
    '/values/Sheet1!A:M:append?valueInputOption=USER_ENTERED',
    {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: rows }),
    }
  );
  if (!res.ok) throw new Error('Sheets write failed: ' + await res.text());
}

async function getAccessToken(creds) {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await signJWT(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: creds.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    },
    creds.private_key
  );
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Google auth failed: ' + JSON.stringify(data));
  return data.access_token;
}

async function signJWT(header, payload, pem) {
  const enc = new TextEncoder();
  const b64url = obj => btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const unsigned = b64url(header) + '.' + b64url(payload);
  const key = await crypto.subtle.importKey(
    'pkcs8', pemToArrayBuffer(pem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig    = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(unsigned));
  const chars  = Array.from(new Uint8Array(sig), b => String.fromCharCode(b)).join('');
  const sigB64 = btoa(chars).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return unsigned + '.' + sigB64;
}

function pemToArrayBuffer(pem) {
  const b64  = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const bin  = atob(b64);
  const buf  = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

// ── HELPERS ───────────────────────────────────────────────────────
function isSiteOrigin(o) { return SITE_ORIGINS.includes(o); }
function isAllowedOrigin(o) { return isSiteOrigin(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o); }

function json(data, status, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
