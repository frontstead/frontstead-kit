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

## Sortable Table Headings

`SortableTableHead` owns the native button and `aria-sort` semantics while the
consumer owns sorting state and behavior:

```tsx
import { SortableTableHead } from "@frontstead/ui/table";

<SortableTableHead
  sortDirection={sort === "price-asc" ? "ascending" : "none"}
  onSort={() => setSort(sort === "price-asc" ? "price-desc" : "price-asc")}
>
  Price
</SortableTableHead>
```

Use `ascending`, `descending`, or `none` for `sortDirection`. The rendered native
button supports pointer, Enter, and Space activation without application-specific
keyboard handling.

For sorting, selection, pagination, loading, empty states, keyboard behavior, and
optional TanStack composition, see the
[data table boundary](https://github.com/frontstead/frontstead-kit/blob/main/docs/DATA_TABLES.md).
