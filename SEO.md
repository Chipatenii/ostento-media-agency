# SEO plan for Ostento Media Agency

How this site is set up to appear in Google Search, Google Maps and other Google
services for each of its services, and what still has to be done outside the code.

Site address used in all tags: `https://chipatenii.github.io/ostento-media-agency/`
(set once in `tools/seo.py`).

## 1. What is already in the code

| Item | Where | What it does |
|---|---|---|
| Page titles and meta descriptions | `<head>` of every page | Each names the service and "Lusaka" or "Zambia", so the page matches local searches |
| Canonical URL and `og:url` | Every indexable page | Tells Google which address is the real one and prevents duplicate listings |
| Absolute `og:image` and `twitter:image` | Every indexable page | Reliable link previews on WhatsApp, Facebook, LinkedIn and X |
| `ProfessionalService` and `WebSite` structured data | `index.html` | Business name, logo, phone, email, Lusaka address, PACRA number, areas served, social profiles (`sameAs`) and a catalogue of all five services |
| `ItemList` of `Service` entries | `services.html` | One entry per service, each linked to its section, image and the business |
| `ContactPage` structured data | `contact.html` | Connects the quote page to the business and its contact details |
| `CollectionPage` structured data | `portfolio.html` | Marks the portfolio as part of the site and about the business |
| `sitemap.xml` | Site root | Every indexable page with `lastmod`, change frequency and priority |
| `robots.txt` | Site root | Allows crawling and points to the sitemap |
| `noindex` on `studio.html` and `refund-policy.html` | Redirect pages | Old addresses forward to the new pages without competing in results |

All structured data uses one shared `@id` (`…/#organization`), so Google reads
the homepage, services, contact and portfolio pages as one business.

## 2. Services and the searches each page targets

| Service | Page and section | Main searches to target |
|---|---|---|
| Website and web app development | `services.html#websites` | web design Lusaka, website developers in Zambia, web app development Zambia, business website design |
| Custom business software | `services.html#software` | ERP system Zambia, loan management system Zambia, custom business software Lusaka, microfinance software |
| Digital marketing | `services.html#marketing` | social media management Lusaka, digital marketing agency Zambia, Facebook advertising Zambia |
| Branding and graphic design | `services.html#branding` | logo design Lusaka, graphic designer Zambia, company profile design, brand identity Zambia |
| Large format printing | `services.html#printing` | banner printing Lusaka, roll-up banners Zambia, signage printing Lusaka, large format printing |
| Training | `academy.html` | graphic design course Lusaka, web development course Zambia, digital marketing training |
| Quotes | `contact.html` | (brand searches) Ostento quote, Ostento Media Agency contact |

Rules when editing copy:

- Write for people first. Use the phrases above where they read naturally, once
  in a heading or first paragraph, not repeated.
- Keep titles under about 65 characters and descriptions between 120 and 160.
- Every page has one `<h1>`. Service names stay in `<h2>` headings on `services.html`.
- Give every new image a descriptive `alt` and keep the responsive WebP files.

## 3. Google services to set up (outside the code)

These are the steps that make the business appear in Google results and on
Google Maps. Do them in this order.

### Google Search Console

1. Go to <https://search.google.com/search-console> and add a **URL prefix**
   property for the site address above.
2. Verify with the **HTML tag** method: paste the `google-site-verification`
   meta tag Google gives you into the `<head>` of `index.html`, just under
   `<meta name="theme-color">`, then push. Keep the tag in place permanently.
3. Under **Sitemaps**, submit `sitemap.xml`.
4. Use **URL Inspection** on the homepage and `services.html`, then
   **Request indexing**.
5. Check **Enhancements** and the Rich Results Test
   (<https://search.google.com/test/rich-results>) for structured data errors.

### Google Business Profile

This is what puts Ostento on Google Maps and in the local business panel for
searches such as "printing near me" or "web design Lusaka".

1. Create or claim the profile at <https://business.google.com>.
2. Name: **Ostento Media Agency**, exactly as on the site.
3. Primary category: **Marketing agency**. Additional categories: **Website
   designer**, **Software company**, **Graphic designer**, **Sign shop** or
   **Printing service**.
4. Add each of the five services under **Services**, using the same names and
   descriptions as `services.html`.
5. Phone `+260 770 381 593`, website the homepage address, service area Lusaka
   and Zambia. Use the same details everywhere (site, profile, Facebook,
   LinkedIn, Instagram, directories). Consistent name, address and phone is a ranking
   factor for local results.
6. Upload the logo, the service photos from `assets/images/services/` and
   project images from `assets/images/work/`.
7. Ask happy clients for Google reviews and reply to every review.

### Bing Webmaster Tools (optional)

Import the site straight from Search Console at <https://www.bing.com/webmasters>.
This also covers DuckDuckGo and Yahoo.

## 4. Moving to a custom domain

Search engines rank the address in the canonical tags, so do this as soon as a
domain such as `ostentomedia-agency.com` points at the site:

1. Edit `SITE_URL` in `tools/seo.py`.
2. Run `python3 tools/seo.py`. It rewrites canonical URLs, `og:url`, share
   images, structured data addresses, `sitemap.xml` and `robots.txt`.
3. Add a `CNAME` file for GitHub Pages and configure DNS.
4. Add the new domain as a **Domain** property in Search Console, submit the
   sitemap again and use **Change of address** from the old property.
5. Update the website link in the Google Business Profile and social profiles.

Note: on a GitHub Pages project address, Google reads `robots.txt` from the
domain root (`chipatenii.github.io/robots.txt`), not from this folder. The
sitemap still works when submitted in Search Console. Both files take full
effect on a custom domain.

## 5. Maintenance checklist

- Adding a page: copy the head of an existing page, add the page to `PAGES` in
  `tools/seo.py`, run the script.
- Changing service names: update `services.html`, the `hasOfferCatalog` in
  `index.html`, the `ItemList` in `services.html` and the Business Profile.
- After a content change: run `python3 tools/seo.py` so `lastmod` in the
  sitemap is refreshed.
- Monthly: check Search Console **Performance** for the searches that bring
  visitors and **Pages** for indexing errors.
- Do not add `Review` or `AggregateRating` markup for reviews that are not
  shown as text on the page. Google treats that as spam.
- A purpose-built 1200x630 share image would improve link previews.
  `hero.jpg` is a 3:2 crop that platforms trim to 1.91:1.
