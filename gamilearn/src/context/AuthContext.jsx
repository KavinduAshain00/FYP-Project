/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { authAPI, userAPI, invalidateUserCaches } from "../api/api";

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-login: validate token and restore user when token is present
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    const ac = new AbortController();
    let cancelled = false;
    userAPI
      .getProfile({ signal: ac.signal })
      .then((response) => {
        if (cancelled) return;
        const newUser = response.data?.user;
        if (newUser) {
          localStorage.setItem("user", JSON.stringify(newUser));
          setUser(newUser);
        }
      })
      .catch((err) => {
        if (
          cancelled ||
          err.code === "ERR_CANCELED" ||
          err.name === "CanceledError"
        )
          return;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token, user } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);

    return user;
  };

  const signup = async (name, email, password, knowsJavaScript) => {
    const response = await authAPI.signup({
      name,
      email,
      password,
      knowsJavaScript,
    });
    const { token, user } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);

    return user;
  };

  const refreshProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const newUser = response.data.user;
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error("Error refreshing profile:", error);
      return null;
    }
  };

  const logout = () => {
    try {
      invalidateUserCaches();
    } catch {
      /* ignore */
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, signup, logout, refreshProfile, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
