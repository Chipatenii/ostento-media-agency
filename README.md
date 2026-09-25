# Ostento

Marketing site for Ostento, a design, development, and brand studio.
Tagline: **Simple solutions for everyday business problems.**

A multi-page studio site with a photographic homepage, a filterable portfolio across five disciplines, standalone Studio, Clients and reviews, Process, and FAQ pages, an Academy waitlist, a full legal set, a floating WhatsApp link, and a cookie banner. Static HTML, CSS, and vanilla JavaScript. No build step.

**Ostento Media Agency** is a registered trading name in Zambia (PACRA No. 320230069962) and is based in Lusaka.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | Home: hero, numbers, services, featured work, project inquiry |
| `portfolio.html` | Filterable portfolio: websites, company profiles, logos, digital marketing, print media |
| `studio.html` | Studio overview, delivery approach, and illustrated project activity |
| `clients.html` | Placeholder client logo carousel and Trustmary reviews |
| `process.html` | Discovery through launch process |
| `faq.html` | Frequently asked questions |
| `academy.html` | Academy "coming soon" waitlist capture |
| `terms.html`, `privacy.html`, `refund-policy.html`, `cookies.html` | Policy pages |
| `assets/css/style.css` | Design system (cream page, orange primary, navy accent tokens, one type scale, three radii plus a named pill) |
| `assets/js/script.js` | Nav, reveal, FAQ, portfolio filter, client carousel, Trustmary loader, modal, cookie consent, forms, old homepage hash redirects |
| `robots.txt`, `sitemap.xml` | Crawl directives for the GitHub Pages URL; update them if a custom domain is used |
| `tools/capture-thumbnails.py` | Screenshots each live client homepage and wires it into the cards |

## Colour

Cream is the page, white is the card, orange is the primary, navy is the accent.
Every colour is a token in `:root`, so the scheme is changed in one place:

| Token | Role |
|---|---|
| `--cream`, `--cream-2` | Page background and the one step down from it |
| `--white` / `--surface` | Cards, panels, the inquiry block, modals |
| `--orange` | Primary fills: buttons, the heat ramp, indicators |
| `--orange-ink` | Orange as *text* or a small mark. `--orange` only reaches 2.7:1 on cream, so it is never used for type |
| `--navy` | Accent: ink, the footer block, selected filter pills, placeholder media tiles |
| `--field-bg` | Input fill. White on the cream page, flipped to cream inside white panels so one field component reads in both |
| `--act-0` to `--act-3` | Activity heat ramp, read by both the CSS legend and the JS that fills the grid |

`assets/images/logo.png` is the white wordmark for the navy footer;
`assets/images/logo-navy.png` is the same mark recoloured for the cream header.

## Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Adding content

No database, no CMS, no data file. Content lives in the HTML, which is what
keeps it visible to search engines, to link previews on Facebook, LinkedIn and
WhatsApp, and to anyone browsing with JavaScript off. Each list has a paste
template sitting in a comment right where the items go.

**A project:** open `portfolio.html`, find the template comment at the top of
the card grid, copy the block, paste it above the comment, and fill in five
fields. Set `data-category` to one of `websites`, `profiles`, `logos`,
`marketing`, `print`. Delete `data-example` so the amber badge goes away. Add
`data-featured` to the three you want on the home page, and copy those three
into the featured strip in section 04 of `index.html`.

Filter counts, search, and the section totals all read the DOM, so there is
nothing else to update. Match the media shape to the discipline, since a logo
in a 16/10 box letterboxes and an A4 page crops:

| Discipline | Media classes |
|---|---|
| Websites, digital marketing | `work-card__media--wide` with `wm-a` or `wm-b` |
| Company profiles, print media | `work-card__media--portrait` with `wm-c` or `wm-d` |
| Logos | `work-card__media--square` with `wm-a` |

With a real image, swap the `wm-mono` tile for an `<img>`. For logo artwork add
`work-card__media--plate`, which puts the mark on a plain white plate so a mark
carrying its own background does not collide with the cream page.

**Thumbnails for live websites** are generated rather than made by hand:

