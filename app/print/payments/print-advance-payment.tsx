"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import Loader from "@/components/ui/loader";

interface PrintAdvancePaymentContentProps {
  docNo: string;
  initialData?: any;
  onLoad?: () => void;
}

export default function PrintAdvancePaymentContent({
  docNo,
  initialData,
  onLoad,
}: PrintAdvancePaymentContentProps) {
  const [loading, setLoading] = useState(!initialData);
  const [data, setData] = useState<any>(initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setLoading(false);
      onLoad?.();
      return;
    }

    const fetchAdvance = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: res } = await api.get(
          `/transactions/load-advance-by-code/${docNo}`,
        );

        if (res.success) {
          setData(res.data);
          onLoad?.();
        } else {
          setError("Failed to load advance payment data");
        }
      } catch {
        setError("Failed to load advance payment data");
      } finally {
        setLoading(false);
      }
    };

    fetchAdvance();
  }, [docNo, initialData, onLoad]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-slate-500">
        <Loader />
        <span className="text-sm font-medium tracking-wide">
          Loading advance payment…
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
        Advance payment not found.
      </div>
    );
  }

  const { advance, account } = data;
  const isSupplier = advance?.acc_type === "supplier";

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

  const advanceAmount = advance?.transaction_amount || 0;
  const balanceAmount = advance?.balance_amount || 0;
  const settledAmount =
    parseFloat(advanceAmount || 0) - parseFloat(balanceAmount || 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        .ap-root * { box-sizing: border-box; }

        .ap-root {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          color: #1a1f2e;
          background: #fff;
          padding: 28px 36px 36px;
          max-width: 900px;
          margin: 0 auto;
        }

        .ap-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 2px solid #1a1f2e;
          margin-bottom: 12px;
        }

        .ap-brand-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 3px;
        }

        .ap-location {
          font-size: 19px;
          font-weight: 600;
          color: #1a1f2e;
          line-height: 1.2;
        }

        .ap-badge {
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

        .ap-doc-grid {
          text-align: right;
        }

        .ap-doc-row {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
          color: #374151;
          font-size: 12px;
          margin-bottom: 2px;
        }

        .ap-doc-row span:first-child {
          color: #9ca3af;
          font-weight: 500;
        }

        .ap-doc-row span:last-child {
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          color: #1a1f2e;
        }

        .ap-contact {
          margin-top: 5px;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .ap-contact-name {
          font-size: 11.5px;
          color: #374151;
          font-weight: 500;
          line-height: 1.35;
        }

        .ap-contact-line {
          font-size: 11px;
          color: #6b7280;
          line-height: 1.35;
        }

        .ap-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-bottom: 14px;
          border: 1px solid #d1d5db;
        }

        .ap-meta-col {
          padding: 8px 10px;
        }

        .ap-meta-col:not(:last-child) {
          border-right: 1px solid #d1d5db;
        }

        .ap-meta-col-title {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 4px;
        }

        .ap-meta-row {
          display: flex;
          flex-direction: column;
          margin-bottom: 4px;
        }

        .ap-meta-row:last-child {
          margin-bottom: 0;
        }

        .ap-meta-key {
          font-size: 9.5px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: .05em;
          margin-bottom: 1px;
        }

        .ap-meta-val {
          font-size: 12px;
          font-weight: 500;
          color: #1a1f2e;
        }

        .ap-detail-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }

        .ap-detail-cell {
          border: 1px solid #d1d5db;
          padding: 9px 12px;
        }

        .ap-detail-key {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 3px;
        }

        .ap-detail-val {
          font-size: 12.5px;
          font-weight: 500;
          color: #1a1f2e;
        }

        .ap-amount-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 14px;
        }

        .ap-amount-card {
          border: 1px solid #d1d5db;
          padding: 12px 14px;
          background: #f1f3f6;
        }

        .ap-amount-card.balance {
          border-color: #1a1f2e;
        }

        .ap-amount-key {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 5px;
        }

        .ap-amount-val {
          font-family: 'Poppins', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #1a1f2e;
          line-height: 1.1;
        }

        .ap-amount-card.balance .ap-amount-val {
          color: #059669;
        }

        .ap-totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 14px;
        }

        .ap-totals-card {
          width: 320px;
          border: 1px solid #1a1f2e;
        }

        .ap-totals-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          border-bottom: 1px solid #d1d5db;
          font-size: 12.5px;
        }

        .ap-totals-row:last-child {
          border-bottom: none;
        }

        .ap-totals-row .label {
          color: #6b7280;
          font-weight: 500;
        }

        .ap-totals-row .value {
          font-family: 'Poppins', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          color: #1a1f2e;
        }

        .ap-totals-row.net .label {
          font-weight: 600;
        }

        .ap-totals-row.net .value {
          font-size: 14px;
          font-weight: 600;
        }

        .ap-note {
          border: 1px dashed #9ca3af;
          padding: 10px 14px;
          font-size: 11.5px;
          color: #6b7280;
          line-height: 1.5;
          margin-bottom: 14px;
        }

        .ap-sig {
          margin-top: 32px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
        }

        .ap-sig-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .ap-sig-line {
          width: 100%;
          border-bottom: 1.5px solid #1a1f2e;
        }

        .ap-sig-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #6b7280;
        }

        .ap-footer {
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
          .ap-root {
            padding: 14px 20px;
            max-width: 100%;
          }
        }
      `}</style>

      <div className="ap-root">
        {/* ── Header ── */}
        <div className="ap-header">
          <div>
            <div className="ap-brand-label">Issued by</div>
            <div className="ap-location">Venpaa Bookstore</div>

            <div className="ap-contact">
              <span className="ap-contact-name">Venpaa Bookstore</span>
              <span className="ap-contact-line">
                465 1/1 Galle Road, Colombo 06
              </span>
              <span className="ap-contact-line">Tel: 076 669 9647</span>
              <span className="ap-contact-line">
                Email: venpaabookhouse@gmail.com
              </span>
            </div>
          </div>
          <div className="ap-doc-grid">
            <div className="ap-badge">
              {isSupplier ? "Supplier Advance" : "Customer Advance"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div className="ap-doc-row">
                <span>Doc No</span>
                <span>{docNo || advance?.doc_no || "—"}</span>
              </div>
              <div className="ap-doc-row">
                <span>Date</span>
                <span>{formatDate(advance?.document_date)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Account Meta ── */}
        <div className="ap-meta">
          <div className="ap-meta-col">
            <div className="ap-meta-col-title">
              {isSupplier ? "Paid To" : "Received From"}
            </div>
            <div className="ap-meta-row">
              <span className="ap-meta-key">Name</span>
              <span className="ap-meta-val">{accountName}</span>
            </div>
          </div>
          <div className="ap-meta-col">
            <div className="ap-meta-col-title">Account</div>
            <div className="ap-meta-row">
              <span className="ap-meta-key">Code</span>
              <span className="ap-meta-val">{accountCode}</span>
            </div>
          </div>
          <div className="ap-meta-col">
            <div className="ap-meta-col-title">Advance Type</div>
            <div className="ap-meta-row">
              <span className="ap-meta-key">Type</span>
              <span className="ap-meta-val">
                {isSupplier ? "Supplier Advance" : "Customer Advance"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Details ── */}
        <div className="ap-detail-grid">
          <div className="ap-detail-cell">
            <div className="ap-detail-key">Reference No</div>
            <div className="ap-detail-val">{advance?.ref_doc_no || "—"}</div>
          </div>
          <div className="ap-detail-cell">
            <div className="ap-detail-key">Location</div>
            <div className="ap-detail-val">{advance?.location || "—"}</div>
          </div>
          <div className="ap-detail-cell">
            <div className="ap-detail-key">Transaction Date</div>
            <div className="ap-detail-val">
              {formatDate(advance?.transaction_date)}
            </div>
          </div>
        </div>

        {/* ── Amounts ── */}
        <div className="ap-amount-grid">
          <div className="ap-amount-card">
            <div className="ap-amount-key">Advance Amount</div>
            <div className="ap-amount-val">
              {formatThousandSeparator(advanceAmount)}
            </div>
          </div>
          <div className="ap-amount-card balance">
            <div className="ap-amount-key">Balance Available</div>
            <div className="ap-amount-val">
              {formatThousandSeparator(balanceAmount)}
            </div>
          </div>
        </div>

        {/* ── Totals ── */}
        <div className="ap-totals">
          <div className="ap-totals-card">
            <div className="ap-totals-row">
              <span className="label">Advance Amount</span>
              <span className="value">
                {formatThousandSeparator(advanceAmount)}
              </span>
            </div>
            <div className="ap-totals-row">
              <span className="label">Settled Amount</span>
              <span className="value">
                {formatThousandSeparator(settledAmount)}
              </span>
            </div>
            <div className="ap-totals-row net">
              <span className="label">Balance Available</span>
              <span className="value">
                {formatThousandSeparator(balanceAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Note ── */}
        <div className="ap-note">
          This is a system generated advance payment record. The balance
          available may be adjusted against future invoices or payments.
        </div>

        {/* ── Signature Block ── */}
        <div className="ap-sig">
          {["Prepared By", "Checked By", "Approved By"].map((label) => (
            <div key={label} className="ap-sig-col">
              <div style={{ height: "64px", width: "100%" }} />
              <div className="ap-sig-line" />
              <span className="ap-sig-label">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="ap-footer">
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
