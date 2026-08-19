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

  // ==========================================
  // LOAD CURRENT USER
  // ==========================================

  async function loadUser() {
    const token = localStorage.getItem("classquest_token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.me();

      setUser(data.user || data);
    } catch (error) {
      console.error("Failed to load user:", error);

      localStorage.removeItem("classquest_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }


  // ==========================================
  // LOAD USER WHEN APP STARTS
  // ==========================================

  useEffect(() => {
    loadUser();
  }, []);


  // ==========================================
  // LOGIN
  // ==========================================

  async function login(username, password) {
    const data = await api.login(username, password);

    const token = data.token || data.accessToken;

    if (!token) {
      throw new Error(
        "Login succeeded but no token was returned."
      );
    }

    // IMPORTANT:
    // This is the key used everywhere in the app.
    localStorage.setItem("classquest_token", token);

    setUser(data.user);

    return data.user;
  }


  // ==========================================
  // REGISTER
  // ==========================================

  async function register({
    username,
    email,
    password,
    fullName,
  }) {
    const data = await api.register({
      username,
      email,
      password,
      fullName,
    });

    const token = data.token || data.accessToken;

    if (!token) {
      throw new Error(
        "Account created but no token was returned."
      );
    }

    localStorage.setItem(
      "classquest_token",
      token
    );

    setUser(data.user);

    return data.user;
  }


  // ==========================================
  // LOGOUT
  // ==========================================

  function logout() {
    localStorage.removeItem("classquest_token");
    setUser(null);
  }


  // ==========================================
  // AUTH CONTEXT
  // ==========================================

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


// ==========================================
// USE AUTH HOOK
// ==========================================

export function useAuth() {
  return useContext(AuthContext);
}