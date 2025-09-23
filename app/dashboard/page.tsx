import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { users } from "@/lib/data";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

type U = (typeof users)[number];

const columns: ColumnDef<U>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "status", header: "Status" },
];

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 items-stretch">
        {["New Leads", "Proposals Sent", "Revenue", "Projects Won"].map(
          (t, i) => (
            <Card key={i} className="h-[160px]">
              <CardHeader>
                <div className="text-sm text-neutral-500">{t}</div>
                <div className="mt-3 text-3xl font-semibold">
                  {[635, 48, 56050, 136][i].toLocaleString()}
                </div>
                <div
                  className={
                    "mt-2 inline-flex px-2 py-0.5 rounded-full text-xs " +
                    (i % 2 === 0
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300")
                  }
                >
                  {["+54.6%", "+22.1%", "+22.2%", "-2.5%"][i]}
                </div>
              </CardHeader>
            </Card>
          )
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="text-lg font-semibold">Leads by Source</div>
          </CardHeader>
          <CardContent>
            <div className="h-64 grid place-items-center text-neutral-400">
              Donut Chart (plug your lib here)
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline">View Full Report</Button>
              <Button variant="outline">Download CSV</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="text-lg font-semibold">
              Project Revenue vs. Target
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 grid place-items-center text-neutral-400">
              Horizontal Bars (plug your lib here)
            </div>
            <div className="text-xs text-neutral-500 mt-3">
              Average progress: 78% · 2 projects above target
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <div className="text-lg font-semibold">Users</div>
        <Card>
          <CardContent>
            <DataTable columns={columns} data={users} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
