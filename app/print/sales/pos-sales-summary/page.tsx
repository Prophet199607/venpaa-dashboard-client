"use client";

import { Suspense } from "react";
import PrintPosSalesSummary from "./print-pos-sales-summary";
import Loader from "@/components/ui/loader";

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <PrintPosSalesSummary />
    </Suspense>
  );
}
