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

## Print media

The Zambia Mining and Investment Insaka hanging banner uses the supplied
image as `zambia-mining-insaka-banner.webp` at **800x672**, with a
**400x336** sibling ending in `-400.webp`. A matching 25:21 frame keeps the
banner and its setting visible. Assets use Lanczos resampling and WebP
quality 90. The card opens a larger preview in the project modal.

## Logo presentations

Audacia Security Ltd (`audacia-security-logo`) and Marigold (`marigold-logo`)
use the supplied complete presentation boards. Main images are **1080x1440**,
with **540x720** siblings ending in `-540.webp`. WebP quality 92 preserves
the logo edges and presentation text. Resizing preserves the full 3:4 board
without cropping, stretching or upscaling. Matching portrait frames contain
the entire artwork, and hover overlays are disabled for legibility. Both
cards open the larger board using the project modal.

## Digital marketing campaign

The single Hisense campaign card uses `hisense-campaign-hero` as its square
thumbnail. Its project gallery includes that announcement and the
`hisense-campaign-how-to-win` participation guide. Both supplied designs
are preserved in full at **1080x1080**, with **540x540** siblings ending in
`-540.webp`. Assets use Lanczos resampling and WebP quality 90. The two
images belong to one project, so the Digital marketing filter counts one card.

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
