"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { nodeApi } from "@/utils/api-node";
import { usePermissions } from "@/context/permissions";
import { useToast } from "@/hooks/use-toast";
import { AccessDenied } from "@/components/shared/access-denied";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BellRing,
  BookOpen,
  CheckCircle2,
  Loader,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StockRequest {
  id: number;
  name: string;
  email: string;
  phone_no: string;
  message: string | null;
  prod_code: string;
  prod_name: string;
  status: number;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

interface BookGroup {
  key: string;
  prod_code: string;
  prod_name: string;
  requests: StockRequest[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_NOTIFIED = 1;

function isNotified(request: StockRequest) {
  return request.status === STATUS_NOTIFIED;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value.replace(" ", "T"));
  if (isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Page ──────────────────────────────────────────────────────────────────────

function BookRequestsPageContent() {
  const { toast } = useToast();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const fetchedRef = useRef(false);
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const searchTerm = query.trim().toLowerCase();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const firstRes = await nodeApi.get("/stock-requests");
      const firstData: StockRequest[] = firstRes.data?.data ?? [];
      const meta: Pagination | undefined = firstRes.data?.pagination;
      const lastPage: number = meta?.last_page ?? 1;

      let all: StockRequest[] = [...firstData];

      if (lastPage > 1) {
        const remaining = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
        const responses = await Promise.all(
          remaining.map((p) => nodeApi.get(`/stock-requests?page=${p}`)),
        );
        responses.forEach((res) => {
          all = [...all, ...((res.data?.data ?? []) as StockRequest[])];
        });
      }

      setRequests(all);
    } catch (err: any) {
      console.error("Failed to fetch stock requests:", err);
      toast({
        title: "Failed to load book requests",
        description:
          err.response?.data?.message ||
          err.message ||
          "Could not reach the book requests API.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchRequests();
  }, [fetchRequests]);

  // ── Filtering ────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const matchesStatus = (r: StockRequest) =>
      statusFilter === "all" ||
      (statusFilter === "notified" && isNotified(r)) ||
      (statusFilter === "pending" && !isNotified(r));

    if (!searchTerm) {
      return requests.filter(matchesStatus).sort((a, b) => {
        const at = new Date(a.created_at.replace(" ", "T")).getTime();
        const bt = new Date(b.created_at.replace(" ", "T")).getTime();
        return (isNaN(bt) ? 0 : bt) - (isNaN(at) ? 0 : at);
      });
    }

    return requests
      .filter((r) => {
        if (!matchesStatus(r)) return false;
        return (
          r.prod_name.toLowerCase().includes(searchTerm) ||
          r.prod_code.toLowerCase().includes(searchTerm) ||
          r.name.toLowerCase().includes(searchTerm) ||
          r.phone_no.toLowerCase().includes(searchTerm) ||
          r.email.toLowerCase().includes(searchTerm)
        );
      })
      .sort((a, b) => {
        const at = new Date(a.created_at.replace(" ", "T")).getTime();
        const bt = new Date(b.created_at.replace(" ", "T")).getTime();
        return (isNaN(bt) ? 0 : bt) - (isNaN(at) ? 0 : at);
      });
  }, [requests, searchTerm, statusFilter]);

  /** Requests grouped by book — shown whenever a search term is active. */
  const groupedByBook = useMemo<BookGroup[]>(() => {
    const map = new Map<string, BookGroup>();

    for (const request of filtered) {
      const key = request.prod_code || request.prod_name;
      const group = map.get(key);

      if (group) {
        group.requests.push(request);
      } else {
        map.set(key, {
          key,
          prod_code: request.prod_code,
          prod_name: request.prod_name,
          requests: [request],
        });
      }
    }

    return [...map.values()].sort(
      (a, b) => b.requests.length - a.requests.length,
    );
  }, [filtered]);

  const isSearching = searchTerm.length > 0;

  // ── Flat table columns (pagination handled by DataTable) ────────────────────

  const columns: ColumnDef<StockRequest>[] = [
    {
      header: "#",
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.index + 1}</div>
      ),
    },
    {
      header: "Book",
      cell: ({ row }) => (
        <div className="max-w-[22rem] whitespace-normal">
          <div className="font-medium">{row.original.prod_name || "-"}</div>
          <div className="text-xs text-muted-foreground font-mono">
            {row.original.prod_code || "-"}
          </div>
        </div>
      ),
    },
    {
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name || "-"}</div>
          {row.original.email ? (
            <a
              href={`mailto:${row.original.email}`}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {row.original.email}
            </a>
          ) : (
            <div className="text-xs text-muted-foreground">-</div>
          )}
        </div>
      ),
    },
    {
      header: "Contact Number",
      cell: ({ row }) => <ContactNumber value={row.original.phone_no} />,
    },
    {
      header: "Message",
      cell: ({ row }) => (
        <div className="max-w-[18rem] whitespace-normal text-muted-foreground">
          {row.original.message || "-"}
        </div>
      ),
    },
    {
      header: "Requested",
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-muted-foreground">
          {formatDateTime(row.original.created_at)}
        </div>
      ),
    },
    {
      header: "Status",
      cell: ({ row }) => <StatusBadge request={row.original} />,
    },
  ];

  // ── Stats ────────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const notified = requests.filter(isNotified).length;
    const books = new Set(requests.map((r) => r.prod_code || r.prod_name)).size;

    return {
      total: requests.length,
      pending: requests.length - notified,
      notified,
      books,
    };
  }, [requests]);

  // ── Guards ───────────────────────────────────────────────────────────────────

  if (!permissionsLoading && !hasPermission("manage book-request")) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-2">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <BellRing className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              Manage Book Requests
            </h1>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchRequests}
          disabled={loading}
          className="gap-2 rounded-full px-4 self-start sm:self-auto"
        >
          <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
          Refresh
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Requests"
          value={stats.total}
          icon={BellRing}
          tone="text-primary"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={Loader}
          tone="text-amber-500"
        />
        <StatCard
          label="Notified"
          value={stats.notified}
          icon={CheckCircle2}
          tone="text-emerald-500"
        />
        <StatCard
          label="Books Requested"
          value={stats.books}
          icon={BookOpen}
          tone="text-blue-500"
        />
      </div>

      {/* ── Toolbar ── */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by book title, customer name, contact number or email..."
                className="!pl-9 !pr-9"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="lg:w-52">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="notified">Notified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Showing {filtered.length} request{filtered.length !== 1 ? "s" : ""}
            {isSearching ? ` matching "${query.trim()}"` : ""}
          </p>
        </CardContent>
      </Card>

      {/* ── Loading ── */}
      {loading && requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader />
          <span className="text-sm font-medium text-muted-foreground">
            Loading book requests...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 flex flex-col items-center justify-center py-24 px-4 text-center rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/10">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 shadow-xl flex items-center justify-center mb-4">
            <BellRing className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-xl tracking-tight">
            {isSearching ? "No matching requests" : "No book requests yet"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">
            {isSearching
              ? "No request matches your search. Try a different book title, name or contact number."
              : "Requests made from the website when a book is out of stock will appear here."}
          </p>
        </Card>
      ) : isSearching ? (
        /* ── Grouped by book: all customers who requested a matching book ── */
        <div className="space-y-4">
          {groupedByBook.map((group) => (
            <BookGroupCard key={group.key} group={group} />
          ))}
        </div>
      ) : (
        /* ── Flat table — paginated by DataTable ── */
        <Card>
          <CardContent className="pt-4">
            <DataTable
              columns={columns}
              data={filtered}
              searchValue={query}
              onSearchChange={setQuery}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <Icon className={`w-5 h-5 ${tone}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Book group card ───────────────────────────────────────────────────────────

function BookGroupCard({ group }: { group: BookGroup }) {
  return (
    <Card className="overflow-hidden rounded-2xl">
      <div className="p-4 border-b bg-neutral-50/60 dark:bg-neutral-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold tracking-tight max-w-2xl whitespace-normal">
                {group.prod_name || "-"}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                {group.prod_code || "-"}
              </p>
            </div>
          </div>
          <Badge className="gap-1.5 self-start sm:self-auto rounded-full px-3 py-1 bg-primary/10 text-primary border-none">
            <Users className="w-3 h-3" />
            {group.requests.length} request
            {group.requests.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50 dark:bg-neutral-900/60 hover:bg-neutral-50">
                <TableHead className="px-4 py-3">Name</TableHead>
                <TableHead className="px-4 py-3">Contact Number</TableHead>
                <TableHead className="px-4 py-3">Email Address</TableHead>
                <TableHead className="px-4 py-3">Message</TableHead>
                <TableHead className="px-4 py-3">Requested</TableHead>
                <TableHead className="px-4 py-3">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="px-4 py-3 font-medium">
                    {request.name || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <ContactNumber value={request.phone_no} />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {request.email ? (
                      <a
                        href={`mailto:${request.email}`}
                        className="flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        {request.email}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 max-w-[18rem] whitespace-normal text-muted-foreground">
                    {request.message || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDateTime(request.created_at)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusBadge request={request} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}

// ─── Cells ─────────────────────────────────────────────────────────────────────

function ContactNumber({ value }: { value: string }) {
  if (!value) return <span>-</span>;

  return (
    <a
      href={`tel:${value}`}
      className="flex items-center gap-1.5 text-primary hover:underline whitespace-nowrap"
    >
      <Phone className="w-3.5 h-3.5 shrink-0" />
      {value}
    </a>
  );
}

function StatusBadge({ request }: { request: StockRequest }) {
  return isNotified(request) ? (
    <Badge className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-none">
      Notified
    </Badge>
  ) : (
    <Badge className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-none">
      Pending
    </Badge>
  );
}

// ─── Route ─────────────────────────────────────────────────────────────────────

export default function BookRequestsPage() {
  return (
    <div className="p-2">
      <BookRequestsPageContent />
    </div>
  );
}
