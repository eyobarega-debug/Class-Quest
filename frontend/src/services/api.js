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

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export const api = {
  // --- auth ---
  me: async () => {
    const res = await client.get("/auth/me");
    return res.data;
  },
  login: async (username, password) => {
    const res = await client.post("/auth/login", { username, password });
    return res.data;
  },

  // --- students (admin) ---
  students: async () => {
    const res = await client.get("/users");
    return res.data.students;
  },
  createStudent: async ({ username, email, password, fullName }) => {
    const res = await client.post("/users", { username, email, password, fullName });
    return res.data;
  },
  updateStudentStatus: async (id, isActive) => {
    const res = await client.put(`/users/${id}/status`, { isActive });
    return res.data;
  },

  // --- challenges ---
  challenges: async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.language) params.language = filters.language;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.category) params.category = filters.category;

    const res = await client.get("/challenges", { params });
    return res.data.challenges;
  },
  challenge: async (slug) => {
    const res = await client.get(`/challenges/${slug}`);
    return res.data.challenge;
  },
  createChallenge: async (payload) => {
    const res = await client.post("/challenges", payload);
    return res.data.challenge;
  },
  updateChallenge: async (id, payload) => {
    const res = await client.patch(`/challenges/${id}`, payload);
    return res.data.challenge;
  },
  deleteChallenge: async (id) => {
    await client.delete(`/challenges/${id}`);
  },

  // --- code run/submit ---
  runCode: async ({ slug, language, source_code }) => {
    const res = await client.post(`/challenges/${slug}/run`, {
      language,
      sourceCode: source_code,
    });
    return res.data;
  },
  submitCode: async ({ slug, language, source_code }) => {
    const res = await client.post(`/challenges/${slug}/submit`, {
      language,
      sourceCode: source_code,
    });
    return res.data;
  },
};

export default client;