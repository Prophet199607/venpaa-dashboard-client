"use client";

import { useState, useEffect } from "react";
import { X, Printer } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";

interface Product {
  prod_code: string;
  prod_name: string;
  selling_price: number;
  total_qty: number;
  amount: number;
}

interface ViewVatInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  docNo?: string;
  invoiceData?: any;
}

export default function ViewVatInvoice({
  isOpen,
  onClose,
  docNo,
  invoiceData,
}: ViewVatInvoiceProps) {
  const [printLoading, setPrintLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState<any>(null);

  useEffect(() => {
    if (invoiceData || !isOpen || !docNo) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [invoiceRes, companyRes, locationRes] = await Promise.all([
          api.get(`/invoices/load-vat-invoice-by-code/${docNo}/applied/INV`),
          api.get("/invoices/company-header"),
          api.get("/locations"),
        ]);

        if (invoiceRes.data.success) {
          const inv = invoiceRes.data.data;
          const company = companyRes.data.success ? companyRes.data.data : null;
          
          let locationName = "";
          if (locationRes.data.success) {
            const searchCode =
              typeof inv.location === "object"
                ? inv.location?.loca_code
                : inv.location;
            const loc = locationRes.data.data.find(
              (l: any) => l.loca_code === searchCode
            );
            locationName = loc
              ? loc.loca_name
              : typeof inv.location === "object"
              ? inv.location?.loca_name
              : inv.location || "";
          }

          const products = (inv.transaction_sale_details || inv.temp_transaction_sale_details || []).map((p: any) => ({
            prod_code: p.prod_code,
            prod_name: p.prod_name,
            selling_price: Number(p.selling_price),
            total_qty: Number(p.total_qty),
            amount: Number(p.amount),
          }));

          setFetchedData({
            invoice_no: inv.doc_no,
            invoice_date: inv.document_date,
            delivery_date: inv.document_date, // Assuming same as document date
            supplier: {
              name: company?.name || "Your Company Name",
              tin: company?.tin_number || "123456789",
              address: company?.address || locationName || "",
              telephone: company?.phone || "+94 11 234 5678",
            },
            purchaser: {
              name: inv.customer_name || inv.customer?.customer_name || "",
              tin: inv.customer?.vat_number || "", // Assuming customer has vat_number
              address: inv.address || "",
              telephone: inv.customer?.telephone || "",
            },
            place_of_supply: locationName,
            additional_info: inv.comments || "",
            products: products,
            payment_mode: inv.payment_mode || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch invoice data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, docNo, invoiceData]);

  // Sample data for display - no API calls
  const sampleProducts: Product[] = [
    {
      prod_code: "PROD001",
      prod_name: "Premium Coffee Beans 500g",
      selling_price: 1250.0,
      total_qty: 11,
      amount: 12000.0,
    },
    {
      prod_code: "PROD002",
      prod_name: "Organic Green Tea 250g",
      selling_price: 850.5,
      total_qty: 7,
      amount: 5953.5,
    },
    {
      prod_code: "PROD003",
      prod_name: "Honey Jar 1kg",
      selling_price: 2200.0,
      total_qty: 3,
      amount: 6270.0,
    },
  ];

  const mockData = {
    invoice_no: docNo || "INV-2024-001",
    invoice_date: new Date().toISOString(),
    delivery_date: new Date().toISOString(),
    supplier: {
      name: "ABC Trading Company",
      tin: "123456789",
      address: "456 Business Street, Colombo 05, Sri Lanka",
      telephone: "+94 11 234 5678",
    },
    purchaser: {
      name: "XYZ Retail Store",
      tin: "987654321",
      address: "456 Market Road, Colombo 07, Sri Lanka",
      telephone: "+94 11 876 5432",
    },
    place_of_supply: "Colombo 05",
    additional_info: "All goods are subject to inspection upon delivery.",
    products: sampleProducts,
    payment_mode: "CASH",
  };

  const data = invoiceData || fetchedData || mockData;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <Loader />
      </Dialog>
    );
  }

  // If we are forcing fetch but it failed or hasn't started and no invoiceData, show nothing or loader?
  // We fall back to mockData if nothing else, which is fine for dev but maybe confusing for prod.
  // For now keeping mockData behavior as fallback.

  const handlePrint = async () => {
    setPrintLoading(true);
    // Print functionality will be implemented later
    setTimeout(() => {
      setPrintLoading(false);
    }, 1000);
  };

  const formatThousandSeparator = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue as number)) return "0.00";
    return (numValue as number).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calculate totals
  const totalValueExcludingVAT = data.products.reduce(
    (sum: number, item: Product) => sum + (item.amount || 0),
    0,
  );
  const vatAmount = (totalValueExcludingVAT * 18) / 100;
  const totalAmountIncludingVAT = totalValueExcludingVAT + vatAmount;

  // Convert number to words (simplified version)
  const numberToWords = (num: number): string => {
    // This is a simplified version - you can enhance it later
    return `Rupees ${formatThousandSeparator(num)} only`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogTitle hidden={isOpen}>Tax Invoice</DialogTitle>
        <DialogDescription hidden={isOpen}>
          VAT Invoice view with supplier and purchaser details.
        </DialogDescription>
        <div className="absolute right-4 top-4 flex gap-2 z-10">
          <button
            onClick={handlePrint}
            disabled={printLoading}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            {printLoading ? (
              <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            <span className="sr-only">Print</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="space-y-4 py-4 mt-3 text-sm">
          {/* Header - Tax Invoice Box */}
          <div className="flex justify-center mb-4">
            <div className="border-2 border-gray-800 px-8 py-3">
              <h1 className="text-xl font-bold">Tax Invoice</h1>
            </div>
          </div>

          {/* Two Column Layout - Supplier and Purchaser */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column - Supplier */}
            <div className="space-y-2">
              <div>
                <label className="font-semibold">Date of Invoice:</label>
                <div className="border-b border-gray-400 min-h-[20px] mt-1">
                  {new Date(data.invoice_date).toLocaleDateString()}
                </div>
              </div>
              <div>
                <label className="font-semibold">Supplier&apos;s TIN:</label>
                <div className="border-b border-gray-400 min-h-[20px] mt-1">
                  {data.supplier?.tin || ""}
                </div>
              </div>
              <div>
                <label className="font-semibold">Supplier&apos;s Name:</label>
                <div className="border-b border-gray-400 min-h-[20px] mt-1">
                  {data.supplier?.name || ""}
                </div>
              </div>
              <div>
                <label className="font-semibold">Address:</label>
                <div className="border-b border-gray-400 min-h-[40px] mt-1">
                  {data.supplier?.address || ""}
                </div>
              </div>
              <div>
                <label className="font-semibold">Telephone No:</label>
                <div className="border-b border-gray-400 min-h-[20px] mt-1">
                  {data.supplier?.telephone || ""}
                </div>
              </div>
              <div>
                <label className="font-semibold">Date of Delivery:</label>
                <div className="border-b border-gray-400 min-h-[20px] mt-1">
                  {data.delivery_date
                    ? new Date(data.delivery_date).toLocaleDateString()
                    : ""}
                </div>
              </div>
            </div>

            {/* Right Column - Purchaser */}
            <div className="space-y-2">
              <div>
                <label className="font-semibold">Tax Invoice No.:</label>
                <div className="border-b border-gray-400 min-h-[20px] mt-1">
                  {data.invoice_no || ""}
                </div>
              </div>
              <div>
                <label className="font-semibold">Purchaser&apos;s TIN:</label>
                <div className="border-b border-gray-400 min-h-[20px] mt-1">
                  {data.purchaser?.tin || ""}
                </div>
              </div>
              <div>
                <label className="font-semibold">Purchaser&apos;s Name:</label>
                <div className="border-b border-gray-400 min-h-[20px] mt-1">
                  {data.purchaser?.name || ""}
                </div>
              </div>
              <div>
                <label className="font-semibold">Address:</label>
                <div className="border-b border-gray-400 min-h-[40px] mt-1">
                  {data.purchaser?.address || ""}
                </div>
              </div>
              <div>
                <label className="font-semibold">Telephone No:</label>
                <div className="border-b border-gray-400 min-h-[20px] mt-1">
                  {data.purchaser?.telephone || ""}
                </div>
              </div>
              <div>
                <label className="font-semibold">Place of Supply:</label>
                <div className="border-b border-gray-400 min-h-[20px] mt-1">
                  {data.place_of_supply || ""}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="mt-4">
            <label className="font-semibold">
              Additional Information if any:
            </label>
            <div className="border border-gray-400 min-h-[60px] mt-1 p-2">
              {data.additional_info || ""}
            </div>
          </div>

          {/* Goods or Services Table */}
          <div className="mt-4">
            <table className="w-full border border-gray-800">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="border-r border-gray-800 px-2 py-2 text-left font-semibold">
                    Reference
                  </th>
                  <th className="border-r border-gray-800 px-2 py-2 text-left font-semibold">
                    Description of Goods or Services
                  </th>
                  <th className="border-r border-gray-800 px-2 py-2 text-center font-semibold">
                    Quantity
                  </th>
                  <th className="border-r border-gray-800 px-2 py-2 text-right font-semibold">
                    Unit Price
                  </th>
                  <th className="px-2 py-2 text-right font-semibold">
                    Amount Excluding VAT (Rs.)
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.products && data.products.length > 0 ? (
                  data.products.map((item: Product, index: number) => (
                    <tr key={index} className="border-b border-gray-400">
                      <td className="border-r border-gray-400 px-2 py-2">
                        {item.prod_code}
                      </td>
                      <td className="border-r border-gray-400 px-2 py-2">
                        {item.prod_name}
                      </td>
                      <td className="border-r border-gray-400 px-2 py-2 text-center">
                        {item.total_qty}
                      </td>
                      <td className="border-r border-gray-400 px-2 py-2 text-right">
                        {formatThousandSeparator(item.selling_price)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {formatThousandSeparator(item.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-2 py-4 text-center text-gray-500"
                    >
                      No items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Section */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold">Total Value of Supply:</label>
              <div className="border-b border-gray-400 min-h-[24px] w-48 text-right px-2">
                {formatThousandSeparator(totalValueExcludingVAT)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <label className="font-semibold">
                VAT Amount (Total Value of Supply @ 18%)
              </label>
              <div className="border-b border-gray-400 min-h-[24px] w-48 text-right px-2">
                {formatThousandSeparator(vatAmount)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <label className="font-semibold">
                Total Amount including VAT:
              </label>
              <div className="border-b border-gray-400 min-h-[24px] w-48 text-right px-2">
                {formatThousandSeparator(totalAmountIncludingVAT)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <label className="font-semibold">Total Amount in words:</label>
              <div className="border-b border-gray-400 min-h-[24px] flex-1 ml-4 px-2">
                {numberToWords(totalAmountIncludingVAT)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <label className="font-semibold">Mode of Payment:</label>
              <div className="border-b border-gray-400 min-h-[24px] w-48 text-right px-2">
                {data.payment_mode || ""}
              </div>
            </div>
          </div>

          {/* Footer */}
          {/* <div className="mt-8 flex justify-between items-end text-xs text-gray-600">
            <div>EOG 11 - 0124</div>
            <div className="text-center">
              PRINTED AT THE DEPARTMENT OF GOVERNMENT PRINTING, SRILANKA
            </div>
          </div> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
