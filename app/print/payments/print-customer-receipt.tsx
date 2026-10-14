"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";

interface PrintCustomerReceiptContentProps {
  docNo: string;
  initialData?: any;
  onLoad?: () => void;
}

export default function PrintCustomerReceiptContent({
  docNo,
  initialData,
  onLoad,
}: PrintCustomerReceiptContentProps) {
  const [loading, setLoading] = useState(!initialData);
  const [data, setData] = useState<any>(initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setLoading(false);
      onLoad?.();
      return;
    }

    const fetchReceipt = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: res } = await api.get(
          `/customer-receipts/load-receipt-by-code/${docNo}`,
        );

        if (res.success) {
          setData(res.data);
          onLoad?.();
        } else {
          setError("Failed to load customer receipt data");
        }
      } catch {
        setError("Failed to load customer receipt data");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [docNo, initialData, onLoad]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-slate-500">
        <Loader />
        <span className="text-sm font-medium tracking-wide">
          Loading customer receipt…
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
        Customer receipt not found.
      </div>
    );
  }

  const { details = [], summaries = [], account } = data;
  const isSetOff = details.length > 0 && details[0]?.iid === "CSOF";

  const totalAllocated = details.reduce(
    (sum: number, d: any) => sum + parseFloat(d.paid_amount || 0),
    0,
  );

  const uniqueSummaries = Array.from(
    new Map(summaries.map((s: any) => [s.payment_mode + s.amount, s])).values(),
  );

  const headerDate =
    details.length > 0
      ? details[0].transaction_date
      : summaries.length > 0
        ? summaries[0].transaction_date
        : "";

  const formatThousandSeparator = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue as number)) return "0.00";
    return (numValue as number).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value: string) => {
    if (!value) return "N/A";
    const date = new Date(value);
    return isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  const accountName = account?.customer_name || account?.sup_name || "—";
  const accountCode = account?.customer_code || account?.sup_code || "—";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        .cr-root * { box-sizing: border-box; }

        .cr-root {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          color: #1a1f2e;
          background: #fff;
          padding: 28px 36px 36px;
          max-width: 900px;
          margin: 0 auto;
        }

        .cr-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 2px solid #1a1f2e;
          margin-bottom: 12px;
        }

        .cr-brand-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 3px;
        }

        .cr-location {
          font-size: 19px;
          font-weight: 600;
          color: #1a1f2e;
          line-height: 1.2;
        }

        .cr-badge {
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

        .cr-doc-grid {
          text-align: right;
        }

        .cr-doc-row {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
          color: #374151;
          font-size: 12px;
          margin-bottom: 2px;
        }

        .cr-doc-row span:first-child {
          color: #9ca3af;
          font-weight: 500;
        }

        .cr-doc-row span:last-child {
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          color: #1a1f2e;
        }

        .cr-contact {
          margin-top: 5px;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .cr-contact-name {
          font-size: 11.5px;
          color: #374151;
          font-weight: 500;
          line-height: 1.35;
        }

        .cr-contact-line {
          font-size: 11px;
          color: #6b7280;
          line-height: 1.35;
        }

        .cr-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-bottom: 14px;
          border: 1px solid #d1d5db;
        }

        .cr-meta-col {
          padding: 8px 10px;
        }

        .cr-meta-col:not(:last-child) {
          border-right: 1px solid #d1d5db;
        }

        .cr-meta-col-title {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 4px;
        }

        .cr-meta-row {
          display: flex;
          flex-direction: column;
          margin-bottom: 4px;
        }

        .cr-meta-row:last-child {
          margin-bottom: 0;
        }

        .cr-meta-key {
          font-size: 9.5px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: .05em;
          margin-bottom: 1px;
        }

        .cr-meta-val {
          font-size: 12px;
          font-weight: 500;
          color: #1a1f2e;
        }

        .cr-table-wrap {
          margin-bottom: 14px;
        }

        .cr-section-title {
          margin-bottom: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: #1a1f2e;
        }

        .cr-table {
          width: 100%;
          border-collapse: collapse;
        }

        .cr-table th {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          background: #f1f3f6;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #4b5563;
          white-space: nowrap;
        }

        .cr-table th.left, .cr-table td.left { text-align: left; }
        .cr-table th.right, .cr-table td.right { text-align: right; }
        .cr-table th.center, .cr-table td.center { text-align: center; }

        .cr-table td {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          color: #374151;
          vertical-align: middle;
        }

        .cr-table td.right {
          font-family: 'Poppins', sans-serif;
          font-size: 11.5px;
        }

        .cr-table td.center {
          font-family: 'Poppins', sans-serif;
          font-size: 11.5px;
        }

        .cr-row-num {
          font-size: 11.5px;
          font-weight: 500;
          color: #374151;
        }

        .cr-bill-no {
          font-family: 'Poppins', sans-serif;
          font-size: 11.5px;
          font-weight: 600;
          color: #1a1f2e;
        }

        .cr-empty {
          padding: 20px;
          text-align: center;
          color: #9ca3af;
          font-size: 12.5px;
        }

        .cr-totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 14px;
        }

        .cr-totals-card {
          width: 300px;
          border: 1px solid #1a1f2e;
        }

        .cr-totals-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          border-bottom: 1px solid #d1d5db;
          font-size: 12.5px;
        }

        .cr-totals-row:last-child {
          border-bottom: none;
        }

        .cr-totals-row .label {
          color: #6b7280;
          font-weight: 500;
        }

        .cr-totals-row .value {
          font-family: 'Poppins', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          color: #1a1f2e;
        }

        .cr-totals-row.net .label {
          font-weight: 600;
        }

        .cr-totals-row.net .value {
          font-size: 14px;
          font-weight: 600;
        }

        .cr-sig {
          margin-top: 32px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
        }

        .cr-sig-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .cr-sig-line {
          width: 100%;
          border-bottom: 1.5px solid #1a1f2e;
        }

        .cr-sig-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #6b7280;
        }

        .cr-footer {
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
          .cr-root {
            padding: 14px 20px;
            max-width: 100%;
          }
        }
      `}</style>

      <div className="cr-root">
        {/* ── Header ── */}
        <div className="cr-header">
          <div>
            <div className="cr-brand-label">Issued by</div>
            <div className="cr-location">Venpaa Bookstore</div>

            <div className="cr-contact">
              <span className="cr-contact-name">Venpaa Bookstore</span>
              <span className="cr-contact-line">
                465 1/1 Galle Road, Colombo 06
              </span>
              <span className="cr-contact-line">Tel: 076 669 9647</span>
              <span className="cr-contact-line">
                Email: venpaabookhouse@gmail.com
              </span>
            </div>
          </div>
          <div className="cr-doc-grid">
            <div className="cr-badge">
              {isSetOff ? "Customer Set-Off" : "Customer Receipt"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div className="cr-doc-row">
                <span>Doc No</span>
                <span>{docNo || data.doc_no || "—"}</span>
              </div>
              <div className="cr-doc-row">
                <span>Date</span>
                <span>{formatDate(headerDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Account Meta ── */}
        <div className="cr-meta">
          <div className="cr-meta-col">
            <div className="cr-meta-col-title">Received From</div>
            <div className="cr-meta-row">
              <span className="cr-meta-key">Name</span>
              <span className="cr-meta-val">{accountName}</span>
            </div>
          </div>
          <div className="cr-meta-col">
            <div className="cr-meta-col-title">Account</div>
            <div className="cr-meta-row">
              <span className="cr-meta-key">Code</span>
              <span className="cr-meta-val">{accountCode}</span>
            </div>
          </div>
          <div className="cr-meta-col">
            <div className="cr-meta-col-title">Receipt Type</div>
            <div className="cr-meta-row">
              <span className="cr-meta-key">Type</span>
              <span className="cr-meta-val">
                {isSetOff ? "Set-Off" : "Receipt"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Receipt Breakdown ── */}
        {!isSetOff && uniqueSummaries.length > 0 && (
          <div className="cr-table-wrap">
            <div className="cr-section-title">Receipt Breakdown</div>
            <table className="cr-table">
              <thead>
                <tr>
                  <th className="left">Receipt Mode</th>
                  <th className="left">Bank Details</th>
                  <th className="left">Cheque No/Date</th>
                  <th className="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {uniqueSummaries.map((sum: any, idx: number) => (
                  <tr key={idx}>
                    <td className="left">{sum.payment_mode}</td>
                    <td className="left">
                      {sum.bank_name || "-"}{" "}
                      {sum.branch ? `(${sum.branch})` : ""}
                    </td>
                    <td className="left">
                      {sum.cheque_no || "-"}{" "}
                      {sum.cheque_date
                        ? `/ ${formatDate(sum.cheque_date)}`
                        : ""}
                    </td>
                    <td className="right" style={{ fontWeight: 600 }}>
                      {formatThousandSeparator(sum.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Bill Allocations ── */}
        <div className="cr-table-wrap">
          <div className="cr-section-title">Bill Allocations</div>
          <table className="cr-table">
            <thead>
              <tr>
                <th className="left" style={{ width: 44 }}>#</th>
                <th className="left">Bill No</th>
                <th className="left">Date</th>
                <th className="right">Bill Amount</th>
                <th className="right">Paid Amount</th>
              </tr>
            </thead>
            <tbody>
              {details.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="cr-empty">
                      No bill allocations for this receipt.
                    </div>
                  </td>
                </tr>
              ) : (
                details.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="left">
                      <div className="cr-row-num">{index + 1}</div>
                    </td>
                    <td className="left">
                      <span className="cr-bill-no">{item.doc_no}</span>
                    </td>
                    <td className="left">{formatDate(item.document_date)}</td>
                    <td className="right">
                      {formatThousandSeparator(item.transaction_amount)}
                    </td>
                    <td
                      className="right"
                      style={{ fontWeight: 600, color: "#1a1f2e" }}
                    >
                      {formatThousandSeparator(item.paid_amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Totals ── */}
        <div className="cr-totals">
          <div className="cr-totals-card">
            <div className="cr-totals-row net">
              <span className="label">Total Received</span>
              <span className="value">
                {formatThousandSeparator(totalAllocated)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Signature Block ── */}
        <div className="cr-sig">
          {["Received By", "Prepared By", "Approved By"].map((label) => (
            <div key={label} className="cr-sig-col">
              <div style={{ height: "64px", width: "100%" }} />
              <div className="cr-sig-line" />
              <span className="cr-sig-label">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="cr-footer">
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
