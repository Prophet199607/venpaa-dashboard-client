"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";

interface Product {
  prod_code: string;
  prod_name: string;
  selling_price: number;
  pack_qty: number;
  unit_qty: number;
  free_qty: number;
  total_qty: number;
  line_wise_discount_value: number;
  unit?: {
    unit_type: "WHOLE" | "DEC" | null;
  };
  amount: number;
  type?: string;
}

interface PrintInvoiceContentProps {
  docNo: string;
  status?: string;
  iid?: string;
  initialData?: any;
  onLoad?: () => void;
}

export default function PrintInvoiceContent({
  docNo,
  status = "applied",
  iid = "INV",
  initialData,
  onLoad,
}: PrintInvoiceContentProps) {
  const [loading, setLoading] = useState(!initialData);
  const [data, setData] = useState<any>(initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setLoading(false);
      onLoad?.();
      return;
    }

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: res } = await api.get(
          `/invoices/load-invoice-by-code/${docNo}/${status}/${iid}`,
        );

        if (res.success) {
          const invData = res.data;
          const productDetails =
            invData.transaction_sale_details ||
            invData.temp_transaction_sale_details ||
            [];

          const productsWithUnits = productDetails.map((product: any) => ({
            ...product,
            unit: {
              unit_type:
                product.product?.unit?.unit_type ||
                product.unit?.unit_type ||
                null,
            },
          }));

          setData({
            ...invData,
            ...(invData.transaction_sale_details
              ? { transaction_sale_details: productsWithUnits }
              : {}),
            ...(invData.temp_transaction_sale_details
              ? { temp_transaction_sale_details: productsWithUnits }
              : {}),
          });
          onLoad?.();
        } else {
          setError("Failed to load invoice data");
        }
      } catch {
        setError("Failed to load invoice data");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [docNo, status, iid, initialData, onLoad]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-slate-500">
        <Loader />
        <span className="text-sm font-medium tracking-wide">
          Loading invoice…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-red-500">
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400 text-sm">
        Invoice not found.
      </div>
    );
  }

  const details =
    status === "applied"
      ? data.transaction_sale_details || []
      : data.temp_transaction_sale_details || [];

  const formatThousandSeparator = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue as number)) return "0.00";
    return (numValue as number).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const fmtQty = (item: Product, field: keyof Product) => {
    const val = Number(item[field]);
    return item.unit?.unit_type === "WHOLE"
      ? Math.floor(val).toString()
      : val.toFixed(3);
  };

  return (
    <>
      {/* Print-only global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .inv-root * { box-sizing: border-box; }

        .inv-root {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #1a1f2e;
          background: #fff;
          padding: 28px 36px 36px;
          max-width: 900px;
          margin: 0 auto;
        }

        /* ── Header ── */
        .inv-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 2px solid #1a1f2e;
          margin-bottom: 12px;
        }

        .inv-brand-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 3px;
        }

        .inv-location {
          font-size: 19px;
          font-weight: 600;
          color: #1a1f2e;
          line-height: 1.2;
        }

        .inv-badge {
          display: inline-block;
          background: #1a1f2e;
          color: #fff;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .14em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 4px;
          margin-bottom: 6px;
        }

        .inv-doc-grid {
          text-align: right;
        }

        .inv-doc-row {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
          color: #374151;
          font-size: 12px;
          margin-bottom: 2px;
        }

        .inv-doc-row span:first-child {
          color: #9ca3af;
          font-weight: 500;
        }

        .inv-doc-row span:last-child {
          font-family: 'DM Mono', monospace;
          font-weight: 500;
          color: #1a1f2e;
        }

        /* ── Meta grid ── */
        .inv-meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0;
          margin-bottom: 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
        }

        .inv-meta-col {
          padding: 8px 10px;
        }

        .inv-meta-col:not(:last-child) {
          border-right: 1.5px solid #e5e7eb;
        }

        .inv-meta-col-title {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 4px;
        }

        .inv-meta-row {
          display: flex;
          flex-direction: column;
          margin-bottom: 4px;
        }

        .inv-meta-row:last-child {
          margin-bottom: 0;
        }

        .inv-meta-key {
          font-size: 9.5px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: .05em;
          margin-bottom: 1px;
        }

        .inv-meta-val {
          font-size: 12px;
          font-weight: 500;
          color: #1a1f2e;
        }

        /* ── Table ── */
        .inv-table-wrap {
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .inv-table {
          width: 100%;
          border-collapse: collapse;
        }

        .inv-table thead tr {
          background: #f8f9fb;
          border-bottom: 1.5px solid #e5e7eb;
        }

        .inv-table th {
          padding: 9px 12px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #6b7280;
          white-space: nowrap;
        }

        .inv-table th.left {
          text-align: left;
        }

        .inv-table th.right {
          text-align: right;
        }

        .inv-table th.center {
          text-align: center;
        }

        .inv-table tbody tr {
          border-bottom: 1px solid #f3f4f6;
          transition: background .12s;
        }

        .inv-table tbody tr:last-child {
          border-bottom: none;
        }

        .inv-table tbody tr:hover {
          background: #fafafa;
        }

        .inv-table td {
          padding: 8px 12px;
          color: #374151;
          vertical-align: middle;
        }

        .inv-table td.left {
          text-align: left;
        }

        .inv-table td.right {
          text-align: right;
          font-family: 'DM Mono', monospace;
          font-size: 11.5px;
        }

        .inv-table td.center {
          text-align: center;
          font-family: 'DM Mono', monospace;
          font-size: 11.5px;
        }

        .inv-row-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: #6b7280;
        }

        .inv-type-pill {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .05em;
          background: #eff6ff;
          color: #3b82f6;
        }

        .inv-prod-code {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #6b7280;
        }

        .inv-prod-name {
          font-weight: 500;
          color: #1a1f2e;
        }

        .inv-empty {
          padding: 24px;
          text-align: center;
          color: #9ca3af;
          font-size: 12.5px;
        }

        /* ── Totals ── */
        .inv-totals {
          display: flex;
          justify-content: flex-end;
        }

        .inv-totals-card {
          width: 280px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
        }

        .inv-totals-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 12.5px;
        }

        .inv-totals-row:last-child {
          border-bottom: none;
        }

        .inv-totals-row .label {
          color: #6b7280;
          font-weight: 500;
        }

        .inv-totals-row .value {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 500;
          color: #1a1f2e;
        }

        .inv-totals-row.net {
          background: #1a1f2e;
        }

        .inv-totals-row.net .label {
          font-weight: 600;
          font-size: 12.5px;
        }

        .inv-totals-row.net .value {
          font-size: 13px;
          font-weight: 600;
        }

        /* ── Comments ── */
        .inv-comments {
          margin-top: 14px;
          padding: 12px 16px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          background: #fafafa;
        }

        .inv-comments-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 5px;
        }

        .inv-comments-text {
          font-size: 12.5px;
          color: #374151;
          line-height: 1.5;
        }

        /* ── Footer ── */
        .inv-footer {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10.5px;
          color: #9ca3af;
        }

        @media print {
          .inv-root {
            padding: 14px 20px;
            max-width: 100%;
          }

          .inv-table tbody tr:hover {
            background: transparent;
          }
        }
      `}</style>

      <div className="inv-root">
        {/* ── Header ── */}
        <div className="inv-header">
          <div>
            <div className="inv-brand-label">Issued by</div>
            <div className="inv-location">
              {data.location?.loca_name || "—"}
            </div>

            {/* ── Company contact block ── */}
            <div
              style={{
                marginTop: "5px",
                display: "flex",
                flexDirection: "column",
                gap: "1px",
              }}
            >
              <span
                style={{
                  fontSize: "11.5px",
                  color: "#374151",
                  fontWeight: 500,
                  lineHeight: 1.35,
                }}
              >
                Venpaa Bookstore
              </span>

              <span
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  lineHeight: 1.35,
                }}
              >
                465 1/1 Galle Road, Colombo 06
              </span>

              <span
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  lineHeight: 1.35,
                }}
              >
                Tel: 076 669 9647
              </span>

              <span
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  lineHeight: 1.35,
                }}
              >
                Email: venpaabookhouse@gmail.com
              </span>
            </div>
          </div>
          <div className="inv-doc-grid">
            <div className="inv-badge">Invoice</div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <div className="inv-doc-row">
                <span>Invoice No</span>
                <span>{data.doc_no}</span>
              </div>
              {data.manual_no && (
                <div className="inv-doc-row">
                  <span>Manual No</span>
                  <span>{data.manual_no}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Meta ── */}
        <div className="inv-meta">
          {/* Col 1 – Transaction */}
          <div className="inv-meta-col">
            <div className="inv-meta-col-title">Transaction</div>
            <div className="inv-meta-row">
              <span className="inv-meta-key">Document Date</span>
              <span className="inv-meta-val">
                {new Date(data.document_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            {data.invoice_date && (
              <div className="inv-meta-row">
                <span className="inv-meta-key">Invoice Date</span>
                <span className="inv-meta-val">
                  {new Date(data.invoice_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            <div className="inv-meta-row">
              <span className="inv-meta-key">Payment Method</span>
              <span className="inv-meta-val">{data.payment_mode || "—"}</span>
            </div>
            <div className="inv-meta-row">
              <span className="inv-meta-key">Sale Type</span>
              <span className="inv-meta-val">{data.sale_type || "—"}</span>
            </div>
          </div>

          {/* Col 2 – Customer */}
          <div className="inv-meta-col">
            <div className="inv-meta-col-title">Customer</div>
            <div className="inv-meta-row">
              <span className="inv-meta-key">Name</span>
              <span className="inv-meta-val">
                {data.customer?.customer_name || data.customer_name || "—"}
              </span>
            </div>
            <div className="inv-meta-row">
              <span className="inv-meta-key">Address</span>
              <span className="inv-meta-val">{data.address || "N/A"}</span>
            </div>
            {data.sales_assistant_code && (
              <div className="inv-meta-row">
                <span className="inv-meta-key">Sales Assistant</span>
                <span className="inv-meta-val">
                  {data.sales_assistant_code}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Products table ── */}
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th className="left" style={{ width: 44 }}>
                  #
                </th>
                <th className="left">Product Name</th>
                <th className="right">Unit Price</th>
                <th className="center">Pack</th>
                <th className="center">Unit</th>
                <th className="center">Free</th>
                <th className="center">Total</th>
                <th className="right">Discount</th>
                <th className="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {details.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <div className="inv-empty">
                      No products on this invoice.
                    </div>
                  </td>
                </tr>
              ) : (
                details.map((item: Product, index: number) => (
                  <tr key={index}>
                    <td className="left">
                      <div className="inv-row-num">{index + 1}</div>
                    </td>
                    <td className="left">
                      <span className="inv-prod-name">
                        {item.prod_code} - {item.prod_name}
                      </span>
                    </td>
                    <td className="right">
                      {formatThousandSeparator(item.selling_price)}
                    </td>
                    <td className="center">{fmtQty(item, "pack_qty")}</td>
                    <td className="center">{fmtQty(item, "unit_qty")}</td>
                    <td className="center">{fmtQty(item, "free_qty")}</td>
                    <td className="center">{fmtQty(item, "total_qty")}</td>
                    <td className="right">
                      {formatThousandSeparator(item.line_wise_discount_value)}
                    </td>
                    <td
                      className="right"
                      style={{ fontWeight: 600, color: "#1a1f2e" }}
                    >
                      {formatThousandSeparator(item.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Totals ── */}
        <div className="inv-totals">
          <div className="inv-totals-card">
            <div className="inv-totals-row">
              <span className="label">Subtotal</span>
              <span className="value">
                {formatThousandSeparator(data.subtotal)}
              </span>
            </div>
            <div className="inv-totals-row">
              <span className="label">Discount</span>
              <span className="value">
                {data.dis_per > 0
                  ? `${data.dis_per}%`
                  : data.discount > 0
                    ? formatThousandSeparator(data.discount)
                    : "—"}
              </span>
            </div>
            <div className="inv-totals-row">
              <span className="label">Tax</span>
              <span className="value">
                {data.tax_per > 0
                  ? `${data.tax_per}%`
                  : data.tax > 0
                    ? formatThousandSeparator(data.tax)
                    : "—"}
              </span>
            </div>
            {data.delivery_charges > 0 && (
              <div className="inv-totals-row">
                <span className="label">Delivery</span>
                <span className="value">
                  {formatThousandSeparator(data.delivery_charges)}
                </span>
              </div>
            )}
            <div className="inv-totals-row net">
              <span className="label">Net Amount</span>
              <span className="value">
                {formatThousandSeparator(data.net_total)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Comments ── */}
        {data.comments && (
          <div className="inv-comments">
            <div className="inv-comments-label">Notes &amp; Comments</div>
            <div className="inv-comments-text">{data.comments}</div>
          </div>
        )}

        {/* ── Bank Details ── */}
        <div
          style={{
            marginTop: "14px",
            border: "1.5px solid #e5e7eb",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 14px",
              background: "#f8f9fb",
              borderBottom: "1.5px solid #e5e7eb",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase" as const,
              color: "#6b7280",
            }}
          >
            Bank Details
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0",
            }}
          >
            {/* Sampath Bank */}
            <div
              style={{
                padding: "12px 14px",
                borderRight: "1.5px solid #e5e7eb",
                display: "flex",
                flexDirection: "column" as const,
                gap: "2px",
              }}
            >
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  color: "#1a1f2e",
                  marginBottom: "2px",
                }}
              >
                Sampath Bank
              </span>

              <span
                style={{
                  fontSize: "11.5px",
                  color: "#374151",
                  lineHeight: 1.35,
                }}
              >
                Venpaa Pvt Ltd
              </span>

              <span
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  lineHeight: 1.35,
                }}
              >
                Branch: Kotahena
              </span>

              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#1a1f2e",
                  marginTop: "3px",
                  letterSpacing: ".03em",
                  lineHeight: 1.35,
                }}
              >
                103714011266
              </span>
            </div>

            {/* Commercial Bank */}
            <div
              style={{
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column" as const,
                gap: "2px",
              }}
            >
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  color: "#1a1f2e",
                  marginBottom: "2px",
                }}
              >
                Commercial Bank
              </span>

              <span
                style={{
                  fontSize: "11.5px",
                  color: "#374151",
                  lineHeight: 1.35,
                }}
              >
                Venpaa Pvt Ltd
              </span>

              <span
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  lineHeight: 1.35,
                }}
              >
                Branch: Wellawatte
              </span>

              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#1a1f2e",
                  marginTop: "3px",
                  letterSpacing: ".03em",
                  lineHeight: 1.35,
                }}
              >
                1001090083
              </span>
            </div>
          </div>
        </div>

        {/* ── Signature Block ── */}
        <div
          style={{
            marginTop: "32px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "24px",
          }}
        >
          {["Prepared By", "Checked By", "Approved By"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column" as const,
                alignItems: "center",
                gap: "8px",
              }}
            >
              {/* Signature space */}
              <div style={{ height: "64px", width: "100%" }} />
              {/* Signature line */}
              <div
                style={{ width: "100%", borderBottom: "1.5px solid #1a1f2e" }}
              />
              {/* Label */}
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: ".12em",
                  textTransform: "uppercase" as const,
                  color: "#6b7280",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="inv-footer">
          <span>
            Generated on{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span>Thank you for your business.</span>
        </div>
      </div>
    </>
  );
}
