"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";

interface Product {
  prod_code: string;
  prod_name: string;
  selling_price: number;
  total_qty: number;
  amount: number;
}

interface VatInvoicePrintData {
  invoice_no: string;
  invoice_date: string;
  delivery_date?: string;
  supplier: {
    name: string;
    tin: string;
    address: string;
    telephone: string;
  };
  purchaser: {
    name: string;
    tin: string;
    address: string;
    telephone: string;
  };
  place_of_supply: string;
  additional_info: string;
  products: Product[];
  payment_mode: string;
}

interface PrintVatInvoiceContentProps {
  docNo: string;
  initialData?: VatInvoicePrintData;
  onLoad?: () => void;
}

export default function PrintVatInvoiceContent({
  docNo,
  initialData,
  onLoad,
}: PrintVatInvoiceContentProps) {
  const [loading, setLoading] = useState(!initialData);
  const [data, setData] = useState<VatInvoicePrintData | null>(initialData ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setLoading(false);
      onLoad?.();
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
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
              (l: { loca_code: string }) => l.loca_code === searchCode,
            );
            locationName = loc
              ? loc.loca_name
              : typeof inv.location === "object"
                ? inv.location?.loca_name
                : inv.location || "";
          }

          const products = (
            inv.transaction_sale_details ||
            inv.temp_transaction_sale_details ||
            []
          ).map((p: Product) => ({
            prod_code: p.prod_code,
            prod_name: p.prod_name,
            selling_price: Number(p.selling_price),
            total_qty: Number(p.total_qty),
            amount: Number(p.amount),
          }));

          setData({
            invoice_no: inv.doc_no,
            invoice_date: inv.document_date,
            delivery_date: inv.document_date,
            supplier: {
              name: company?.name || "",
              tin: company?.tin_number || "",
              address: company?.address || locationName || "",
              telephone: company?.phone || "",
            },
            purchaser: {
              name: inv.customer_name || inv.customer?.customer_name || "",
              tin: inv.customer?.vat_number || "",
              address: inv.address || "",
              telephone: inv.customer?.telephone || "",
            },
            place_of_supply: locationName,
            additional_info: inv.comments || "",
            products,
            payment_mode: inv.payment_mode || "",
          });
          onLoad?.();
        } else {
          setError("Failed to load VAT invoice data");
        }
      } catch {
        setError("Failed to load VAT invoice data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [docNo, initialData, onLoad]);

  /* ── States ── */
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-slate-500">
        <Loader />
        <span className="text-sm font-medium tracking-wide">Loading tax invoice…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-red-500">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400 text-sm">
        Tax invoice not found.
      </div>
    );
  }

  /* ── Helpers ── */
  const fmt = (value: number | string) => {
    const n = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(n)) return "0.00";
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const VAT_RATE = 18;

  const exclUnit = (price: number) => price * (1 - VAT_RATE / 100);
  const fmtUnitExcl = (price: number) => fmt(exclUnit(price));
  const fmtAmtExcl = (price: number, qty: number) => fmt(exclUnit(price) * qty);

  const totalIncVAT = data.products.reduce(
    (s, p) => s + p.selling_price * p.total_qty, 0,
  );
  const totalExclVAT = data.products.reduce(
    (s, p) => s + exclUnit(p.selling_price) * p.total_qty, 0,
  );
  const vatAmount = totalIncVAT - totalExclVAT;

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

  const numberToWords = (num: number): string => {
    if (num === 0) return "Zero Rupees Only";
    const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
      "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
    const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
    const toWord = (n: number): string => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + toWord(n % 100) : "");
      if (n < 100000) return toWord(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + toWord(n % 1000) : "");
      if (n < 10000000) return toWord(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + toWord(n % 100000) : "");
      return toWord(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + toWord(n % 10000000) : "");
    };
    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);
    let result = toWord(intPart) + " Rupees";
    if (decPart > 0) result += " and " + toWord(decPart) + " Cents";
    return result + " Only";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .vat-root * { box-sizing: border-box; }
        .vat-root {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #1a1f2e;
          background: #fff;
          padding: 40px 48px 48px;
          max-width: 920px;
          margin: 0 auto;
        }

        /* ── Header ── */
        .vat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 24px;
          border-bottom: 2px solid #1a1f2e;
          margin-bottom: 28px;
        }
        .vat-title-group {}
        .vat-eyebrow {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 4px;
        }
        .vat-title {
          font-size: 22px;
          font-weight: 700;
          color: #1a1f2e;
          letter-spacing: -.01em;
        }
        .vat-inv-no-wrap {
          text-align: right;
        }
        .vat-inv-no-label {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 4px;
        }
        .vat-inv-no {
          font-family: 'DM Mono', monospace;
          font-size: 17px;
          font-weight: 600;
          color: #1a1f2e;
        }

        /* ── Party cards ── */
        .vat-parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .vat-party-card {
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
        }
        .vat-party-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #f8f9fb;
          border-bottom: 1.5px solid #e5e7eb;
        }
        .vat-party-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .vat-party-dot.supplier { background: #1a1f2e; }
        .vat-party-dot.purchaser { background: #6b7280; }
        .vat-party-label {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #6b7280;
        }
        .vat-party-body {
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .vat-field { display: flex; flex-direction: column; }
        .vat-field-key {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 1px;
        }
        .vat-field-val {
          font-size: 13px;
          font-weight: 500;
          color: #1a1f2e;
          line-height: 1.4;
        }
        .vat-field-val.mono {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
        }

        /* ── Meta row ── */
        .vat-meta-row {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        .vat-meta-chip {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 12px 16px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
        }

        /* ── Additional info ── */
        .vat-additional {
          margin-bottom: 20px;
          padding: 12px 16px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          background: #fafafa;
        }
        .vat-additional-label {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 5px;
        }
        .vat-additional-text {
          font-size: 13px;
          color: #374151;
        }

        /* ── Table ── */
        .vat-table-wrap {
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .vat-table {
          width: 100%;
          border-collapse: collapse;
        }
        .vat-table thead tr {
          background: #f8f9fb;
          border-bottom: 1.5px solid #e5e7eb;
        }
        .vat-table th {
          padding: 11px 14px;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #6b7280;
          white-space: nowrap;
        }
        .vat-table th.left   { text-align: left; }
        .vat-table th.right  { text-align: right; }
        .vat-table th.center { text-align: center; }

        .vat-table tbody tr {
          border-bottom: 1px solid #f3f4f6;
        }
        .vat-table tbody tr:last-child { border-bottom: none; }
        .vat-table tbody tr:hover { background: #fafafa; }

        .vat-table td {
          padding: 10px 14px;
          color: #374151;
          vertical-align: middle;
        }
        .vat-table td.left   { text-align: left; }
        .vat-table td.right  { text-align: right; font-family: 'DM Mono', monospace; font-size: 12px; }
        .vat-table td.center { text-align: center; font-family: 'DM Mono', monospace; font-size: 12px; }
        .vat-prod-code {
          font-family: 'DM Mono', monospace;
          font-size: 11.5px;
          color: #6b7280;
        }
        .vat-prod-name {
          font-weight: 500;
          color: #1a1f2e;
        }

        /* ── Totals ── */
        .vat-totals-wrap {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 20px;
        }
        .vat-totals-card {
          width: 340px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
        }
        .vat-totals-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 18px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 13px;
        }
        .vat-totals-row:last-child { border-bottom: none; }
        .vat-totals-row .t-label { color: #6b7280; font-weight: 500; }
        .vat-totals-row .t-val {
          font-family: 'DM Mono', monospace;
          font-size: 12.5px;
          font-weight: 500;
          color: #1a1f2e;
        }
        .vat-totals-row.vat-highlight {
          background: #f0fdf4;
        }
        .vat-totals-row.vat-highlight .t-label { color: #15803d; font-weight: 600; }
        .vat-totals-row.vat-highlight .t-val   { color: #15803d; }
        .vat-totals-row.vat-net {
          background: #1a1f2e;
        }
        .vat-totals-row.vat-net .t-label { color: #d1d5db; font-weight: 600; font-size: 13px; }
        .vat-totals-row.vat-net .t-val   { color: #fff; font-size: 14px; font-weight: 600; }

        /* ── Words + payment ── */
        .vat-words-card {
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          padding: 14px 18px;
          margin-bottom: 24px;
          background: #fafafa;
        }
        .vat-words-label {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 5px;
        }
        .vat-words-text {
          font-size: 13px;
          font-weight: 500;
          color: #1a1f2e;
          font-style: italic;
        }
        .vat-payment-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
        }
        .vat-payment-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #9ca3af;
        }
        .vat-payment-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 999px;
          background: #eff6ff;
          color: #3b82f6;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .04em;
        }

        /* ── Footer ── */
        .vat-footer {
          margin-top: 32px;
          padding-top: 18px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #9ca3af;
        }

        @media print {
          .vat-root { padding: 20px 28px; max-width: 100%; }
          .vat-table tbody tr:hover { background: transparent; }
        }
      `}</style>

      <div className="vat-root">

        {/* ── Header ── */}
        <div className="vat-header">
          <div className="vat-title-group">
            <div className="vat-eyebrow">Official Document</div>
            <div className="vat-title">Tax Invoice</div>
          </div>
          <div className="vat-inv-no-wrap">
            <div className="vat-inv-no-label">Invoice No.</div>
            <div className="vat-inv-no">{data.invoice_no || "—"}</div>
          </div>
        </div>

        {/* ── Party cards ── */}
        <div className="vat-parties">
          {/* Supplier */}
          <div className="vat-party-card">
            <div className="vat-party-header">
              <div className="vat-party-dot supplier" />
              <div className="vat-party-label">Supplier</div>
            </div>
            <div className="vat-party-body">
              <div className="vat-field">
                <span className="vat-field-key">Name</span>
                <span className="vat-field-val">{data.supplier.name || "—"}</span>
              </div>
              <div className="vat-field">
                <span className="vat-field-key">TIN</span>
                <span className="vat-field-val mono">{data.supplier.tin || "—"}</span>
              </div>
              <div className="vat-field">
                <span className="vat-field-key">Address</span>
                <span className="vat-field-val">{data.supplier.address || "—"}</span>
              </div>
              <div className="vat-field">
                <span className="vat-field-key">Telephone</span>
                <span className="vat-field-val mono">{data.supplier.telephone || "—"}</span>
              </div>
            </div>
          </div>

          {/* Purchaser */}
          <div className="vat-party-card">
            <div className="vat-party-header">
              <div className="vat-party-dot purchaser" />
              <div className="vat-party-label">Purchaser</div>
            </div>
            <div className="vat-party-body">
              <div className="vat-field">
                <span className="vat-field-key">Name</span>
                <span className="vat-field-val">{data.purchaser.name || "—"}</span>
              </div>
              <div className="vat-field">
                <span className="vat-field-key">TIN</span>
                <span className="vat-field-val mono">{data.purchaser.tin || "—"}</span>
              </div>
              <div className="vat-field">
                <span className="vat-field-key">Address</span>
                <span className="vat-field-val">{data.purchaser.address || "—"}</span>
              </div>
              <div className="vat-field">
                <span className="vat-field-key">Telephone</span>
                <span className="vat-field-val mono">{data.purchaser.telephone || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Meta chips (dates + place) ── */}
        <div className="vat-meta-row">
          <div className="vat-meta-chip">
            <span className="vat-field-key">Date of Invoice</span>
            <span className="vat-field-val">{fmtDate(data.invoice_date)}</span>
          </div>
          <div className="vat-meta-chip">
            <span className="vat-field-key">Date of Delivery</span>
            <span className="vat-field-val">{fmtDate(data.delivery_date)}</span>
          </div>
          <div className="vat-meta-chip">
            <span className="vat-field-key">Place of Supply</span>
            <span className="vat-field-val">{data.place_of_supply || "—"}</span>
          </div>
        </div>

        {/* ── Additional info ── */}
        {data.additional_info && (
          <div className="vat-additional">
            <div className="vat-additional-label">Additional Information</div>
            <div className="vat-additional-text">{data.additional_info}</div>
          </div>
        )}

        {/* ── Products table ── */}
        <div className="vat-table-wrap">
          <table className="vat-table">
            <thead>
              <tr>
                <th className="left">Reference</th>
                <th className="left">Description of Goods / Services</th>
                <th className="center">Qty</th>
                <th className="right">Unit Price (Excl. VAT)</th>
                <th className="right">Amount (Excl. VAT)</th>
              </tr>
            </thead>
            <tbody>
              {data.products.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#9ca3af" }}>
                    No products found.
                  </td>
                </tr>
              ) : (
                data.products.map((item, index) => (
                  <tr key={index}>
                    <td className="left">
                      <span className="vat-prod-code">{item.prod_code}</span>
                    </td>
                    <td className="left">
                      <span className="vat-prod-name">{item.prod_name}</span>
                    </td>
                    <td className="center">{item.total_qty}</td>
                    <td className="right">{fmtUnitExcl(item.selling_price)}</td>
                    <td className="right" style={{ fontWeight: 600, color: "#1a1f2e" }}>
                      {fmtAmtExcl(item.selling_price, item.total_qty)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Totals ── */}
        <div className="vat-totals-wrap">
          <div className="vat-totals-card">
            <div className="vat-totals-row">
              <span className="t-label">Total Value of Supply</span>
              <span className="t-val">{fmt(totalExclVAT)}</span>
            </div>
            <div className="vat-totals-row vat-highlight">
              <span className="t-label">VAT @ {VAT_RATE}%</span>
              <span className="t-val">{fmt(vatAmount)}</span>
            </div>
            <div className="vat-totals-row vat-net">
              <span className="t-label">Total inc. VAT</span>
              <span className="t-val">{fmt(totalIncVAT)}</span>
            </div>
          </div>
        </div>

        {/* ── Amount in words + payment ── */}
        <div className="vat-words-card">
          <div className="vat-words-label">Total Amount in Words</div>
          <div className="vat-words-text">{numberToWords(totalIncVAT)}</div>
          <div className="vat-payment-row">
            <span className="vat-payment-label">Mode of Payment</span>
            <span className="vat-payment-badge">{data.payment_mode || "—"}</span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="vat-footer">
          <span>
            Generated on{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </span>
          <span>This is a computer-generated invoice.</span>
        </div>

      </div>
    </>
  );
}