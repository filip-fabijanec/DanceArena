import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. KREIRANJE KONTEKSTA (Ovo mora postojati)
const AuthContext = createContext();

// 2. EXPORT HOOKA (Ovo je ono na što se build žali da fali!)
export function useAuth() {
  return useContext(AuthContext);
}

// 3. PROVIDER
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Funkcija za dohvat korisnika (tvoja logika)
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/me`, 
        {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        }
      );

      if (!response.ok) throw new Error("Failed");

      const updatedUser = await response.json();
      setCurrentUser(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      return updatedUser;

    } catch (error) {
      console.error("Greška pri osvježavanju:", error);
      return null;
    }
  };

  // UseEffect pri startu
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem("currentUser");
      const token = localStorage.getItem("token");

      if (savedUser && token) {
        setCurrentUser(JSON.parse(savedUser)); // Odmah prikaži staro stanje
        await refreshUser(); // U pozadini provjeri bazu
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // --- LOGIN FUNKCIJE (Moraš ih imati definirane da bi ih poslao u value) ---

  const loginWithGoogle = async (googleCredential) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/users/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: googleCredential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      setCurrentUser(data.user);
      return data.user;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const loginWithSecret = async (secret) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/users/secret-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      setCurrentUser(data.user);
      return data.user;
    } catch (error) {
      console.error("Secret login error:", error);
      throw error;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
  };

  // --- KRAJ LOGIN FUNKCIJA ---

  return (
    <AuthContext.Provider value={{ currentUser, loginWithGoogle, loginWithSecret, logout, loading, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};