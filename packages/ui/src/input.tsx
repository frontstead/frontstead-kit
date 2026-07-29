import * as React from "react"

import { cn } from "@frontstead/tokens"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input h-8 w-full min-w-0 rounded-sm border bg-card px-2.5 py-1 text-sm shadow-none transition-[color,box-shadow] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
