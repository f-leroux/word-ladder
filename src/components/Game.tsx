import { useState, useEffect, useCallback } from "react";
import {
  type GameState,
  createGameState,
  loadGame,
  saveGame,
  validateMove,
} from "../game/engine";
import { WordRow } from "./WordRow";
import { WordInput } from "./WordInput";
import { GameOver } from "./GameOver";

export function Game() {
  const [state, setState] = useState<GameState>(() => {
    return loadGame() || createGameState();
  });

  useEffect(() => {
    saveGame(state);
  }, [state]);

  const handleSubmit = useCallback(
    (word: string): { valid: boolean; error?: string } => {
      const result = validateMove(state.chain, word);
      if (!result.valid) return result;

      setState((prev) => {
        const newChain = [...prev.chain, word.toLowerCase()];
        const isComplete = word.toLowerCase() === prev.puzzle.end;
        const newState = { ...prev, chain: newChain, isComplete };
        return newState;
      });
      return { valid: true };
    },
    [state.chain]
  );

  const handleUndo = useCallback(() => {
    setState((prev) => {
      if (prev.chain.length <= 1) return prev;
      return { ...prev, chain: prev.chain.slice(0, -1) };
    });
  }, []);

  const handleGiveUp = useCallback(() => {
    setState((prev) => ({ ...prev, isComplete: true, isGivenUp: true }));
  }, []);

  const lastWord = state.chain[state.chain.length - 1];
  const steps = state.chain.length - 1;

  return (
    <div className="game">
      <div className="game-info">
        <span className="puzzle-number">#{state.puzzleNumber}</span>
        <span className="step-count">
          {steps} step{steps !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="chain-container">
        {/* Target end word (shown at top as goal) */}
        <WordRow word={state.puzzle.end} isEnd isTarget />

        <div className="chain-separator">
          <span>⋮</span>
        </div>

        {/* The chain so far */}
        {state.chain.map((word, i) => (
          <WordRow
            key={i}
            word={word}
            previousWord={i > 0 ? state.chain[i - 1] : undefined}
            isStart={i === 0}
          />
        ))}

        {/* Input for next word */}
        {!state.isComplete && (
          <WordInput
            onSubmit={handleSubmit}
            previousWord={lastWord}
          />
        )}
      </div>

      {!state.isComplete && (
        <div className="game-actions">
          {state.chain.length > 1 && (
            <button className="undo-btn" onClick={handleUndo}>
              Undo
            </button>
          )}
          <button className="give-up-btn" onClick={handleGiveUp}>
            Give Up
          </button>
        </div>
      )}

      {state.isComplete && <GameOver state={state} />}
    </div>
  );
}
