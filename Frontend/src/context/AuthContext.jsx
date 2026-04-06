import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();
const API = import.meta.env.VITE_API_URL?.trim();

const normalizeUser = (data) => {
  if (!data) return null;
  if (data.token && data.user) return { token: data.token, ...data.user };
  return data;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(normalizeUser(JSON.parse(storedUser)));
    setLoading(false);
  }, []);

  const register = async (name, email, password) => {
    try {
      const { data } = await axios.post(`${API}/api/auth/register`, { name, email, password });
      const normalized = normalizeUser(data);
      localStorage.setItem("user", JSON.stringify(normalized));
      setUser(normalized);
      return normalized;
    } catch (error) { throw error; }
  };

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API}/api/auth/login`, { email, password });
      const normalized = normalizeUser(data);
      localStorage.setItem("user", JSON.stringify(normalized));
      setUser(normalized);
      return normalized;
    } catch (error) { throw error; }
  };

  const updateUser = (updatedFields) => {
    const merged = { ...user, ...updatedFields };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);