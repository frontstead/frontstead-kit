// @frontstead/ui — shadcn-style primitives. Radix is the single dependency
// chokepoint: apps import these components, never `radix-ui` directly. Note the
// public prop types currently mirror Radix (`ComponentProps<typeof XPrimitive>`),
// so a future swap to Base UI is a contained per-component edit here, not a
// zero-touch change for call sites that pass Radix-specific props.
export * from "./button";
export * from "./card";
export * from "./badge";
export * from "./dialog";
export * from "./input";
export * from "./label";
export * from "./skeleton";
export * from "./empty";
export * from "./alert";
export * from "./select";
export * from "./separator";
export * from "./avatar";
export * from "./textarea";
export * from "./checkbox";
export * from "./spinner";
export * from "./tabs";
export * from "./tooltip";
export * from "./toggle";
export * from "./toggle-group";
export * from "./scroll-area";
export * from "./table";
export * from "./sheet";
export * from "./alert-dialog";
export * from "./dropdown-menu";
export * from "./popover";
export * from "./native-select";
export * from "./form-message";
