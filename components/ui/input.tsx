import * as React from "react";
import { cn } from "@/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "input !text-xs h-8 px-2 py-1 aria-[invalid=true]:border-destructive",
        "disabled:cursor-not-allowed",
        "disabled:bg-neutral-100 disabled:text-neutral-500",
        "dark:disabled:bg-neutral-800 dark:disabled:text-neutral-400",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
