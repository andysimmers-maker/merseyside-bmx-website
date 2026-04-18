# Merseyside BMX Club — Website Handover Guide

This document explains everything about the club website: how it was built, where it's hosted, what services it uses, and how to maintain or hand it over to someone else.

---

## Overview

The website is a static HTML site — no WordPress, no database, no complex framework. It's a set of plain HTML, CSS and JavaScript files that are hosted on Cloudflare. This keeps it fast, cheap (free), and simple to maintain.

**Live site:** merseyside-bmx-website.andy-simmers.workers.dev  
*(When the club domain is pointed here this will change to the club's own domain)*

---

## Accounts You Need Access To

There are four services involved in running the site. Whoever takes over the site needs the login details for all of them. These should be stored securely (e.g. in a password manager or a sealed envelope with the club secretary).

### 1. GitHub
**What it is:** Where all the website files are stored. Every change to the site is made here.  
**Account:** Personal account (Andy Simmers)  
**Repository:** `merseyside-bmx-website`  
**URL:** github.com  
**Free:** Yes  
**To hand over:** Add the new person as a collaborator on the repository, or transfer the repository to their account.

### 2. Cloudflare
**What it is:** Where the website is hosted and served to visitors. Connected to GitHub — any change pushed to GitHub automatically deploys to the live site within a minute or two.  
**Account:** Personal account (Andy Simmers)  
**Project:** merseyside-bmx-website  
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

### 4. Stripe *(shop — not yet activated)*
**What it is:** Handles online payments for the club shop (jerseys, race plate stickers).  
**Status:** Account needs to be set up and connected before the shop checkout works.  
**URL:** stripe.com  
**Cost:** No monthly fee — Stripe charges 1.5% + 25p per transaction (UK rate). Money pays out to the club's linked bank account automatically.  
**To hand over:** Transfer the Stripe account to the new treasurer/responsible person.

---

## How to Make Changes to the Site

All changes are made through GitHub. You don't need to know how to code for simple text changes.

### Making a text change
1. Go to **github.com** and log in
2. Open the `merseyside-bmx-website` repository
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

The website is made up of these files:

| File | What it is |
|------|-----------|
| `index.html` | The main page — contains About, Sessions, Shop teaser, Join, Coaches, Riders, Contact and Sponsors sections |
| `shop.html` | The club shop page — jerseys and race plate stickers |
| `sponsors.html` | Full sponsors page with contact details for each sponsor |
| `faq.html` | Frequently asked questions |
| `conduct.html` | Code of Conduct — links to the waiver form |
| `logo.png` | Club logo |
| `rider_jaxon.jpg` | Rider photo — Jaxon |
| `rider_placeholder.svg` | Silhouette placeholder used for riders without a photo yet |
| `coach_placeholder.svg` | Silhouette placeholder used for coaches without a photo yet |
| `quillan.webp` | Coach photo — Quillan Isidore |
| `stickers.jpg` | Race plate sticker product image |
| `jersey_regional.jpg` | Youth jersey product image |
| `national_jersey_front.png` | Adult jersey product image |
| `sponsor_*.avif / .png` | Sponsor logo images |
| `hero.jpg`, `gate.jpg` etc. | Background/section images |
| `netlify/functions/create-checkout.js` | Stripe checkout function *(needs updating for Cloudflare Workers when shop is activated)* |

---

## The Club Shop

The shop page (`shop.html`) allows members to order:
- **Youth Race Jersey** — £32, sizes 5–6 through 13–14, personalised with rider name
- **Adult Race Jersey** — £35, sizes XS–XXL, personalised with rider name
- **Race Plate Stickers** — £25, includes side plate numbers, choice of red/yellow/blue, small or large

### How it works
1. Members add items to a basket on the site
2. They click "Pay Securely with Stripe" which redirects to Stripe Checkout
3. Payment is taken immediately
4. Money pays out to the club bank account automatically via Stripe
5. Orders are visible in the Stripe dashboard for the club to compile monthly bulk orders

### To activate the shop
The shop page is fully built but the Stripe payment function needs to be set up:
1. Create a Stripe account at stripe.com and complete club verification
2. Get the secret key from Stripe Dashboard → Developers → API keys
3. The checkout function (`netlify/functions/create-checkout.js`) needs rewriting for Cloudflare Workers — this is a small code change (see notes below)
4. Deploy the Worker and connect it to the shop page

### Cloudflare Workers note
The checkout function was originally written for Netlify. On Cloudflare it needs to be deployed as a Worker. The logic is identical — only the wrapper syntax changes. A developer or AI assistant can do this conversion in about 15 minutes.

---

## The Contact Form

The contact form on the main page uses **Web3Forms** to send messages to merseysidebmx@gmail.com. It submits without leaving the page and shows a confirmation message.

If you ever need to change the recipient email address:
1. Log into web3forms.com
2. Find the form
3. Update the email address

Or update the `index.html` file directly — search for `merseysidebmx@gmail.com` in the contact form section and change it.

---

## The Riders Section

The riders section on the main page shows a grid of square profile cards. Each card shows:
- A profile photo (square format, with the rider's name styled on the image)
- Race number
- Age category

### Adding a new rider
1. Add the rider's photo to the GitHub repository (name it something like `rider_firstname.jpg`)
2. Edit `index.html` — find the riders section
3. Copy an existing rider card and update the image filename, race number and age category
4. Commit the change

### The photo style
Profile photos are created by a young club member. They are square format with the rider's name as large styled text on the image. The photo should be saved as a JPG or WEBP file.

Riders without a photo use `rider_placeholder.svg` — a simple silhouette — until their photo is ready.

---

## The Sponsors Section

Sponsors are shown in two places:
1. **Homepage** — a compact logo grid with links to each sponsor's website
2. **sponsors.html** — full page with descriptions and contact details for each sponsor

### Adding a new sponsor
1. Add their logo image to the repository (name it `sponsor_companyname.avif` or `.png`)
2. Edit `index.html` — find the sponsors logos section and add a new tile
3. Edit `sponsors.html` — add a new sponsor card with their description and contact details
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

The colour palette is defined in CSS variables at the top of each HTML file:

| Variable | Colour | Used for |
|----------|--------|----------|
| `--red` | #d42b2b | Primary accent, buttons, borders |
| `--blue` | #1a3d8f | Secondary accent |
| `--black` | #0f0f0f | Main dark background |
| `--dark` | #191919 | Section dark background |
| `--mid` | #2a2a2a | Cards, hover states |
| `--white` | #f6f6f6 | Light section background |

---

## Domain Setup *(when ready)*

When you're ready to point the club's own domain (e.g. merseysidebmx.co.uk) at the new site:
1. Log into wherever the domain is registered
2. Update the DNS nameservers to point to Cloudflare (Cloudflare will give you the nameserver addresses)
3. In Cloudflare, add the domain to your account and configure it to point to the Pages project
4. Update the Web3Forms allowed domain to the new domain name

---

## Summary of Monthly Costs

| Service | Cost |
|---------|------|
| GitHub | Free |
| Cloudflare Pages | Free |
| Web3Forms | Free |
| Stripe | Free (1.5% + 25p per transaction, only when shop orders are placed) |
| **Total fixed cost** | **£0/month** |

---

*Document last updated: April 2026*
