import { Suspense } from "react";
import SalesReport from "./sales-report";
import Loader from "@/components/ui/loader";

export const metadata = {
  title: "Comprehensive Sales Report",
};

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <SalesReport />
    </Suspense>
  );
}
