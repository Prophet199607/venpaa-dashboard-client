export interface PermissionLike {
  id: number;
  name: string;
}

export const MASTER_FILES = [
  "department",
  "supplier",
  "location",
  "product",
  "customer",
  "price-level",
  "publisher",
  "author",
  "book",
  "magazine",
  "book-type",
  "category",
  "sub-category",
  "sub-category-l2",
  "language",
  "bin-card",
];

export const TRANSACTIONS = [
  "item-request",
  "pending-item-request",
  "purchase-order",
  "good-receive-note",
  "supplier-return-note",
  "stock-adjustment",
  "transfer-good-note",
  "accept-good-note",
  "transfer-good-return",
  "product-discard",
  "invoice",
  "open-stock",
];

export const PAYMENTS = [
  "advance-payment",
  "customer-receipt",
  "payment-voucher",
  "cod-management",
  "bank-transfer",
];

export const USER_MANAGEMENT = [
  "user",
  "role",
  "permission",
  "permission assign",
];

export const SALES_OPERATIONS = ["cashier", "salesman", "manage discount"];

export const ORDERS = ["view order", "update order"];

export const REPORTS = [
  "pos-sales-summary-report",
  "daily-collection-report",
  "current-stock-report",
  "inventory-movement-report",
  "sales-report",
  "web-sales-report",
  "supplier-wise-purchasing-report",
  "item-wise-purchasing-report",
];

export const WEBSITE = [
  "website-detail",
  "web-discount",
  "web-customer",
  "book-request",
  "navbar-item",
  "carousel",
  "banner",
  "coupon",
  "section",
  "featured-author",
  "featured-publisher",
];

export const ACTION_ORDER: Record<string, number> = {
  view: 1,
  create: 2,
  edit: 3,
  print: 4,
  export: 5,
};

export const SUPER_GROUP_ORDER = [
  "Master File",
  "Transactions",
  "Payments",
  "User Management",
  "Sales Operations",
  "Orders",
  "Reports",
  "Website",
  "System / Other",
];

/**
 * Super groups rendered as a flat checkbox grid instead of nested accordions.
 */
export const FLAT_SUPER_GROUPS = [
  "Reports",
  "System / Other",
  "Orders",
  "Website",
];

export function toTitle(value: string) {
  return value
    .split(/[-_\s]+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

/**
 * Resolve the module a permission belongs to, e.g. "view location" -> "location".
 */
export function getGroupKey(name: string): string {
  const trimmed = name.trim().toLowerCase();

  // Handle specific cases first
  if (trimmed.includes("dashboard stats")) return "dashboard stats";
  if (trimmed.includes("permission assign")) return "permission";
  if (trimmed.includes("manage discount")) return "manage discount";
  if (trimmed.includes("process day-end")) return "process day-end";

  const allModules = [
    ...MASTER_FILES,
    ...TRANSACTIONS,
    ...PAYMENTS,
    ...USER_MANAGEMENT,
    ...SALES_OPERATIONS,
    ...ORDERS,
    ...REPORTS,
    ...WEBSITE,
  ].sort((a, b) => b.length - a.length);

  // Check if it's one of our known modules (longest match first)
  for (const m of allModules) {
    if (trimmed.includes(m)) {
      if (m === "book-type") return "book";
      if (m === "sub-category" || m === "sub-category-l2") return "category";
      if (m === "permission assign") return "permission";
      return m;
    }
  }

  const parts = trimmed.split(" ");
  // Usually the last word is the module (e.g., "view location")
  const base = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return base.endsWith("s") ? base.slice(0, -1) : base;
}

/**
 * Resolve the super group a module belongs to.
 */
export function getSuperGroup(module: string): string {
  if (MASTER_FILES.includes(module)) return "Master File";
  if (TRANSACTIONS.includes(module)) return "Transactions";
  if (PAYMENTS.includes(module)) return "Payments";
  if (USER_MANAGEMENT.includes(module)) return "User Management";
  if (SALES_OPERATIONS.includes(module)) return "Sales Operations";
  if (ORDERS.includes(module)) return "Orders";
  if (REPORTS.some((r) => module.includes(r))) return "Reports";
  if (WEBSITE.includes(module)) return "Website";
  return "System / Other";
}

/**
 * Sort by module, then by action (view/create/edit/print/export), then name.
 */
export function sortPermissions<T extends PermissionLike>(perms: T[]): T[] {
  return [...perms].sort((a, b) => {
    const aParts = a.name.split(" ");
    const bParts = b.name.split(" ");
    const aAction = aParts[0].toLowerCase();
    const bAction = bParts[0].toLowerCase();
    const aEntity = aParts.slice(1).join(" ").toLowerCase();
    const bEntity = bParts.slice(1).join(" ").toLowerCase();

    if (aEntity !== bEntity) {
      return aEntity.localeCompare(bEntity);
    }

    const aScore = ACTION_ORDER[aAction] || 99;
    const bScore = ACTION_ORDER[bAction] || 99;

    if (aScore !== bScore) {
      return aScore - bScore;
    }

    return a.name.localeCompare(b.name);
  });
}
