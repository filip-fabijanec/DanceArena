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

  // --- 🆕 NOVO: FUNKCIJA ZA OSVJEŽAVANJE KORISNIKA IZ BAZE ---
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Pazi: Ovdje pretpostavljam da ti je ruta za dohvat profila '/users/me'
      // Ako se zove drugačije (npr. '/auth/me'), promijeni ovaj URL.
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/me`, 
        {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // Šaljemo token da backend zna tko pita
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to refresh user");
      }

      const updatedUser = await response.json();

      // Ažuriramo stanje aplikacije
      setCurrentUser(updatedUser);
      // Ažuriramo localStorage da i kod idućeg refresha bude točan
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      
      console.log("Korisnik osvježen:", updatedUser);
      return updatedUser;

    } catch (error) {
      console.error("Greška pri osvježavanju korisnika:", error);
    }
  };

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
        refreshUser, // <--- OVO JE DODANO
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