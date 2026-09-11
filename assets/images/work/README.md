# Project thumbnails

Generated, not hand-made. From the project root:

```bash
python3 tools/capture-thumbnails.py
```

That screenshots each live client homepage at 1280x800 (16:10, the exact ratio
the website cards use, so nothing is cropped), saves an optimised JPEG here
named after the card's `data-slug`, and swaps that card's monogram tile for an
`<img>` in both `portfolio.html` and `index.html`.

Re-running refreshes the images. A card that is already wired is left alone, so
it is safe to run at any time, for example after a client redesigns their site.

Until a thumbnail exists, the card shows its monogram tile, which is a designed
state rather than a gap.
