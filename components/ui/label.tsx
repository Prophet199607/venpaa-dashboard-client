import * as React from "react";
import { cn } from "@/utils/cn";

export const Label = ({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-xs", className)} {...props} />
);
