"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { getColumns, PendingItemRequest } from "./columns";
import { useRouter, useSearchParams } from "next/navigation";
import ViewItemRequest from "@/components/model/transactions/view-item-request";
import {
  DataFilter,
  FilterOption,
  FilterValue,
} from "@/components/shared/data-filter";

function PendingItemRequestPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [fetching, setFetching] = useState(false);
  const [pendingItemRequests, setPendingItemRequests] = useState<
    PendingItemRequest[]
  >([]);
  const [appliedFilters, setAppliedFilters] = useState<FilterValue[]>([]);
  const [viewDialog, setViewDialog] = useState({
    isOpen: false,
    docNo: "",
    status: "",
    iid: "",
  });

  const filterOptions: FilterOption[] = [
    {
      key: "approval_status",
      label: "Approval Status",
      type: "select",
      options: [
        { value: "all", label: "All Status" },
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
      ],
    },
    {
      key: "doc_no",
      label: "Document No",
      type: "text",
    },
  ];

  useEffect(() => {
    const viewDocNo = searchParams.get("view_doc_no");
    if (viewDocNo) {
      setViewDialog({
        isOpen: true,
        docNo: viewDocNo,
        status: "applied",
        iid: searchParams.get("iid") ?? "IR",
      });
    }
  }, [searchParams]);

  const fetchPendingItemRequests = useCallback(
    async (status: string) => {
      try {
        setFetching(true);
        const { data: res } = await api.get(
          "/item-requests/load-all-item-requests",
          {
            params: {
              iid: "IR",
              status: "applied",
            },
          }
        );

        if (!res.success) throw new Error(res.message);

        const formatThousandSeparator = (value: number | string) => {
          const numValue =
            typeof value === "string" ? parseFloat(value) : value;
          if (isNaN(numValue as number)) return "0.00";
          return (numValue as number).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        };

        const formattedData: PendingItemRequest[] = res.data.map(
          (item: any) => ({
            docNo: item.doc_no,
            date: item.document_date
              ? new Date(item.document_date).toLocaleDateString("en-CA")
              : "",
            supplier: item.supplier_name || item.supplier_code || "",
            netAmount: parseFloat(item.net_total || 0),
            formattedNetAmount: formatThousandSeparator(
              parseFloat(item.net_total || 0)
            ),
            approvalStatus: item.approval_status || "",
            remark: item.remarks_ref || "",
          })
        );

        setPendingItemRequests(formattedData);
      } catch (err: any) {
        console.error("Failed to fetch pending item requests:", err);
        toast({
          title: "Failed to load pending item requests",
          description: err.response?.data?.message || "Please try again",
          type: "error",
        });
      } finally {
        setFetching(false);
      }
    },
    [toast]
  );

  const filterPendingItemRequests = useCallback(
    async (filters: FilterValue[] = []) => {
      try {
        setFetching(true);

        const params: any = {
          iid: "IR",
          status: "applied",
        };

        filters.forEach((filter) => {
          params[filter.key] = filter.value;
        });

        const { data: res } = await api.get(
          "/item-requests/load-applied-by-status",
          { params }
        );

        if (!res.success) throw new Error(res.message);

        const formatThousandSeparator = (value: number | string) => {
          const numValue =
            typeof value === "string" ? parseFloat(value) : value;
          if (isNaN(numValue as number)) return "0.00";
          return (numValue as number).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        };

        const formattedData: PendingItemRequest[] = res.data.map(
          (item: any) => ({
            docNo: item.doc_no,
            date: item.document_date
              ? new Date(item.document_date).toLocaleDateString("en-CA")
              : "",
            supplier: item.supplier_name || item.supplier_code || "",
            netAmount: parseFloat(item.net_total || 0),
            formattedNetAmount: formatThousandSeparator(
              parseFloat(item.net_total || 0)
            ),
            approvalStatus: item.approval_status || "",
            remark: item.remarks_ref || "",
          })
        );
        setPendingItemRequests(formattedData);
      } catch (err: any) {
        console.error("Failed to fetch pending item requests:", err);
        toast({
          title: "Failed to load pending item requests",
          description: err.response?.data?.message || "Please try again",
          type: "error",
        });
      } finally {
        setFetching(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (appliedFilters.length > 0) {
      filterPendingItemRequests(appliedFilters);
    } else {
      fetchPendingItemRequests("applied");
    }
  }, [fetchPendingItemRequests, filterPendingItemRequests, appliedFilters]);

  const handleFilterChange = (filters: FilterValue[]) => {
    setAppliedFilters(filters);
  };

  const handleView = useCallback((docNo: string, status: string) => {
    setViewDialog({
      isOpen: true,
      docNo,
      status,
      iid: "IR",
    });
  }, []);

  const columns = getColumns({ status: "applied", onView: handleView });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Pending Item Requests</h2>
            <DataFilter
              filters={filterOptions}
              onFilterChange={handleFilterChange}
              appliedFilters={appliedFilters}
              triggerClassName="w-auto"
            />
          </div>

          <DataTable columns={columns} data={pendingItemRequests} />
        </CardContent>
      </Card>

      {fetching && <Loader />}

      <ViewItemRequest
        isOpen={viewDialog.isOpen}
        onClose={() => setViewDialog((prev) => ({ ...prev, isOpen: false }))}
        docNo={viewDialog.docNo}
        status={viewDialog.status}
        iid={viewDialog.iid}
      />
    </div>
  );
}

export default function PendingItemRequestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PendingItemRequestPageContent />
    </Suspense>
  );
}
