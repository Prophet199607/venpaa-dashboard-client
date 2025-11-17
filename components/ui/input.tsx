import * as React from "react";
import { cn } from "@/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "input aria-[invalid=true]:border-destructive",
        "disabled:cursor-not-allowed",
        "disabled:bg-slate-100 disabled:text-slate-500",
        "dark:disabled:bg-slate-800 dark:disabled:text-slate-400",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
