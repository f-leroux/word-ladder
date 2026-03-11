import { type GameState, generateShareText, getMergedChain } from "../game/engine";
import { type LocaleStrings } from "../i18n";
import { WordRow } from "./WordRow";
import { useState } from "react";

interface GameOverProps {
  state: GameState;
  strings: LocaleStrings;
}

export function GameOver({ state, strings }: GameOverProps) {
  const [copied, setCopied] = useState(false);
  const [showOptimal, setShowOptimal] = useState(false);

  const chain = getMergedChain(state);
  const steps = chain.length - 1;
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
          <h2>{strings.maybeTomorrow}</h2>
        ) : isPerfect ? (
          <h2>{strings.perfect}</h2>
        ) : (
          <h2>{strings.niceWork}</h2>
        )}
        <p className="stats-line">
          {state.isGivenUp ? (
            strings.gaveUpStat
          ) : (
            strings.solvedStat(steps, optimal)
          )}
        </p>
      </div>

      {!state.isGivenUp && (
        <button className="share-btn" onClick={handleShare}>
          {copied ? strings.copied : strings.shareResult}
        </button>
      )}

      <div className="optimal-section">
        <button
          className="toggle-optimal-btn"
          onClick={() => setShowOptimal(!showOptimal)}
        >
          {strings.optimalToggle(showOptimal, state.puzzle.optimalPaths.length)}
        </button>

        {showOptimal && (
          <div className="optimal-paths">
            {state.puzzle.optimalPaths.map((path, pathIdx) => (
              <div key={pathIdx} className="optimal-path">
                {state.puzzle.optimalPaths.length > 1 && (
                  <div className="path-label">{strings.pathLabel(pathIdx + 1)}</div>
                )}
                {path.map((word, i) => (
                  <WordRow
                    key={i}
                    locale={state.locale}
                    word={word}
                    previousWord={i > 0 ? path[i - 1] : undefined}
                    isStart={i === 0}
                    isEnd={i === path.length - 1}
                    startLabel={strings.startLabel}
                    endLabel={strings.endLabel}
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
