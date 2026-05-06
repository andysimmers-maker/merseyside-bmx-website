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
- `shop.html` — club shop (jerseys, stickers) with a client-side basket and SumUp checkout flow; `ORDERS_OPEN` toggle on line ~617 controls whether the shop accepts orders
- `sponsors.html`, `faq.html`, `conduct.html`, `welfare.html`, `race-guide.html`, `kit-guide.html`, `coaching.html`, `privacy.html` — standalone informational pages

**Shop checkout flow:**
- Client-side basket + customer details (name, email) in `shop.html` (vanilla JS)
- On checkout, POSTs to the `bmx-checkout` Cloudflare Worker at `bmx-checkout.andy-simmers.workers.dev`
- Worker endpoints: `/create-checkout` (creates SumUp payment) and `/confirm-order` (writes confirmed order to Google Sheets)
- Worker secrets: `SUMUP_API_KEY`, `SUMUP_MERCHANT_CODE` (pending from treasurer), `GOOGLE_CREDENTIALS`, `SHEET_ID`
- KV namespace `BMX_ORDERS` bound as `ORDERS_KV` on the Worker
- Google Sheet ID: `16u4lpPh4JM9dL4V7UH5nHLY7h5jyDlYsyrqFwTq1Pvo` — row 1 headers: Date, Name, Email, Product, Size, Colour, Rider Name, Race Number, Amount, Payment Reference, Status
- To open orders: set `ORDERS_OPEN = true` in `shop.html` and push to `main`

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
