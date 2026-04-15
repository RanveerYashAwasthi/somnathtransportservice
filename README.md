# Somnath Transport Service Website

Three-page static website for Somnath Transport Service with a Vercel-ready email quote endpoint.

## Structure

- `index.html`: Home page
- `services/index.html`: Services page
- `contact/index.html`: Contact and quote page
- `assets/css/styles.css`: Shared visual system and responsive layout
- `assets/js/main.js`: Navigation and quote form behavior
- `assets/img/`: Brand and social assets
- `api/quote.js`: Serverless quote email endpoint for Vercel

## Quote Email Setup

The contact form posts to `/api/quote` and sends the submission to the business inbox through Resend.

1. Create a Resend account.
2. Verify a sending domain or subdomain you control.
3. Copy `.env.example` values into Vercel environment variables.
4. Set `QUOTE_EMAIL_FROM` to a verified sender identity.
5. Set `QUOTE_EMAIL_TO` to the inbox that should receive quote requests.

Required environment variables:

- `RESEND_API_KEY`
- `QUOTE_EMAIL_TO`
- `QUOTE_EMAIL_FROM`
- `ALLOWED_ORIGIN`

## Deploy on Vercel

1. Create a new Vercel project from this folder.
2. Keep the project as a static site with the built-in `api/` serverless function.
3. Add the environment variables from `.env.example`.
4. Deploy.
5. Test the site on the Vercel preview URL before changing DNS.

## Connect the GoDaddy Domain

1. In Vercel, add your production domain.
2. Let Vercel show the required DNS records.
3. In GoDaddy DNS, add the Vercel records exactly as shown.
4. Remove any stale records that conflict with the new Vercel records.
5. Wait for DNS to propagate.
6. Re-test the live domain, the `/contact/` form, and click-to-call links.

## Launch Checklist

1. Replace placeholder social URLs if you have real profiles.
2. Replace placeholder address, testimonials, and proof points if available.
3. Confirm `https://somnathtransportservice.com` is the final production domain. If it is different, update:
   - canonical tags in the HTML files
   - Open Graph URLs in the HTML files
   - `robots.txt`
   - `sitemap.xml`
   - `ALLOWED_ORIGIN`
4. Submit a real quote request and confirm the email arrives in the target inbox.
5. Test mobile click-to-call behavior on a phone.

## Cloudflare Note

This implementation targets Vercel directly. If you later decide to host on Cloudflare instead, the static pages can move easily, but `api/quote.js` should be rewritten as a Cloudflare Worker or Pages Function before launch.