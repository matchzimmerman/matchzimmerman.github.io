# MZ KNIT FOUNDRY 002

A reusable, **offline-first** image-to-jacquard **prepress** tool. Drop in a PNG/JPG/WebP and generate four-color garment placement studies for Printful's Unisex Relaxed Fit Knitted Crew Neck Sweater (catalog product **860**).

## Use

Open `index.html` in Chrome or Safari. No server, account, secret, API key, npm dependencies, or network connection required. The tool never uploads the source image.

1. Select an image and optionally choose **Extract from image** to generate four suggested artwork colors.
2. Adjust four color swatches, base and trim. Until imported from an official source these **are not certified Printful yarn colors**.
3. Compare **Wrap**, **Repeat**, and **Composed**. Choose simulated **Pixelated** or **Solid** color reduction, adjust the seam phase, then **Build previews**.
4. Export a ZIP with `front.png`, `back.png`, `left_sleeve.png`, `right_sleeve.png`, source image, `manifest.json`, and a production checklist.

The panel files are full-size local **concept artboards**, not verified manufacturer templates. No product is published or ordered.

## Imported study profile

For alternative local artwork dimensions, import JSON with this shape:

```json
{
  "schema": "mz.knit-template.v1",
  "panels": [
    {"key":"front", "width":1100,"height":1400},
    {"key":"back", "width":1100,"height":1400},
    {"key":"left_sleeve", "width":600,"height":1400},
    {"key":"right_sleeve", "width":600,"height":1400}
  ]
}
```

Importing dimensions does **not** verify garment shapes, correct placement geometry, stitch gauge, crop, or Printful approval. Product-specific options, allowed yarns and size variants must be verified using Printful data before manufacturing.

## Architecture

- `engine.js`: dependency-free quantization, palette discovery, panel mapping, local manifest, and ZIP encoder. Browser global `MZKnit` and CommonJS export for tests.
- `app.js`: uploads, local canvas rendering, controls, downloadable PNG/ZIP package.
- `index.html`: responsive UI, no external assets, no third-party scripts.
- `tests/engine.test.js`: deterministic test coverage. `node --test tests/*.test.js` (Node 20+).

## Production gate (intentionally not implemented)

Printful advertises four yarns out of 36, with Solid and Pixelated conversion styles; size-specific artwork placement is required. Current official docs: [knit design guidance](https://help.printful.com/hc/en-us/articles/50264367822097-How-do-I-design-custom-knitwear) and [Printful v2 API](https://developers.printful.com/docs/v2-beta/) (`trim_color`, `base_color`, `color_reduction_mode`, and per-layer `yarn_colors`). Actual production template dimensions and yarn values vary; the demo has **no native Printful API integration**.

Next stage: authenticate a verified native MZCMG Printful store; read current product 860 variants, yarn catalog, per-size placement metadata; remap against manufacturer template; request and approve official mockups; then separately enable a publication action with an explicit human gate. Do not submit the exported JSON directly as an API order.

## Privacy and accessibility

Conversion is local in the browser. The original image is included **only** in the ZIP downloaded by the user. Do not commit the user's uploaded artwork to the public code repository. Controls are keyboard accessible and export state is indicated visibly.