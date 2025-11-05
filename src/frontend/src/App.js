import './App.css';
import { useEffect, useState } from "react";
import MyButton from './button';
import CreateUser from './CreateUser';

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

  // Funkcija za refresh liste korisnika
  const refreshUsers = () => {
    fetch("http://localhost:3500/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Fetch error:", err));
  };

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
        
        {/* Nova komponenta za kreiranje korisnika */}
        <CreateUser onUserCreated={refreshUsers} />
        
        <p>Backend connection test:</p>
        <button onClick={refreshUsers} className="refresh-button">
          Osvježi listu korisnika
        </button>
        <ul>
          {users.length > 0 ? (
            users.map((u) => (
              <li key={u._id}>
                {u.name} {u.surname} — {u.role} — {u.email}
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