import { users } from "@/lib/data";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";

type U = typeof users[number];
const columns: ColumnDef<U>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "status", header: "Status" }
];

export default function UsersPage(){
  return (
    <Card><CardContent><DataTable columns={columns} data={users} /></CardContent></Card>
  );
}
