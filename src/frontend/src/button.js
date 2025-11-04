import './App.css';

function MyButton({ buttonClass, onClick }) {
  return (
    <button className={buttonClass} onClick={onClick}>
      Click me!
    </button>
  );
}

export default MyButton;
