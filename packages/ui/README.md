# @frontstead/ui

Accessible, brand-neutral React primitives for Frontstead applications. Brand
assets and product-specific compositions belong to consuming applications.

The package requires React 19 and `@frontstead/tokens`. Applications using
Tailwind v4 must register `@frontstead/ui/dist` as a source in their global CSS.

For example, from a conventional Next.js `app/globals.css`:

```css
@import "@frontstead/tokens/preset.css";
@source "../../node_modules/@frontstead/ui/dist";
```

Adjust the relative path for the stylesheet location.
