import { Suspense } from "react";
import CurrentStockReport from "./current-stock-report";
import Loader from "@/components/ui/loader";

export const metadata = {
  title: "Current Stock Report",
};

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <CurrentStockReport />
    </Suspense>
  );
}
