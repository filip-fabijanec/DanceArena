export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Definiramo funkciju OVDJE (prije useEffecta)
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null; // Ako nema tokena, vrati null

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

  // 2. UseEffect koji se vrti pri startu aplikacije
  useEffect(() => {
    const initAuth = async () => {
      // Prvo učitaj iz localStorage da korisnik ne čeka (brzi prikaz)
      const savedUser = localStorage.getItem("currentUser");
      const token = localStorage.getItem("token");

      if (savedUser && token) {
        setCurrentUser(JSON.parse(savedUser)); // Pokaži staro stanje odmah
        
        // ALI ODMAH U POZADINI PROVJERI BAZU! 🚀
        await refreshUser(); 
      }
      
      setLoading(false);
    };

    initAuth();
  }, []); // Prazan array = vrti se samo jednom na refresh

  // ... (loginWithGoogle, loginWithSecret, logout ostaju isti) ...
  
  // Zbog preglednosti ih ne kopiram opet, ostavi ih kako jesu
  const loginWithGoogle = async (googleCredential) => { /* tvoj stari kod */ };
  const loginWithSecret = async (secret) => { /* tvoj stari kod */ };
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ currentUser, loginWithGoogle, loginWithSecret, logout, loading, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};