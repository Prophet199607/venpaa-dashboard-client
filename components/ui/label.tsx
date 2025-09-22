import * as React from "react";
import { cn } from "@/utils/cn";

export const Label = ({ className, ...props }: React.HTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("label", className)} {...props} />
);
