"use client";

import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

interface CurrentStockData {
  Loca: string;
  Loca_Name?: string;
  Prod_Code: string;
  Prod_Name?: string;
  Stock_Qty: number;
  Stock_Amount: number;
  Purchase_Price: number;
  Selling_Price: number;
  Department: string;
  Category: string;
  SupplierCodes: string;
  Loca_Descrip?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function CurrentStockReport() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const location = searchParams.get("location");
  const category = searchParams.get("category");
  const prodCodes = searchParams.get("prodCodes");
  const department = searchParams.get("department");
  const supplierCodes = searchParams.get("supplierCodes");

  const [records, setRecords] = useState<CurrentStockData[]>([]);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState<string | null>(null);
  const [productDisplayNames, setProductDisplayNames] = useState<string | null>(
    null,
  );

  const { toast } = useToast();
  const fetchedRef = React.useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchData = async () => {
      if (!location) {
        toast({
          title: "Error",
          description: "Missing required parameters: Location",
        });
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          location: location!,
          category: category || "",
          prodCodes: prodCodes || "",
          department: department || "",
          supplierCodes: supplierCodes || "",
        });

        const { data: res } = await api.get(
          `/reports/current-stock-report?${params.toString()}`,
        );

        if (res.success && res.data && res.data.length > 0) {
          setRecords(res.data);

          // Fetch location name
          try {
            const { data: locRes } = await api.get(`/locations/${location}`);
            if (locRes.success) setLocationName(locRes.data.loca_name);
          } catch (e) {
            setLocationName(location);
          }

          // Fetch Department name
          if (department) {
            try {
              const { data: depRes } = await api.get(
                `/departments/${department}`,
              );
              if (depRes.success) setDepartmentName(depRes.data.dep_name);
            } catch (e) {
              setDepartmentName(department);
            }
          }

          // Fetch Category name
          if (category) {
            try {
              const { data: catRes } = await api.get(`/categories/${category}`);
              if (catRes.success) setCategoryName(catRes.data.cat_name);
            } catch (e) {
              setCategoryName(category);
            }
          }

          // Fetch Supplier name
          if (supplierCodes) {
            try {
              const { data: supRes } = await api.get(
                `/suppliers/${supplierCodes}`,
              );
              if (supRes.success) setSupplierName(supRes.data.sup_name);
            } catch (e) {
              setSupplierName(supplierCodes);
            }
          }

          // Fetch Product names
          if (prodCodes) {
            const codes = prodCodes.split(",").map((c) => c.trim());
            try {
              const names = await Promise.all(
                codes.map(async (code) => {
                  try {
                    const { data: prodRes } = await api.get(
                      `/products/${code}`,
                    );
                    return prodRes.success ? prodRes.data.prod_name : code;
                  } catch {
                    return code;
                  }
                }),
              );
              setProductDisplayNames(names.join(", "));
            } catch (e) {
              setProductDisplayNames(prodCodes);
            }
          }
        } else {
          toast({
            title: "No Data",
            description: "No stock data found for the selected criteria.",
            type: "error",
          });
          setTimeout(() => window.close(), 2000);
        }
      } catch (err: any) {
        let errorMsg = "Failed to fetch report data";
        if (err.response?.data) {
          if (err.response.data.errors) {
            errorMsg = Object.values(err.response.data.errors)
              .flat()
              .join(", ");
          } else {
            let parsedError = err.response.data.error;
            if (
              parsedError &&
              typeof parsedError === "string" &&
              parsedError.includes("1644 ")
            ) {
              const match = parsedError.match(/1644\s+(.*?)(?:\s*\(SQL:|$)/);
              if (match && match[1]) {
                parsedError = match[1].trim();
              }
            }
            errorMsg =
              parsedError ||
              err.response.data.message ||
              "Failed to fetch report data";
          }
        } else if (err.message) {
          errorMsg = err.message;
        }
        if (
          errorMsg.includes("No DayEnd_Pos_Transaction") ||
          errorMsg.includes("No DayEnd")
        ) {
          errorMsg =
            "No transactions found for the selected location and date range.";
        }
        toast({
          title: "Error",
          description: errorMsg,
          type: "error",
        });
        setTimeout(() => window.close(), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location, department, category, supplierCodes, prodCodes, toast]);

  const totals = useMemo(() => {
    return records.reduce(
      (acc, curr) => {
        const qty = Number(curr.Stock_Qty || 0);
        const purchasePrice = Number(curr.Purchase_Price || 0);
        const amount = qty * purchasePrice;

        return {
          qty: acc.qty + qty,
          amount: acc.amount + amount,
        };
      },
      { qty: 0, amount: 0 },
    );
  }, [records]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 print:p-0 print:bg-white print:min-h-0">
      <style jsx global>{`
        @media print {
          html,
          body {
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          * {
            -webkit-transition: none !important;
            transition: none !important;
            box-shadow: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          .no-print {
            display: none !important;
          }
          .printable-content {
            width: 100% !important;
            margin: 0 !important;
            border: none !important;
          }
        }
      `}</style>

      {/* <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-[100] no-print flex justify-between items-center px-8 py-3 shadow-sm print:hidden">
        <span className="font-bold text-gray-800 uppercase text-xs">
          Current Stock Report Viewer
        </span>
        <button
          onClick={() => window.print()}
          className="text-xs bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg font-bold"
        >
          Print Report
        </button>
      </nav> */}

      <div className="printable-content relative w-[210mm] mx-auto bg-white p-10 text-black text-[12px] font-sans border shadow-xl print:shadow-none print:border-none">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold underline uppercase">
            Current Stock Report
          </h1>
          <div className="mt-4 text-xs font-bold uppercase space-y-1">
            <div>
              Location:{" "}
              {locationName && locationName !== location
                ? `${locationName} (${location})`
                : location}
            </div>
            {(department || category || supplierCodes || prodCodes) && (
              <div className="flex flex-col gap-1 mt-2 normal-case font-normal text-start">
                {department && (
                  <div>
                    <span className="font-bold uppercase text-[10px]">
                      Departments:
                    </span>{" "}
                    {departmentName && departmentName !== department
                      ? `${departmentName} (${department})`
                      : department}
                  </div>
                )}
                {category && (
                  <div>
                    <span className="font-bold uppercase text-[10px]">
                      Categories:
                    </span>{" "}
                    {categoryName && categoryName !== category
                      ? `${categoryName} (${category})`
                      : category}
                  </div>
                )}
                {supplierCodes && (
                  <div>
                    <span className="font-bold uppercase text-[10px]">
                      Suppliers:
                    </span>{" "}
                    {supplierName && supplierName !== supplierCodes
                      ? `${supplierName} (${supplierCodes})`
                      : supplierCodes}
                  </div>
                )}
                {prodCodes && (
                  <div>
                    <span className="font-bold uppercase text-[10px]">
                      Products:
                    </span>{" "}
                    {productDisplayNames && productDisplayNames !== prodCodes
                      ? `${productDisplayNames} (${prodCodes})`
                      : prodCodes}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-[10px]">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-black">
              <th className="border border-black p-2 text-left w-24">Code</th>
              <th className="border border-black p-2 text-left w-24">
                Product Name
              </th>
              <th className="border border-black p-2 text-left">Department</th>
              <th className="border border-black p-2 text-left">Category</th>
              <th className="border border-black p-2 text-left">Supplier</th>
              <th className="border border-black p-2 text-right">
                Selling Price
              </th>
              <th className="border border-black p-2 text-right">
                Purchase Price
              </th>
              <th className="border border-black p-2 text-right w-20">
                Stock Qty
              </th>
              <th className="border border-black p-2 text-right w-24">
                Stock Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((row) => (
              <tr key={row.Prod_Code} className="hover:bg-gray-50">
                <td className="border border-black p-1 text-left">
                  <span className="font-semibold">{row.Prod_Code}</span>
                </td>
                <td className="border border-black p-1 text-left">
                  <span className="font-semibold">{row.Prod_Name}</span>
                </td>
                <td className="border border-black p-1 text-left">
                  {row.Department}
                </td>
                <td className="border border-black p-1 text-left">
                  {row.Category}
                </td>
                <td className="border border-black p-1 text-left">
                  {row.SupplierCodes || "-"}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.Selling_Price)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.Purchase_Price)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(row.Stock_Qty)}
                </td>
                <td className="border border-black p-1 text-right">
                  {formatCurrency(
                    Number(row.Purchase_Price || 0) *
                      Number(row.Stock_Qty || 0),
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-100 uppercase border-t-2 border-black">
              <td className="border border-black p-2 text-left" colSpan={6}>
                Total
              </td>
              <td className="border border-black p-2 text-right">
                {formatCurrency(totals.qty)}
              </td>
              <td className="border border-black p-2 text-right">
                {formatCurrency(totals.amount)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-8 pt-8 border-t border-gray-200 text-[9px] text-gray-500 italic flex justify-between uppercase">
          <span>Printed on: {new Date().toLocaleString()}</span>
          <span>Venpa Back-Office System</span>
        </div>
      </div>
    </div>
  );
}
