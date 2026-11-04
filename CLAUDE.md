# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static HTML website for Merseyside BMX Club. No build step, no framework, no package manager at the root level. Files are edited directly and deployed via Cloudflare Pages (auto-deploys on push to `main`).

## Development

There is no build or dev server. Open HTML files directly in a browser, or use a simple local server:

```
npx serve .
```

There are no tests, no linting tools, and no CI beyond Cloudflare's deployment pipeline.

## Architecture

All CSS and JavaScript lives inline within each HTML file — there are no external `.css` or `.js` files. Each page is self-contained.

**Pages:**
- `index.html` — single-page site with all main sections: Hero, About, Sessions, Shop teaser, Join, Coaches, Riders, Contact, Sponsors
- `shop.html`: club shop (race plate stickers and club kit: jersey, pants, shorts, gloves and two bundles) with a client-side basket and SumUp checkout flow. Unlinked from the site and `noindex` while in development
- `kit-order.html`: current kit order page (Google Form). The nav "Shop" button points here for now
- `sponsors.html`, `faq.html`, `conduct.html`, `welfare.html`, `new-rider-guide.html`, `kit-guide.html`, `coaching.html`, `privacy.html`: standalone informational pages

**Shop controls (top of the `<script>` in `shop.html`):**
- `ORDERS_OPEN`: opens ordering to the public
- `LIVE_PRODUCTS`: which products the public sees (`stickers` now; add `kit` to open kit). Preview mode always shows both. `KIT` and `PARTS` define the kit cards, prices and sizes
- `shop.html?preview=1`: turns ordering on in your own browser tab only (`?preview=0` to leave). Payments are real
- `PRICES` is display only. The Worker's `PRODUCTS` list sets what is charged and which products can be ordered, so change both together

**Shop checkout flow:**
- Basket items are sent as `{ type, fields }` to the `bmx-checkout` Cloudflare Worker at `bmx-checkout.andy-simmers.workers.dev`
- Worker source: `worker/bmx-checkout.js` (deploy steps in `worker/README.md`). It is NOT deployed by a push: paste it into the dashboard (Edit code > Deploy)
- Endpoints: `/create-checkout` (validates, prices and creates the SumUp checkout) and `/confirm-order` (checks SumUp, logs the order to Google Sheets once, sends the confirmation email)
- A Cron Trigger (`*/15 * * * *`) sweeps paid orders whose confirm step never ran
- Secrets: `SUMUP_API_KEY`, `SUMUP_MERCHANT_CODE`, `GOOGLE_CREDENTIALS`, `SHEET_ID`; optional `RESEND_API_KEY`, `EMAIL_FROM`, `ORDER_NOTIFY_EMAIL` for confirmation emails
- KV namespace `BMX_ORDERS` bound as `ORDERS_KV` on the Worker
- Google Sheet ID: `16u4lpPh4JM9dL4V7UH5nHLY7h5jyDlYsyrqFwTq1Pvo`, row 1 headers (A to N): Date, Name, Email, Product, Size, Colour, Rider Name, Race Number, Age, Amount, Payment Reference, SumUp Transaction, Status, Bundle. Kit is one row per garment (a bundle is 3 rows, price on the first)
- Stickers and kit both go to the supplier quarterly, 3 to 5 weeks delivery
- Kit images: `kit-bundle-pants.jpg`, `kit-bundle-shorts.jpg` (bundles) and crops from `kit.jpeg`: `kit-jersey.jpg`, `kit-pants.jpg`, `kit-shorts.jpg`, `kit-gloves.jpg`. Size charts: `size-chart-jersey.jpg`, `size-chart-pants.png` (pants and shorts), `size-chart-gloves.jpg`
- Sticker images: `stickers-club.jpg` (Male/Open), `stickers-club-female.jpg`, `stickers-club-cruiser.jpg`, `stickers-nrt.jpg`. Rider names on them are anonymised; never publish images with real children's names

**Contact form:** Uses Web3Forms (access key `bb2db04e-8482-4dfa-b4fb-bd3d6afdbf6d`) — submits to `merseysidebmx@gmail.com` without a page reload.

## Design System

CSS custom properties are declared in `:root` at the top of every HTML file. All pages must use these variables consistently:

| Variable | Value | Role |
|---|---|---|
| `--red` | `#d42b2b` | Primary accent, buttons, borders |
| `--blue` | `#1a3d8f` | Secondary accent |
| `--black` | `#0f0f0f` | Main dark background |
| `--dark` | `#191919` | Section dark background |
| `--mid` | `#2a2a2a` | Cards, hover states |
| `--white` | `#f6f6f6` | Light section background |

Fonts loaded from Google Fonts: **Bebas Neue** (`--fd`) for headings/labels, **DM Sans** (`--fb`) for body text.

The red/blue divider stripe (`<div class="dd">`) and the `.reveal` scroll-animation class appear on all pages.

## Hosting & Services

- **Cloudflare Pages** — static site hosting, auto-deploys from `main`
- **Cloudflare Worker (`bmx-checkout`)** — server-side checkout logic (SumUp + Google Sheets)
- **SumUp** — payment processing (sandbox test card: `4111 1111 1111 1111`)
- **Google Sheets** — order records written by the Worker via service account
- **Web3Forms** — contact form email delivery
- **Google Fonts** — typography

Live URL: `merseyside-bmx-website.andy-simmers.workers.dev`
