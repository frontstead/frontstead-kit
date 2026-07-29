import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@frontstead/tokens"
import { Spinner } from "./spinner"

const buttonVariants = cva(
  "group/button inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm border border-transparent text-[0.8125rem] font-medium transition-[background-color,border-color,color] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:transition-transform [&_svg:not([class*='size-'])]:size-3.5 hover:[&_svg]:-translate-y-px hover:[&_svg]:translate-x-0.5 motion-reduce:[&_svg]:transform-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-1 focus-visible:ring-offset-background aria-invalid:ring-destructive/30 dark:aria-invalid:ring-destructive/50 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "border-destructive bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/40 dark:bg-destructive/70",
        outline:
          "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:bg-secondary/85",
        ghost:
          "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        link: "border-transparent px-0 text-primary hover:text-primary/85",
      },
      size: {
        default: "h-8 px-3 py-1.5 has-[>svg]:px-2.5",
        xs: "h-6 gap-1 rounded-sm px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 rounded-sm gap-1.5 px-2.5 has-[>svg]:px-2",
        lg: "h-9 rounded-sm px-4 has-[>svg]:px-3",
        icon: "size-9 min-h-9 min-w-9",
        "icon-xs": "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 min-h-8 min-w-8",
        "icon-lg": "size-10 min-h-10 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
    loadingLabel?: React.ReactNode
  }

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  loadingLabel,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const styles = cn(buttonVariants({ variant, size }), className)

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        data-loading={loading || undefined}
        aria-busy={loading || undefined}
        className={styles}
        {...props}
      >
        {children}
      </Slot.Root>
    )
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={styles}
      {...props}
    >
      {loading ? <Spinner data-slot="button-spinner" /> : null}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
