"use client";

import DailyCollectionReport from "./daily-collection-report";

import { Suspense } from "react";
import Loader from "@/components/ui/loader";

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <DailyCollectionReport />
    </Suspense>
  );
}
