# Project thumbnails

The seven supplied client screenshots are stored as optimized WebP images:

| Portfolio card | File stem |
| --- | --- |
| Flaxio Investment | `flaxio-investment` |
| African Aesthetics Spa | `african-aesthetics-spa` |
| Consulting Flamingo | `consulting-flamingo` |
| Sekoma Energy | `sekoma-energy` |
| JMG Investment | `jmg-investment` |
| Ann Chota Legal Practitioners | `ann-chota-legal` |
| Mwembeshi Chemicals | `mwembeshi-chemicals` |

Each main image is **1280x720**, with a **640x360** sibling ending in
`-640.webp` for smaller screens. Both use 16:9 proportions. Images are resized
with Lanczos resampling and encoded at WebP quality 90. The crop is anchored
at the top to preserve navigation and branding without stretching the page.
The HTML uses `srcset`, `sizes`, explicit dimensions and lazy loading.

Use the supplied screenshots when updating these files.

## Company profile mockups

Geonsi Engineering Limited (`geonsi-engineering`) and Hems Technologies
Limited (`hems-technologies`) use supplied landscape mockups. Each main WebP
is **960x640**, with a **480x320** sibling ending in `-480.webp`. The cards
use a matching 3:2 frame. These assets use Lanczos resampling, a centered
crop and WebP quality 90, with no upscaling from the supplied source images.
Both cards open a larger image preview using the existing project modal.

## Optional live captures

For projects without a supplied screenshot, run from the project root:

```bash
python3 tools/capture-thumbnails.py
```

That screenshots each live client homepage at 1280x800, saves an optimised JPEG here
named after the card's `data-slug`, and swaps that card's monogram tile for an
`<img>` in both `portfolio.html` and `index.html`.

It only rewrites monogram cards. Existing cards using the supplied WebP
screenshots retain their image references. Live captures use a different
aspect ratio and will be cropped to the website cards' 16:9 frame.

Until a thumbnail exists, the card shows its monogram tile, which is a designed
state rather than a gap.
