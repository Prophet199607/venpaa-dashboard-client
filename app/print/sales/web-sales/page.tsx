import { Suspense } from "react";
import WebSalesReport from "./web-sales";
import Loader from "@/components/ui/loader";

export const metadata = {
  title: "Web Sales Report",
};

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <WebSalesReport />
    </Suspense>
  );
}
