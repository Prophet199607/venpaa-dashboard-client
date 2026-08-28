"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";

interface PrintPaymentVoucherContentProps {
  docNo: string;
  initialData?: any;
  onLoad?: () => void;
}

export default function PrintPaymentVoucherContent({
  docNo,
  initialData,
  onLoad,
}: PrintPaymentVoucherContentProps) {
  const [loading, setLoading] = useState(!initialData);
  const [data, setData] = useState<any>(initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setLoading(false);
      onLoad?.();
      return;
    }

    const fetchPayment = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: res } = await api.get(
          `/payment-vouchers/load-payment-by-code/${docNo}`,
        );

        if (res.success) {
          setData(res.data);
          onLoad?.();
        } else {
          setError("Failed to load payment voucher data");
        }
      } catch {
        setError("Failed to load payment voucher data");
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [docNo, initialData, onLoad]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-slate-500">
        <Loader />
        <span className="text-sm font-medium tracking-wide">
          Loading payment voucher…
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
        Payment voucher not found.
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

  const accountName = account?.sup_name || account?.customer_name || "—";
  const accountCode = account?.sup_code || account?.customer_code || "—";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .pv-root * { box-sizing: border-box; }

        .pv-root {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #1a1f2e;
          background: #fff;
          padding: 28px 36px 36px;
          max-width: 900px;
          margin: 0 auto;
        }

        .pv-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 2px solid #1a1f2e;
          margin-bottom: 12px;
        }

        .pv-brand-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 3px;
        }

        .pv-location {
          font-size: 19px;
          font-weight: 600;
          color: #1a1f2e;
          line-height: 1.2;
        }

        .pv-badge {
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

        .pv-doc-grid {
          text-align: right;
        }

        .pv-doc-row {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
          color: #374151;
          font-size: 12px;
          margin-bottom: 2px;
        }

        .pv-doc-row span:first-child {
          color: #9ca3af;
          font-weight: 500;
        }

        .pv-doc-row span:last-child {
          font-family: 'DM Mono', monospace;
          font-weight: 500;
          color: #1a1f2e;
        }

        .pv-contact {
          margin-top: 5px;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .pv-contact-name {
          font-size: 11.5px;
          color: #374151;
          font-weight: 500;
          line-height: 1.35;
        }

        .pv-contact-line {
          font-size: 11px;
          color: #6b7280;
          line-height: 1.35;
        }

        .pv-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-bottom: 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
        }

        .pv-meta-col {
          padding: 8px 10px;
        }

        .pv-meta-col:not(:last-child) {
          border-right: 1.5px solid #e5e7eb;
        }

        .pv-meta-col-title {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 4px;
        }

        .pv-meta-row {
          display: flex;
          flex-direction: column;
          margin-bottom: 4px;
        }

        .pv-meta-row:last-child {
          margin-bottom: 0;
        }

        .pv-meta-key {
          font-size: 9.5px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: .05em;
          margin-bottom: 1px;
        }

        .pv-meta-val {
          font-size: 12px;
          font-weight: 500;
          color: #1a1f2e;
        }

        .pv-table-wrap {
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .pv-section-title {
          padding: 8px 14px;
          background: #f8f9fb;
          border-bottom: 1.5px solid #e5e7eb;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #6b7280;
        }

        .pv-table {
          width: 100%;
          border-collapse: collapse;
        }

        .pv-table thead tr {
          background: #fff;
          border-bottom: 1.5px solid #e5e7eb;
        }

        .pv-table th {
          padding: 8px 12px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #6b7280;
          white-space: nowrap;
        }

        .pv-table th.left, .pv-table td.left { text-align: left; }
        .pv-table th.right, .pv-table td.right { text-align: right; }
        .pv-table th.center, .pv-table td.center { text-align: center; }

        .pv-table tbody tr {
          border-bottom: 1px solid #f3f4f6;
        }

        .pv-table tbody tr:last-child {
          border-bottom: none;
        }

        .pv-table td {
          padding: 8px 12px;
          color: #374151;
          vertical-align: middle;
        }

        .pv-table td.right {
          font-family: 'DM Mono', monospace;
          font-size: 11.5px;
        }

        .pv-table td.center {
          font-family: 'DM Mono', monospace;
          font-size: 11.5px;
        }

        .pv-row-num {
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

        .pv-bill-no {
          font-family: 'DM Mono', monospace;
          font-size: 11.5px;
          font-weight: 500;
          color: #1a1f2e;
        }

        .pv-empty {
          padding: 20px;
          text-align: center;
          color: #9ca3af;
          font-size: 12.5px;
        }

        .pv-totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 14px;
        }

        .pv-totals-card {
          width: 300px;
          border: 1.5px solid #1a1f2e;
          border-radius: 10px;
          overflow: hidden;
        }

        .pv-totals-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 12.5px;
        }

        .pv-totals-row:last-child {
          border-bottom: none;
        }

        .pv-totals-row .label {
          color: #6b7280;
          font-weight: 500;
        }

        .pv-totals-row .value {
          font-family: 'DM Mono', monospace;
          font-size: 12.5px;
          font-weight: 500;
          color: #1a1f2e;
        }

        .pv-totals-row.net .label {
          font-weight: 600;
        }

        .pv-totals-row.net .value {
          font-size: 14px;
          font-weight: 600;
        }

        .pv-sig {
          margin-top: 32px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
        }

        .pv-sig-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .pv-sig-line {
          width: 100%;
          border-bottom: 1.5px solid #1a1f2e;
        }

        .pv-sig-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #6b7280;
        }

        .pv-footer {
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
          .pv-root {
            padding: 14px 20px;
            max-width: 100%;
          }
        }
      `}</style>

      <div className="pv-root">
        {/* ── Header ── */}
        <div className="pv-header">
          <div>
            <div className="pv-brand-label">Issued by</div>
            <div className="pv-location">Venpaa Bookstore</div>

            <div className="pv-contact">
              <span className="pv-contact-name">Venpaa Bookstore</span>
              <span className="pv-contact-line">465 1/1 Galle Road, Colombo 06</span>
              <span className="pv-contact-line">Tel: 076 669 9647</span>
              <span className="pv-contact-line">Email: venpaabookhouse@gmail.com</span>
            </div>
          </div>
          <div className="pv-doc-grid">
            <div className="pv-badge">
              {isSetOff ? "Supplier Set-Off" : "Payment Voucher"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div className="pv-doc-row">
                <span>Doc No</span>
                <span>{docNo || data.doc_no || "—"}</span>
              </div>
              <div className="pv-doc-row">
                <span>Date</span>
                <span>{formatDate(headerDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Account Meta ── */}
        <div className="pv-meta">
          <div className="pv-meta-col">
            <div className="pv-meta-col-title">Pay To</div>
            <div className="pv-meta-row">
              <span className="pv-meta-key">Name</span>
              <span className="pv-meta-val">{accountName}</span>
            </div>
          </div>
          <div className="pv-meta-col">
            <div className="pv-meta-col-title">Account</div>
            <div className="pv-meta-row">
              <span className="pv-meta-key">Code</span>
              <span className="pv-meta-val">{accountCode}</span>
            </div>
          </div>
          <div className="pv-meta-col">
            <div className="pv-meta-col-title">Voucher Type</div>
            <div className="pv-meta-row">
              <span className="pv-meta-key">Type</span>
              <span className="pv-meta-val">
                {isSetOff ? "Set-Off" : "Payment"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Payment Breakdown ── */}
        {!isSetOff && uniqueSummaries.length > 0 && (
          <div className="pv-table-wrap">
            <div className="pv-section-title">Payment Breakdown</div>
            <table className="pv-table">
              <thead>
                <tr>
                  <th className="left">Payment Mode</th>
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
        <div className="pv-table-wrap">
          <div className="pv-section-title">Bill Allocations</div>
          <table className="pv-table">
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
                    <div className="pv-empty">
                      No bill allocations for this voucher.
                    </div>
                  </td>
                </tr>
              ) : (
                details.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="left">
                      <div className="pv-row-num">{index + 1}</div>
                    </td>
                    <td className="left">
                      <span className="pv-bill-no">{item.doc_no}</span>
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
        <div className="pv-totals">
          <div className="pv-totals-card">
            <div className="pv-totals-row net">
              <span className="label">Total Paid</span>
              <span className="value">
                {formatThousandSeparator(totalAllocated)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Signature Block ── */}
        <div className="pv-sig">
          {["Prepared By", "Checked By", "Approved By"].map((label) => (
            <div key={label} className="pv-sig-col">
              <div style={{ height: "64px", width: "100%" }} />
              <div className="pv-sig-line" />
              <span className="pv-sig-label">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="pv-footer">
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