
import './App.css';
import { useEffect, useState } from "react";
import MyButton from './button';

function App() {

  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3500/users")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Users from backend:", data);
        setUsers(data);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const [isToggled, setIsToggled] = useState(false);

  const toggleBackground = () => {
    setIsToggled(prev => !prev);
  };

  // dodajemo klase na App-header i button ovisno o state-u
  const headerClass = isToggled ? 'App-header toggled' : 'App-header';
  const buttonClass = isToggled ? 'my-button toggled' : 'my-button';

  return (
    <div className="App">
      <header className={headerClass}>
        <p className="naslov">DANCE ARENA</p>
        <a
          className="App-link"
          href="https://github.com/filip-fabijanec/DanceArena"
          target="_blank"
          rel="noopener noreferrer"
        >
          Link za Github
        </a>
        <p>Backend connection test:</p>
      <ul>
        {users.length > 0 ? (
          users.map((u) => (
            <li key={u._id}>
              {u.username || u.name || "Nepoznati korisnik"} — {u.role || ""}
            </li>
          ))
        ) : (
          <li>Nema korisnika (ili baza prazna)</li>
        )}
      </ul>
        <p></p>
        <MyButton buttonClass={buttonClass} onClick={toggleBackground} />
      </header>
    </div>
  );
}

export default App;