```bash
python3 tools/capture-thumbnails.py
```

It screenshots each homepage listed in the script at 1280x800, the exact 16:10
ratio the website cards use, writes an optimised JPEG to `assets/images/work/`,
and swaps that card's monogram tile for an `<img>` in both `portfolio.html` and
`index.html`. Add a line to `SITES` in the script when you add a site. Re-running
refreshes the images and leaves already-wired cards alone, so it is safe to run
again after a client redesigns.

**Client logos and reviews:** replace the six neutral placeholder marks in `clients.html` with approved logo files. The Reviews tab loads the Trustmary widget when opened. Manage which reviews appear in the Trustmary widget settings.

## Before launch: replace the placeholders

Every unfilled value is marked in the source and rendered in amber with a dashed
underline, so none of them can ship looking real. List them all:

```bash
grep -rn 'data-todo\|your-form-id' . --include=*.html --include=*.txt --include=*.xml
```

| What | Where | Until then |
|---|---|---|
| **Custom domain** | If introduced, update `robots.txt`, `sitemap.xml`, and the `TODO(domain)` comments in older page heads | The sitemap currently uses the GitHub Pages URL |
| **Form endpoint** | `your-form-id` in `index.html` and `academy.html` | `script.js` detects the placeholder and fakes a success. This must not ship. |
| **Instagram URL** | `data-todo="social-instagram"`, commented stub in all footers | Facebook and LinkedIn ship; Instagram is absent rather than dead |
| **Client names** | `data-todo="client"` on the example cards | "Client" in amber |
| **Real projects** | Seven remaining example cards in `portfolio.html` | Amber "Example" badge on each |
| **Website thumbnails** | Seven live client sites have cards but no images | Monogram tiles until `tools/capture-thumbnails.py` is run |
| **Website results** | The seven live sites carry no `work-card__result` line | Omitted rather than invented. Add one per card when you have a result worth stating |
| **Client logos** | `clients.html` | Six neutral placeholder marks until approved logos are supplied |
| **Project images** | None on disk | Monogram tiles, which are a designed state |
| **Share image** | `og:image` points at `hero.jpg`, a 1920x1280 3:2 crop | Platforms crop it to 1.91:1. A purpose-built 1200x630 card would be better |
| **Section 01 numbers** | "20+", "10+", "5+" in `index.html` | Asserted as fact and currently unsourced. Confirm or change them |

Review markup is left to the Trustmary widget on `clients.html`. Do not add manually asserted `Review` or `AggregateRating` JSON-LD for reviews the page does not display. The `ItemList` is also left out of `portfolio.html` while cards are examples.

Have a qualified lawyer review the legal pages, and for EU exposure someone
familiar with GDPR, before launch.

## Notes

- **Mobile first.** Components added since the portfolio work are written
  mobile first with `min-width` queries at 620px and 1001px. The older CSS is
  desktop first at 1000px, 760px, and 460px, and was left that way rather than
  inverting 800 lines; its specific mobile problems were fixed in place.
- `body { overflow-x: hidden }` is load-bearing, because the Academy `.hero__glow`
  overflows by design. It also hides horizontal overflow bugs, so disable it in
  devtools when checking a new component at 360px.
- Portfolio cards deliberately carry no `.reveal` class. That observer
  unobserves on first intersection, so a card hidden at load would stay at
  opacity 0 once a filter revealed it. JS applies the enter state instead.
- The portfolio filter is a toolbar of `aria-pressed` buttons. The Clients and reviews page uses a two-panel tablist; its logo carousel supports touch swipe and pauses autoplay on focus, hover, reduced motion, and when hidden.
- The activity heatmap is generated from a sine wave and deterministic noise.
  It carries a caption saying so. It is not delivery history.
- Fonts (Space Grotesk, Inter) load from Google Fonts with a system fallback.
- The site honours `prefers-reduced-motion` with a calm, static variant.
- Cookie consent is opt-in for non-essential cookies, stored per visitor in
  `localStorage`; the footer "Cookie Settings" link reopens it at any time.
