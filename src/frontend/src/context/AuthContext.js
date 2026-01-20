import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null); // ← DODANO
  const [loading, setLoading] = useState(true);

  // --- KLJUČNA FUNKCIJA: OSVJEŽI KORISNIKA S BACKENDA ---
  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) return null;

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/me`, 
        {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${storedToken}`
          },
        }
      );

      if (!response.ok) {
        // Ako je token nevažeći, očisti sve
        if (response.status === 401) {
          logout();
        }
        throw new Error("Failed to fetch user");
      }

      const updatedUser = await response.json();
      
      // Ažuriraj stanje i localStorage
      setCurrentUser(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      
      console.log("🔄 AuthContext: Korisnik osvježen. Status:", updatedUser.subscriptionStatus);
      return updatedUser;

    } catch (error) {
      console.error("Greška pri osvježavanju:", error);
      return null;
    }
  };

  // UseEffect pri startu aplikacije
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem("currentUser");
      const storedToken = localStorage.getItem("token");

      if (savedUser && storedToken) {
        setToken(storedToken); // ← DODANO
        setCurrentUser(JSON.parse(savedUser)); 
        await refreshUser(); 
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // --- LOGIN FUNKCIJE ---

  const loginWithGoogle = async (googleCredential) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/users/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: googleCredential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      
      setToken(data.token); // ← DODANO
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
      
      setToken(data.token); // ← DODANO
      setCurrentUser(data.user);
      
      return data.user;
    } catch (error) {
      console.error("Secret login error:", error);
      throw error;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null); // ← DODANO
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      token, // ← DODANO u value
      loginWithGoogle, 
      loginWithSecret, 
      logout, 
      loading, 
      refreshUser 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};