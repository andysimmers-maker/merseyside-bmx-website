# bmx-checkout Worker

`bmx-checkout.js` is the source of truth for the shop checkout Worker at
`bmx-checkout.andy-simmers.workers.dev`. It is **not** deployed automatically by a push.

## Deploying a change

1. Cloudflare dashboard > Workers & Pages > `bmx-checkout` > **Edit code**
2. Select all, paste in the whole of `bmx-checkout.js`, click **Deploy**
3. Commit the same file here so the repo and the live Worker match

Secrets (`SUMUP_API_KEY`, `SUMUP_MERCHANT_CODE`, `GOOGLE_CREDENTIALS`, `SHEET_ID`) and the
`ORDERS_KV` binding stay in the dashboard. Never put them in this file.

## One-off setup

- **Cron Trigger:** Settings > Triggers > add `*/15 * * * *`. Every 15 minutes this logs any
  paid order whose confirm step never ran (e.g. the parent closed the browser after paying).
- **Sheet row 1 headers (A to N):** Date, Name, Email, Product, Size, Colour, Rider Name,
  Race Number, Age, Amount, Payment Reference, SumUp Transaction, Status, Bundle
- **Kit rows:** one row per garment so sizes can be counted for the supplier. A bundle is three
  rows (jersey, pants or shorts, gloves): the bundle price is on the first, the others show
  £0.00, and the Bundle column names the bundle on all three.

## Confirmation emails (Resend)

Off until `RESEND_API_KEY` is set. To switch on:

1. In Resend (the same account as My BMX Season is fine): Domains > Add `merseysidebmx.co.uk`,
   then add the DNS records it shows in Cloudflare DNS and wait for "Verified"
2. Resend > API Keys > create a key with "Sending access" for that domain
3. On the `bmx-checkout` Worker > Settings > Variables and Secrets, add:
   - `RESEND_API_KEY` (secret): the key
   - `EMAIL_FROM` (optional): defaults to `Merseyside BMX Club <shop@merseysidebmx.co.uk>`
   - `ORDER_NOTIFY_EMAIL` (optional): e.g. `merseysidebmx@gmail.com` to get a copy of every order

Replies go to merseysidebmx@gmail.com. An email failure is logged but never stops an order
being recorded.

## Products and prices

`PRODUCTS` at the top of the file sets the price charged and whether each product can be
ordered (`live`). Keep it in step with `PRICES` and `LIVE_PRODUCTS` in `shop.html`. The page's
prices are for display only.
