#!/usr/bin/env python3
"""Apply the site's search settings from one place.

Run from the project root after changing SITE_URL or adding a page:

    python3 tools/seo.py

For every page in PAGES it:
  - writes <link rel="canonical"> and og:url with the absolute page address
  - makes og:image and twitter:image absolute
  - rewrites relative "url" and "logo" values inside JSON-LD blocks
and then regenerates sitemap.xml and robots.txt.

Safe to re-run. Only the tags listed above are touched. See SEO.md.
"""

import datetime
import os
import re

# The live address of the site, with a trailing slash. Change this one line
# when a custom domain goes live, then re-run the script.
SITE_URL = "https://www.ostentomedia-agency.com/"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# page, sitemap priority, change frequency
PAGES = [
    ("index.html",                           "1.0", "monthly"),
    ("services.html",                        "0.9", "monthly"),
    ("contact.html",                         "0.9", "yearly"),
    ("portfolio.html",                       "0.8", "monthly"),
    ("clients.html",                         "0.7", "monthly"),
    ("process.html",                         "0.6", "yearly"),
    ("academy.html",                         "0.6", "monthly"),
    ("terms.html",                           "0.2", "yearly"),
    ("privacy.html",                         "0.2", "yearly"),
    ("refund-policy-and-payment-terms.html", "0.2", "yearly"),
    ("cookies.html",                         "0.2", "yearly"),
]


def page_url(page):
    return SITE_URL if page == "index.html" else SITE_URL + page


def absolute(path):
    """Point a site path at SITE_URL. Also re-points an address written for an
    earlier SITE_URL. Anything else absolute is left alone."""
    if re.match(r"https?://", path):
        pages = "|".join(re.escape(p) for p, _, _ in PAGES)
        m = re.match(r"^https?://.*?/((?:assets/.*|%s)?)$" % pages, path)
        if not m:
            return path
        path = m.group(1)
    path = path.lstrip("/")
    return SITE_URL if path in ("", "index.html") else SITE_URL + path


def apply(page):
    path = os.path.join(ROOT, page)
    html = open(path, encoding="utf-8").read()
    url = page_url(page)

    # Drop the old reminder comment now that the tags are written.
    html = re.sub(r"\n[ \t]*<!-- TODO\(domain\).*?-->", "", html, flags=re.S)

    for prop in ("og:image", "twitter:image"):
        attr = "property" if prop.startswith("og:") else "name"
        html = re.sub(
            r'(<meta %s="%s" content=")([^"]+)(">)' % (attr, re.escape(prop)),
            lambda m: m.group(1) + absolute(m.group(2)) + m.group(3), html)

    tags = ('    <link rel="canonical" href="%s">\n'
            '    <meta property="og:url" content="%s">\n') % (url, url)
    html = re.sub(r'[ \t]*<link rel="canonical" href="[^"]*">\n', "", html)
    html = re.sub(r'[ \t]*<meta property="og:url" content="[^"]*">\n', "", html)
    html = html.replace('    <meta property="og:site_name"', tags + '    <meta property="og:site_name"', 1)

    def fix_jsonld(block):
        return re.sub(r'("(?:url|logo|image|@id)":\s*")([^"#]*)(#[^"]*)?(")',
                      lambda m: m.group(1) + absolute(m.group(2)) + (m.group(3) or "") + m.group(4),
                      block.group(0))
    html = re.sub(r'<script type="application/ld\+json">.*?</script>', fix_jsonld, html, flags=re.S)

    open(path, "w", encoding="utf-8").write(html)


def write_sitemap():
    today = datetime.date.today().isoformat()
    rows = "\n".join(
        "    <url><loc>%s</loc><lastmod>%s</lastmod><changefreq>%s</changefreq><priority>%s</priority></url>"
        % (page_url(p), today, freq, prio) for p, prio, freq in PAGES)
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s\n</urlset>\n' % rows)
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(xml)


def write_robots():
    txt = ("User-agent: *\n"
           "Allow: /\n"
           "\n"
           "Sitemap: %ssitemap.xml\n" % SITE_URL)
    open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8").write(txt)


if __name__ == "__main__":
    for page, _, _ in PAGES:
        apply(page)
    write_sitemap()
    write_robots()
    print("Updated %d pages, sitemap.xml and robots.txt for %s" % (len(PAGES), SITE_URL))
