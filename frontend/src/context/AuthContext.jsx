import { createContext, useContext, useEffect, useState } from "react";
import api,{errorMessage} from "../api/client";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  const login = async (values) => {
    const { data } = await api.post("/auth/login", values);
    setUser(data.user);
    return data.user;
  };
  const signup = async (values) =>
    (await api.post("/auth/signup", values)).data;
  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
