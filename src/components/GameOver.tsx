import { type GameState, generateShareText } from "../game/engine";
import { WordRow } from "./WordRow";
import { useState } from "react";

interface GameOverProps {
  state: GameState;
}

export function GameOver({ state }: GameOverProps) {
  const [copied, setCopied] = useState(false);
  const [showOptimal, setShowOptimal] = useState(false);

  const steps = state.chain.length - 1;
  const optimal = state.puzzle.optimalLength;
  const isPerfect = steps === optimal;

  const handleShare = async () => {
    const text = generateShareText(state);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="game-over">
      <div className="game-over-header">
        {state.isGivenUp ? (
          <h2>Maybe Tomorrow!</h2>
        ) : isPerfect ? (
          <h2>Perfect! ⭐</h2>
        ) : (
          <h2>Nice Work!</h2>
        )}
        <p className="stats-line">
          {state.isGivenUp ? (
            "You gave up on this one"
          ) : (
            <>
              You solved it in <strong>{steps} steps</strong>
              {" "}(optimal: {optimal})
            </>
          )}
        </p>
      </div>

      {!state.isGivenUp && (
        <button className="share-btn" onClick={handleShare}>
          {copied ? "Copied!" : "Share Result 📋"}
        </button>
      )}

      <div className="optimal-section">
        <button
          className="toggle-optimal-btn"
          onClick={() => setShowOptimal(!showOptimal)}
        >
          {showOptimal ? "Hide" : "Show"} Optimal Path
          {state.puzzle.optimalPaths.length > 1 ? "s" : ""}
        </button>

        {showOptimal && (
          <div className="optimal-paths">
            {state.puzzle.optimalPaths.map((path, pathIdx) => (
              <div key={pathIdx} className="optimal-path">
                {state.puzzle.optimalPaths.length > 1 && (
                  <div className="path-label">Path {pathIdx + 1}</div>
                )}
                {path.map((word, i) => (
                  <WordRow
                    key={i}
                    word={word}
                    previousWord={i > 0 ? path[i - 1] : undefined}
                    isStart={i === 0}
                    isEnd={i === path.length - 1}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
