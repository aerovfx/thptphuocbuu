import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary-600 text-white": variant === "default",
          "border-transparent bg-gray-100 text-gray-900": variant === "secondary",
          "border-gray-300 bg-white text-gray-700": variant === "outline",
          "border-transparent bg-red-100 text-red-700": variant === "destructive",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
