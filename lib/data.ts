export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Invited" | "Disabled";
};
export const users: User[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "Admin",
    status: "Active",
  },
  {
    id: 2,
    name: "Bob Martin",
    email: "bob@example.com",
    role: "Manager",
    status: "Invited",
  },
  {
    id: 3,
    name: "Carla Wright",
    email: "carla@example.com",
    role: "Viewer",
    status: "Active",
  },
  {
    id: 4,
    name: "David Lee",
    email: "david@example.com",
    role: "Editor",
    status: "Disabled",
  },
];

export type Book = {
  code: number;
  image: string;
  author: string;
  bookTypes: string;
  action: "Active" | "Invited" | "Disabled";
};
export const books: Book[] = [
  {
    code: 1,
    image: "Alice Johnson",
    author: "alice@example.com",
    bookTypes: "Admin",
    action: "Active",
  },
  {
    code: 2,
    image: "Bob Martin",
    author: "bob@example.com",
    bookTypes: "Manager",
    action: "Invited",
  },
  {
    code: 3,
    image: "Carla Wright",
    author: "carla@example.com",
    bookTypes: "Viewer",
    action: "Active",
  },
  {
    code: 4,
    image: "David Lee",
    author: "david@example.com",
    bookTypes: "Editor",
    action: "Disabled",
  },
];
