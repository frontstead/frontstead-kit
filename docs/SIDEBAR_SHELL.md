# Sidebar Shell Boundary

Frontstead does not currently publish a sidebar shell. One application using a
sidebar is not enough evidence for a shared responsive, persistence, and focus
contract. The existing shared `Sheet`, `Button`, `Tooltip`, `Separator`, and
`Skeleton` primitives are sufficient for application-owned composition today.

This document defines the promotion gate and proposed public API before any
sidebar implementation enters `@frontstead/ui`.

## Promotion Gate

Add a shared shell only after two independent consumers need the same behavior
for all of these concerns:

- desktop expansion and collapse;
- mobile modal presentation;
- focus movement and restoration;
- collapsed-label accessibility;
- layout widths and side placement;
- reduced-motion behavior.

Matching navigation visuals are not sufficient. Routes, labels, badges, storage,
breakpoints, opening shortcuts, and authorization rules must remain different
without adding product switches to the shared package.

## Proposed Public API

The first shared implementation should stay small:

```tsx
<SidebarShell
  viewport="desktop"
  expanded={expanded}
  onExpandedChange={setExpanded}
  mobileOpen={mobileOpen}
  onMobileOpenChange={setMobileOpen}
  collapseMode="icon"
  side="left"
  widths={{ expanded: "14rem", collapsed: "3rem", mobile: "18rem" }}
  mobileTitle="Navigation"
  mobileDescription="Primary application navigation"
>
  <SidebarPanel>
    <nav aria-label="Primary">{/* application navigation */}</nav>
  </SidebarPanel>
  <SidebarInset>{children}</SidebarInset>
</SidebarShell>
```

The proposed shared exports are:

- `SidebarShell`: controlled state, responsive presentation, and layout context;
- `SidebarPanel`: desktop panel or mobile `Sheet` content;
- `SidebarInset`: the main-content layout region;
- `SidebarToggle`: a labeled native button that invokes a consumer callback.

Do not promote the current application-level menu, group, badge, sub-menu,
skeleton, rail, input, or tooltip components wholesale. Applications can compose
those from semantic HTML and existing shared primitives. Promote an additional
piece only after independent reuse proves its own contract.

## Consumer-Controlled State

`SidebarShell` must be fully controlled. It may derive visual state from props,
but it must not read or write cookies, local storage, media queries, routes, or
global keyboard events.

The consuming application owns:

- the breakpoint or container-query result passed as `viewport`;
- persisted desktop state and its storage key, lifetime, and server bootstrap;
- separate mobile open state;
- keyboard shortcuts and collision policy;
- closing the mobile drawer after a navigation action;
- route-aware active state and authorization filtering.

Desktop `expanded` and mobile `mobileOpen` are separate. Resizing must not destroy
the user's desktop preference, and closing a mobile drawer must not collapse the
desktop panel.

## Responsive Contract

`viewport` is `"desktop"` or `"mobile"`; the shared package defines no breakpoint.
In desktop mode, the panel participates in layout and supports `none`, `offcanvas`,
or `icon` collapse modes. In mobile mode, it renders through the shared modal
`Sheet`, using consumer-provided title and description.

Widths are semantic inputs, not product constants. The shell exposes them as CSS
custom properties so applications can style descendants without duplicating
layout calculations. Side placement supports left and right without changing
document or navigation order.

Server rendering must begin from consumer-provided state. The shared shell must
not guess viewport width during hydration.

## Navigation And Shortcuts

Navigation remains application-owned children. The shell must not accept route
objects, command registries, icons, labels, badges, permission checks, or router
instances.

Every navigation destination remains a real link. Collapsed icon links keep an
accessible name independent of any tooltip. Tooltips are optional visual help,
not the source of the link's accessible name.

Opening shortcuts are registered by the application and call the same controlled
toggle callbacks as visible buttons. The shared package must not reserve a key or
attach a window-level listener.

## Focus Contract

Desktop collapse does not move focus unless the focused element becomes hidden.
An implementation must prevent collapsed or off-canvas descendants from remaining
in the tab order. If collapse is requested while focus is inside content that will
be hidden, focus moves to the desktop toggle first.

Mobile presentation follows modal-dialog behavior through `Sheet`:

- opening moves focus into the drawer;
- Tab and Shift+Tab remain inside while open;
- Escape closes the drawer;
- closing restores focus to the trigger;
- a visible or screen-reader-only title and description are required;
- background content is not interactive while the drawer is open.

The application decides whether selecting a navigation item closes the drawer.

## Reduced Motion

Panel width and transform transitions must use restrained durations and include a
`motion-reduce:transition-none` equivalent. State, borders, labels, and focus rings
must remain understandable without animation. The shell must not animate initial
hydration or move focus after a transition delay.

## Required Verification Before Implementation

The first implementation is not ready to merge until tests cover:

1. Controlled desktop expand/collapse callbacks without storage side effects.
2. Controlled mobile open/close callbacks without changing desktop preference.
3. Consumer-selected viewport and breakpoint behavior.
4. Left and right placement plus every supported collapse mode.
5. Hidden desktop descendants leaving the tab order before collapse completes.
6. Mobile initial focus, focus trap, Escape close, and trigger focus restoration.
7. Required mobile title and description relationships.
8. Accessible names for icon-only toggles and collapsed navigation links.
9. No package-owned global keyboard listener, cookie, or storage access.
10. Reduced-motion styles disabling width and transform transitions.
11. Server-rendered controlled state hydrating without a viewport guess.

These are interaction tests, not static class assertions. A future implementation
should use a browser-capable test environment for focus, keyboard, and modal
behavior.

## Explicit Non-Goals

The shared shell does not own navigation data, routing, active-link calculation,
permissions, persistence, breakpoints, keyboard shortcuts, product copy, logos,
account controls, analytics, or data fetching.
