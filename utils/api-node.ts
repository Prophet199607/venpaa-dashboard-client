import axios from "axios";

const nodeApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NODE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export { nodeApi };
