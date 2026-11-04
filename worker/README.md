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
- **Sheet row 1 headers (A to M):** Date, Name, Email, Product, Size, Colour, Rider Name,
  Race Number, Age, Amount, Payment Reference, SumUp Transaction, Status

## Products and prices

`PRODUCTS` at the top of the file sets the price charged and whether each product can be
ordered (`live`). Keep it in step with `PRICES` and `LIVE_PRODUCTS` in `shop.html`. The page's
prices are for display only.
