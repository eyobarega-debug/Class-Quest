import axios from "axios";
const client = axios.create({
  baseURL: "http://localhost:5000/api",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("classquest_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const api = {
  me: async () => {
    const res = await client.get("/auth/me");
    return res.data;
  },
  login: async (username, password) => {
    const res = await client.post("/auth/login", { username, password });
    return res.data;
  },
};

export default client;