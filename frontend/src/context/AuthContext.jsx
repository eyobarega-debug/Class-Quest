import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    const token = localStorage.getItem("classquest_token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.me();
      setUser(data.user || data);
    } catch {
      localStorage.removeItem("classquest_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function login(username, password) {
    const data = await api.login(username, password);
    const token = data.token || data.accessToken;

    if (!token) {
      throw new Error("Login succeeded but no token was returned.");
    }

    localStorage.setItem("classquest_token", token);
    setUser(data.user);
    return data.user;
  }

  async function register({ username, email, password, fullName }) {
    const data = await api.register({ username, email, password, fullName });
    const token = data.token;

    if (!token) {
      throw new Error("Account created but no token was returned.");
    }

    localStorage.setItem("classquest_token", token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("classquest_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}