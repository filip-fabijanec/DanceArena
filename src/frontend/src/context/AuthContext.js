import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // --- LOGIN GOOGLE ---
  const loginWithGoogle = async (googleCredential) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/google-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: googleCredential }),
        }
      );

      if (!response.ok) {
        throw new Error("NOT_FOUND");
      }

      const data = await response.json();

      setCurrentUser(data.user);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      return data.user;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  // --- LOGIN TAJNOM RIJEČI ---
  const loginWithSecret = async (secret) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/secret-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Neispravna tajna riječ");
      }

      const data = await response.json();

      setCurrentUser(data.user);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      return data.user;
    } catch (err) {
      console.error("Secret login error:", err);
      throw err;
    }
  };

  // --- LOGOUT ---
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loginWithGoogle,
        loginWithSecret,
        logout,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth mora biti korišten unutar AuthProvider");
  return ctx;
};
