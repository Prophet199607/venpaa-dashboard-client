import React from "react";
import ReactDOM from "react-dom/client";

interface PrintWindowOptions {
  width?: number;
  height?: number;
  autoPrint?: boolean;
  autoClose?: boolean;
}

export const openPrintWindow = (
  component: React.ReactElement,
  options: PrintWindowOptions = {}
): Window | null => {
  const {
    width = 800,
    height = 600,
    autoPrint = true,
    autoClose = true,
  } = options;

  const printWindow = window.open(
    "",
    "_blank",
    `width=${width},height=${height}`
  );
  if (!printWindow) {
    console.error("Failed to open print window. Please allow popups.");
    return null;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Purchase Order</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0;
            padding: 10px;
            background-color: #fff;
            color: #000;
          }
          @media print {
            body { 
              margin: 10mm;
            }
            @page { 
              margin: 0;
              size: auto;
            }
            .no-print { 
              display: none !important; 
            }           
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .mt-5 { margin-top: 1.25rem; }
          .mb-5 { margin-bottom: 1.25rem; }
          .p-2 { padding: 0.5rem; }
          .p-8 { padding: 2rem; }
          .border { border: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `);
  printWindow.document.close();

  const rootElement = printWindow.document.getElementById("root");
  if (!rootElement) {
    console.error("Root element not found");
    printWindow.close();
    return null;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(component);

  const handlePrint = () => {
    if (autoPrint) {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    }
  };

  if (printWindow.document.readyState === "complete") {
    handlePrint();
  } else {
    printWindow.addEventListener("load", handlePrint);
  }

  if (autoClose) {
    printWindow.addEventListener("afterprint", () => {
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
      }, 100);
    });
  }

  return printWindow;
};
