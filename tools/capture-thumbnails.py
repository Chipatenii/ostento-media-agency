#!/usr/bin/env python3
"""Capture a homepage screenshot for each live client site and wire it into the
portfolio.

Run from the project root:

    python3 tools/capture-thumbnails.py

It needs Chrome or Chromium installed. Nothing else is required; Pillow is used
to produce a small JPEG if it is present, and the script falls back to PNG if it
is not (`python3 -m pip install Pillow` for the smaller files).

Safe to re-run. Re-capturing refreshes the images; the HTML is only rewritten
once per card.
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "images", "work")
PAGES = ["portfolio.html", "index.html"]

# slug, display name, URL. Add a line here when you add a site to the portfolio.
SITES = [
    ("flaxio-investment",      "Flaxio Investment",            "https://flaxioinvestment.com/"),
    ("african-aesthetics-spa", "African Aesthetics Spa",       "https://africanaestheticsspa.com/"),
    ("consulting-flamingo",    "Consulting Flamingo",          "https://www.consultingflamingo.com/"),
    ("sekoma-energy",          "Sekoma Energy",                "https://sekomaenergy.com/"),
    ("jmg-investment",         "JMG Investment",               "https://www.jmginvestment.com/"),
    ("ann-chota-legal",        "Ann Chota Legal Practitioners", "https://annchotalegalpractitioners.com/"),
]

# 1280x800 is exactly 16:10, which is the ratio the website cards use, so the
# shot needs no cropping.
WIDTH, HEIGHT = 1280, 800

CHROME_CANDIDATES = [
    os.environ.get("CHROME"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "google-chrome", "google-chrome-stable", "chromium", "chromium-browser",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
]


def find_chrome():
    for cand in CHROME_CANDIDATES:
        if not cand:
            continue
        if os.path.isfile(cand):
            return cand
        found = shutil.which(cand)
        if found:
            return found
    return None


def capture(chrome, url, png_path):
    cmd = [
        chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--no-sandbox", "--force-device-scale-factor=1",
        "--window-size=%d,%d" % (WIDTH, HEIGHT),
        "--screenshot=" + png_path,
        "--virtual-time-budget=15000",
        url,
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90)
    return os.path.isfile(png_path) and os.path.getsize(png_path) > 0


def to_jpeg(png_path, jpg_path):
    """Return the filename actually written, preferring a small JPEG."""
    try:
        from PIL import Image
    except ImportError:
        fallback = os.path.splitext(jpg_path)[0] + ".png"
        shutil.move(png_path, fallback)
        return os.path.basename(fallback)
    img = Image.open(png_path).convert("RGB")
    img.save(jpg_path, "JPEG", quality=82, optimize=True, progressive=True)
    os.remove(png_path)
    return os.path.basename(jpg_path)


def wire_html(slug, name, filename):
    """Swap the monogram tile for the captured image. Idempotent."""
    changed = []
    for page in PAGES:
        path = os.path.join(ROOT, page)
        if not os.path.isfile(path):
            continue
        with open(path, encoding="utf-8") as fh:
            src = fh.read()
        # Only ever matches a tile that still holds the monogram spans, so a
        # card that is already wired is left alone and re-running is safe.
        pattern = re.compile(
            r'([ \t]*)<div class="work-card__media work-card__media--wide wm-a wm-mono"'
            r' data-thumb="%s" aria-hidden="true">\s*'
            r'<span class="wm-mono__glyph">[^<]*</span>\s*'
            r'<span class="wm-mono__cat">[^<]*</span>\s*'
            r'</div>' % re.escape(slug)
        )

        def build(match):
            # Reuse the card's own indentation rather than assuming a depth:
            # the homepage strip sits deeper than the portfolio grid.
            indent = match.group(1)
            return (
                '%s<div class="work-card__media work-card__media--wide" data-thumb="%s">\n'
                '%s    <img src="assets/images/work/%s" alt="Homepage of %s"'
                ' loading="lazy" decoding="async">\n'
                '%s</div>' % (indent, slug, indent, filename, name, indent)
            )

        new, n = pattern.subn(build, src)
        if n:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(new)
            changed.append("%s x%d" % (page, n))
    return changed


def main():
    chrome = find_chrome()
    if not chrome:
        sys.exit("Could not find Chrome or Chromium. Set CHROME=/path/to/chrome and re-run.")
    print("Using %s\n" % chrome)
    os.makedirs(OUT_DIR, exist_ok=True)

    failures = []
    for slug, name, url in SITES:
        sys.stdout.write("%-26s " % slug)
        sys.stdout.flush()
        tmp = os.path.join(tempfile.gettempdir(), slug + ".png")
        if not capture(chrome, url, tmp):
            print("FAILED to capture %s" % url)
            failures.append(slug)
            continue
        filename = to_jpeg(tmp, os.path.join(OUT_DIR, slug + ".jpg"))
        size_kb = os.path.getsize(os.path.join(OUT_DIR, filename)) / 1024.0
        wired = wire_html(slug, name, filename)
        print("%-22s %6.0f KB   %s" % (filename, size_kb, ", ".join(wired) or "already wired"))

    print("\n%d/%d captured." % (len(SITES) - len(failures), len(SITES)))
    if failures:
        print("Failed: %s" % ", ".join(failures))
        print("Check the sites load in a normal browser, then re-run.")
    else:
        print("Review the pages, then commit assets/images/work/ with the HTML changes.")


if __name__ == "__main__":
    main()
