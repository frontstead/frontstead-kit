# Data Table Boundary

Frontstead provides accessible table primitives, not a shared data-grid state
engine. Applications own their row model and compose it with `@frontstead/ui`.
This keeps product behavior out of the shared package and lets applications use
plain arrays, server-rendered rows, or TanStack Table without making TanStack a
runtime dependency of every consumer.

## When To Add A Shared DataTable

Do not add a monolithic `DataTable` export until two independent consumers need
the same orchestration contract for columns, row identity, selection, pagination,
loading, and empty states. Similar visuals are not enough; the state transitions
and accessibility behavior must also match.

Until that threshold is met, use these shared primitives:

- `Table`, `TableHeader`, `TableBody`, `TableFooter`, and `TableCaption` for
  semantic structure;
- `TableHead`, `TableRow`, and `TableCell` for application-rendered content;
- `SortableTableHead` for native sort-button and `aria-sort` behavior;
- `Checkbox` for consumer-controlled row selection;
- `Skeleton`, `Empty`, and `Button` for loading, empty, and pagination controls.

## Keyboard And Screen Readers

Keep the native `<table>` semantics. Do not add `role="grid"`, roving tab stops,
or custom arrow-key handling to a read-oriented data table. Screen readers already
provide row and cell navigation for semantic tables, and turning a table into an
ARIA grid requires a different, complete interaction model.

Only interactive controls belong in the page tab order:

- sortable headers use the native button rendered by `SortableTableHead`;
- selection uses a labeled `Checkbox` in the relevant header or cell;
- row actions use links or buttons in a cell;
- pagination uses labeled buttons outside the table.

Never make a `<tr>` the only way to open or activate a record. A pointer-only row
click may be a convenience, but the same action must remain available through a
descriptive link or button in the row.

## Sorting

The application owns the sort key and direction. Pass the active direction to
`SortableTableHead` and update application state in `onSort`:

```tsx
<SortableTableHead
  sortDirection={sort.key === "price" ? sort.direction : "none"}
  onSort={() => setSort(nextPriceSort(sort))}
>
  Price
</SortableTableHead>
```

Use one active sort column unless the interface clearly explains multi-column
sorting. `SortableTableHead` renders `aria-sort="ascending"`, `descending`, or
`none`; its icon is visual reinforcement and is hidden from assistive technology.

## Selection

Selection is consumer-controlled. Label every checkbox with the record it changes,
including when the visible label is only available to screen readers. A select-all
checkbox should use the indeterminate state when some, but not all, visible rows
are selected. Reflect selection on `TableRow` with `data-state="selected"` for the
shared visual treatment.

Selection must not be coupled to row activation. Clicking a record link and
toggling its checkbox are separate actions.

## Loading And Empty States

Keep headers visible while rows load so column meaning and layout remain stable.
Set `aria-busy="true"` on `Table` and render skeleton cells or a single status row
whose `TableCell` spans every visible column. Announce asynchronous status through
a nearby `role="status"` region; do not repeatedly announce every skeleton cell.

For an empty result, keep the headers and render one spanning cell with concise
text. Use `Empty` outside the table only when it needs a richer action or
explanation. Empty copy and actions remain application-owned.

## Pagination

Pagination state, page size, URL synchronization, and data fetching remain in the
application. Place controls after the table, give the group an accessible label,
disable unavailable previous and next actions, and expose the current page in
text. Changing pages should preserve a predictable focus target and announce the
new result count or page through a status region.

## Optional TanStack Integration

TanStack Table may build the row and header models inside an application. Keep
`@tanstack/react-table` in that application's dependencies, then render its model
through Frontstead primitives:

```tsx
<Table>
  <TableHeader>{/* map table.getHeaderGroups() */}</TableHeader>
  <TableBody>{/* map table.getRowModel().rows */}</TableBody>
</Table>
```

An adapter belongs in the consuming application until a second independent
consumer proves the same adapter API. `@frontstead/ui` must not import TanStack
types or make its sorting, selection, pagination, or filtering state authoritative.

## Public API Rule

New shared table helpers should own one reusable accessibility or presentation
contract, as `SortableTableHead` does. They should not own business columns, row
actions, routes, fetching, persistence, URL state, or product copy.
