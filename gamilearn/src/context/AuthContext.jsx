import { useState, useEffect } from "react";
import { authAPI, userAPI } from "../api/api";
import { AuthContext } from "./AuthContextStore";

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
    let cancelled = false;
    userAPI
      .getProfile()
      .then((response) => {
        if (cancelled) return;
        const newUser = response.data?.user;
        if (newUser) {
          localStorage.setItem("user", JSON.stringify(newUser));
          setUser(newUser);
        }
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
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
