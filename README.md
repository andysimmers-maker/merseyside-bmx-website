# Merseyside BMX Club — Website Handover Guide

This document explains everything about the club website: how it was built, where it's hosted, what services it uses, and how to maintain or hand it over to someone else.

---

## Overview

The website is a static HTML site — no WordPress, no database, no complex framework. It's a set of plain HTML, CSS and JavaScript files hosted on Cloudflare Pages. This keeps it fast, cheap (free), and simple to maintain.

**Live site:** merseyside-bmx-website.andy-simmers.workers.dev  
*(When the club domain is pointed here this will change to the club's own domain)*

---

## Accounts You Need Access To

There are five services involved in running the site. Whoever takes over the site needs the login details for all of them. These should be stored securely (e.g. in a password manager or a sealed envelope with the club secretary).

### 1. GitHub
**What it is:** Where all the website files are stored. Every change to the site is made here.  
**Account:** Personal account (Andy Simmers)  
**Repository:** `andysimmers-maker/merseyside-bmx-website`  
**URL:** github.com  
**Free:** Yes  
**To hand over:** Add the new person as a collaborator on the repository, or transfer the repository to their account.

### 2. Cloudflare
**What it is:** Hosts the static website (Pages) and the shop checkout function (Workers). Any change pushed to GitHub automatically deploys to the live site within a minute or two.  
**Account:** Personal account (Andy Simmers)  
**Projects:** merseyside-bmx-website (Pages) and bmx-checkout (Worker)  
**URL:** cloudflare.com  
**Free:** Yes  
**To hand over:** Transfer the Cloudflare account or add the new person as an account member.

### 3. Web3Forms
**What it is:** Handles the contact form on the website. When someone fills in the form, Web3Forms sends the message to the club email address (merseysidebmx@gmail.com).  
**Account:** Registered to the club email  
**Access key:** bb2db04e-8482-4dfa-b4fb-bd3d6afdbf6d  
**URL:** web3forms.com  
**Free:** Yes  
**To hand over:** Share the access key, or log in and update the recipient email address.

### 4. SumUp *(shop payments)*
**What it is:** Handles online payments for the club shop (jerseys, race plate stickers). Payments go directly to the club's linked bank account.  
**Status:** API keys need to be obtained from SumUp and added to the Cloudflare Worker before the shop goes live. The treasurer is responsible for setting this up.  
**URL:** sumup.com  
**Cost:** No monthly fee — SumUp charges a small percentage per transaction. Check sumup.com for current UK rates.  
**To hand over:** Transfer the SumUp account to the new treasurer/responsible person. Update the `SUMUP_API_KEY` and `SUMUP_MERCHANT_CODE` secrets in the `bmx-checkout` Cloudflare Worker.

### 5. Google (Orders Sheet)
**What it is:** Confirmed shop orders are written automatically to a Google Sheet by the checkout Worker. This is how the committee compiles monthly bulk orders.  
**Sheet ID:** `16u4lpPh4JM9dL4V7UH5nHLY7h5jyDlYsyrqFwTq1Pvo`  
**Access:** Club administrators only. The Worker connects via a service account (credentials stored as a secret in Cloudflare).  
**To hand over:** Share access to the Google Sheet with the new committee member responsible for processing orders.

---

## How to Make Changes to the Site

All changes are made through GitHub. You don't need to know how to code for simple text changes.

### Making a text change
1. Go to **github.com** and log in
2. Open the `andysimmers-maker/merseyside-bmx-website` repository
3. Click on the file you want to edit (e.g. `index.html`)
4. Click the **pencil icon** (Edit this file)
5. Use **Ctrl+F** to find the text you want to change
6. Make your edit
7. Click **Commit changes**
8. The site will automatically update within about a minute

### Adding a new image (e.g. a rider photo)
1. Go to the repository on GitHub
2. Click **Add file → Upload files**
3. Drag your image file in
4. Click **Commit changes**
5. Then edit the relevant HTML file to reference the new image filename

### If you need more complex changes
Contact someone with basic HTML knowledge, or use an AI assistant (like Claude at claude.ai) — paste in the relevant section of code and describe what you want changed.

---

## Site Structure

| File | What it is |
|------|-----------|
| `index.html` | The main page — About, Sessions, Shop teaser, Join, Coaches, Riders, Contact and Sponsors |
| `shop.html` | The club shop — jerseys and race plate stickers |
| `sponsors.html` | Full sponsors page with contact details for each sponsor |
| `faq.html` | Frequently asked questions |
| `conduct.html` | Code of Conduct — links to the waiver form |
| `welfare.html` | Safeguarding and welfare policy |
| `privacy.html` | Privacy policy |
| `kit-guide.html` | Bikes and kit buying guide for new riders |
| `race-guide.html` | Race day guide — format, Sqorz, pens and the start gate |
| `coaching.html` | Coaching pathway — levels and progression *(hidden pending committee approval)* |
| `logo.png` | Club logo |
| `rider_placeholder.svg` | Silhouette placeholder for riders without a photo |
| `coach_placeholder.svg` | Silhouette placeholder for coaches without a photo |
| `quillan.webp` | Coach photo — Quillan Isidore |
| `stickers.jpg` | Race plate sticker product image |
| `jersey_regional.jpg` | Club jersey product image (used for both youth and adult cards) |
| `national_jersey_front.png` | Adult jersey image used in the order modal |
| `sponsor_*.avif / .png` | Sponsor logo images |
| `hero.jpg`, `gate.jpg` etc. | Background and section images |
| `bmx_kit_guide_*.pdf` | Downloadable kit guide PDFs (colour, home print, black & white) |

---

## The Club Shop

The shop page (`shop.html`) allows members to order:
- **Youth Race Jersey** — £32, sizes 5–6 through 13–14, personalised with rider name
- **Adult Race Jersey** — £35, sizes XS–XXL, personalised with rider name
- **Race Plate Stickers** — £25, includes side plate numbers, choice of red/yellow/blue, small or large

### How it works
1. Members add items to a basket on the site and enter their name and email address
2. They click "Pay Securely with SumUp" which redirects to SumUp Checkout
3. Payment is taken immediately
4. On return, the site confirms the payment with the `bmx-checkout` Cloudflare Worker
5. The Worker writes the order details to the club Google Sheet
6. The committee compiles orders from the Google Sheet and places a monthly bulk order with the supplier

### Opening and closing the order window
The shop has a toggle to open and close the order window. When closed, the product buttons are hidden and a "closed" message is shown.

To **open** the shop:
1. Edit `shop.html` in GitHub
2. Find the line near the top of the `<script>` block: `const ORDERS_OPEN = false;`
3. Change `false` to `true`
4. Commit the change — the shop will open within a minute

To **close** the shop: reverse the same change.

### To activate the shop for the first time
The shop page and checkout Worker are fully built. Before the shop can take payments:
1. The treasurer sets up a SumUp account at sumup.com and completes club verification
2. Obtain the API key and merchant code from the SumUp dashboard
3. Add them as secrets to the `bmx-checkout` Cloudflare Worker:
   - Secret name: `SUMUP_API_KEY`
   - Secret name: `SUMUP_MERCHANT_CODE`
4. Add column headers to row 1 of the Google Sheet: **Date, Name, Email, Product, Size, Colour, Rider Name, Race Number, Amount, Payment Reference, Status**
5. Test using SumUp's sandbox mode before going live (test card: `4111 1111 1111 1111`, any future expiry, any CVV)
6. Open the order window as described above

---

## The Contact Form

The contact form on the main page uses **Web3Forms** to send messages to merseysidebmx@gmail.com. It submits without leaving the page and shows a confirmation message.

If you ever need to change the recipient email address:
1. Log into web3forms.com
2. Find the form and update the email address

Or update `index.html` directly — search for `merseysidebmx@gmail.com` in the contact form section.

---

## The Riders Section

The riders section on the main page shows a grid of square profile cards. Each card shows a profile photo, race number and age category. Riders are split into National Race Team and Regional Race Team columns.

### Adding a new rider
1. Add the rider's photo to the GitHub repository (save as `.avif` or `.jpg`, named e.g. `firstname_lastname_123_male8s_RRT.avif`)
2. Edit `index.html` — find the riders section
3. Copy an existing rider card and update the image filename, name, race number and age category
4. Commit the change

Riders without a photo use `rider_placeholder.svg` until their photo is ready.

---

## The Sponsors Section

Sponsors appear in two places:
1. **Homepage** — a compact logo grid with links to each sponsor's website
2. **sponsors.html** — full page with descriptions and contact details

### Adding a new sponsor
1. Add their logo to the repository as `sponsor_companyname.avif` (preferred) or `.png`
2. Edit `index.html` — find the sponsors logos section and add a new tile
3. Edit `sponsors.html` — add a new sponsor card with description and contact details
4. Commit both changes

### Current sponsors
- Crave Digital — cravedigital.co.uk
- DC Cycles — dccycles.co.uk
- Kirkby Signs Ltd — kirkbysigns.com
- MAXIMEL Plastering Ltd — maximelplastering.com (email only)
- PWG Fabrications — pwgfabrications.co.uk
- Equistables — equistables.com
- The Burm — theburm.com
- e.parr photography — rootsandrain.com/photos/e-parr-photography
- Fuel Doctor — fueldoctoruk.co.uk

---

## Design & Styling

The site uses two fonts loaded from Google Fonts:
- **Bebas Neue** — headings, labels, numbers
- **DM Sans** — body text

The colour palette is defined in CSS custom properties at the top of each HTML file:

| Variable | Colour | Used for |
|----------|--------|----------|
| `--red` | #d42b2b | Primary accent, buttons, borders |
| `--blue` | #1a3d8f | Secondary accent |
| `--black` | #0f0f0f | Main dark background |
| `--dark` | #191919 | Section dark background |
| `--mid` | #2a2a2a | Cards, hover states |
| `--white` | #f6f6f6 | Light section background |

All CSS and JavaScript is written inline within each HTML file — there are no separate stylesheet or script files.

---

## Domain Setup *(when ready)*

When you're ready to point the club's own domain (e.g. merseysidebmx.co.uk) at the site:
1. Log into wherever the domain is registered
2. Update the DNS nameservers to point to Cloudflare (Cloudflare will provide the nameserver addresses)
3. In Cloudflare, add the domain to your account and configure it to point to the Pages project
4. Update the Web3Forms allowed domain to the new domain name
5. Update the domain reference in `privacy.html`

---

## Summary of Monthly Costs

| Service | Cost |
|---------|------|
| GitHub | Free |
| Cloudflare Pages + Workers | Free |
| Web3Forms | Free |
| SumUp | Free (per-transaction fee only, charged when shop orders are placed) |
| Google Sheets | Free |
| **Total fixed cost** | **£0/month** |

---

*Document last updated: May 2026*
