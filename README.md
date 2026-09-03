# Ostento

Marketing site for Ostento, a design, development, and brand studio.
Tagline: **Simple solutions for everyday business problems.**

A dark, single-page, scroll-driven studio site (sections 00 to 11) with a WebGL 3D
hero, an Academy call to action, a full legal set, and a GDPR cookie banner. Built
as static HTML, CSS, and vanilla JavaScript. No build step.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | Single page: hero, numbers, services, work, studio, process, FAQ, system, activity, inquiry, footer |
| `academy.html` | Academy "coming soon" waitlist capture |
| `terms.html`, `privacy.html`, `refund-policy.html`, `cookies.html` | Policy pages |
| `assets/css/style.css` | Design system (navy + orange tokens, one type scale, three radii) |
| `assets/js/script.js` | Nav, scroll reveal, FAQ, activity grid, 3D hero, cookie consent, forms |
| `assets/images/` | Logo, favicons, optimized hero image |

## Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Before launch: replace the placeholders

These are marked with `TODO` comments or the string `your-form-id` in the source.

- **Form endpoint:** replace `https://formspree.io/f/your-form-id` in `index.html` and
  `academy.html` with your real Formspree (or Supabase) endpoint. The form already handles
  validation, a loading state, and a success message.
- **Contact email:** `hello@ostentomedia.com` in the footer and policy pages.
- **Social links:** the Instagram, X, and LinkedIn URLs in the footer.
- **Academy link:** currently points at the local `academy.html`; repoint when the Academy is live.
- **Work section:** swap the placeholder case-study cards in `index.html` for real client
  names, images, and results.
- **Legal pages:** written as plain-language templates. Have a qualified lawyer (and, for EU
  exposure, someone familiar with GDPR) review them before launch.

## Notes

- `three.js` for the 3D hero loads from a CDN; if it is blocked or unsupported, the hero
  falls back to the static glow and text with no error.
- Fonts (Space Grotesk, Inter) load from Google Fonts with a system fallback stack.
- The site honours `prefers-reduced-motion` with a calm, static variant.
- Cookie consent is opt-in for non-essential cookies and stored per visitor in `localStorage`;
  the footer "Cookie Settings" link reopens the preferences at any time.
