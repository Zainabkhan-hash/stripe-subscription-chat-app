import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const API = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  const register = async (name, email, password) => {
    try {
      const { data } = await axios.post(`${API}/api/auth/register`, {
        name, email, password,
      });
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      return data;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API}/api/auth/login`, {
        email, password,
      });
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);