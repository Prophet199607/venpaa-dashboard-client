import * as React from "react";
import { cn } from "@/utils/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "input min-h-[50px] mt-1 !text-xs aria-[invalid=true]:border-destructive",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
