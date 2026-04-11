import axios from "axios";

const nodeApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NODE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

nodeApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export { nodeApi };
