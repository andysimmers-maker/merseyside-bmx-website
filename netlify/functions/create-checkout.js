// netlify/functions/create-checkout.js
//
// Required environment variables (set in Netlify dashboard → Site settings → Environment variables):
//   STRIPE_SECRET_KEY   — your Stripe secret key (starts with sk_live_ or sk_test_)
//
// The function creates a Stripe Checkout session with all order details
// attached as metadata, so you can see every customisation in the Stripe dashboard.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRICES = { youth: 3200, adult: 3500, stickers: 2500 }; // pence
const NAMES  = { youth: 'Youth Race Jersey', adult: 'Adult Race Jersey', stickers: 'Race Plate Stickers' };

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let items;
  try {
    ({ items } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No items in order' }) };
  }

  // Validate item types
  for (const item of items) {
    if (!PRICES[item.type]) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Unknown product type: ' + item.type }) };
    }
  }

  const origin = event.headers.origin || event.headers.referer?.replace(/\/$/, '') || 'https://polite-gnome-27d18b.netlify.app';

  try {
    // Build line items for Stripe Checkout
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: NAMES[item.type],
          description: item.details,
        },
        unit_amount: PRICES[item.type],
      },
      quantity: 1,
    }));

    // Build order summary for metadata (Stripe metadata values must be strings, max 500 chars each)
    const orderSummary = items.map((item, i) =>
      `${i + 1}. ${NAMES[item.type]}: ${item.details}`
    ).join(' | ');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/shop.html?success=1`,
      cancel_url:  `${origin}/shop.html?cancelled=1`,
      // Stripe will send a receipt email automatically if the customer enters their email
      customer_creation: 'always',
      metadata: {
        club: 'Merseyside BMX Club',
        order_summary: orderSummary.substring(0, 499),
        item_count: String(items.length),
      },
      // Collect billing address for records
      billing_address_collection: 'auto',
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };

  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
