import { useState } from "react";
import { Game } from "./components/Game";
import "./App.css";

function App() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Word Ladder</h1>
        <button className="help-btn" onClick={() => setShowHelp(!showHelp)}>
          ?
        </button>
      </header>

      {showHelp && (
        <div className="help-modal" onClick={() => setShowHelp(false)}>
          <div className="help-content" onClick={(e) => e.stopPropagation()}>
            <h2>How to Play</h2>
            <p>
              Get from the <strong>start word</strong> to the{" "}
              <strong>end word</strong> by changing{" "}
              <strong>one letter at a time</strong>.
            </p>
            <ul>
              <li>Each step must be a valid English word</li>
              <li>You can only change one letter per step</li>
              <li>Try to do it in as few steps as possible!</li>
            </ul>
            <p>A new puzzle is available every day.</p>
            <button
              className="close-help-btn"
              onClick={() => setShowHelp(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      <Game />
    </div>
  );
}

export default App;
