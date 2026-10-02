import { Suspense } from "react";
import InventoryMovementReport from "./inventory-movement-report";
import Loader from "@/components/ui/loader";

export const metadata = {
  title: "Inventory Movement Report",
};

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <InventoryMovementReport />
    </Suspense>
  );
}
