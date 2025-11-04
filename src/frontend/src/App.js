import logo from './logo.svg';
import './App.css';

import MyButton from './button';
import { useState } from 'react';

function App() {
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
        <p></p>
        <MyButton buttonClass={buttonClass} onClick={toggleBackground} />
      </header>
    </div>
  );
}

export default App;
