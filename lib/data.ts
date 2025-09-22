export type User = { id: number; name: string; email: string; role: string; status: "Active" | "Invited" | "Disabled" };
export const users: User[] = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin", status: "Active" },
  { id: 2, name: "Bob Martin", email: "bob@example.com", role: "Manager", status: "Invited" },
  { id: 3, name: "Carla Wright", email: "carla@example.com", role: "Viewer", status: "Active" },
  { id: 4, name: "David Lee", email: "david@example.com", role: "Editor", status: "Disabled" }
];
