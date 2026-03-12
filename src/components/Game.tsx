import { useState, useEffect, useCallback } from "react";
import {
  type ActiveSide,
  type GameState,
  createGameState,
  getFrontierWord,
  getMergedChain,
  isChainsConnected,
  loadGame,
  saveGame,
  validateMove,
} from "../game/engine";
import { getLocaleContent } from "../game/content";
import { type Locale, type LocaleStrings } from "../i18n";
import { WordRow } from "./WordRow";
import { WordInput } from "./WordInput";
import { GameOver } from "./GameOver";

function PlaceholderRow() {
  return (
    <div className="word-row word-row-placeholder" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="letter-cell" />
      ))}
    </div>
  );
}

interface GameProps {
  locale: Locale;
  strings: LocaleStrings;
}

export function Game({ locale, strings }: GameProps) {
  const [state, setState] = useState<GameState>(() => {
    return loadGame(locale) || createGameState(locale);
  });
  const { alphabet } = getLocaleContent(locale);

  useEffect(() => {
    setState(loadGame(locale) || createGameState(locale));
  }, [locale]);

  useEffect(() => {
    saveGame(state);
  }, [state]);

  const handleSubmit = useCallback(
    (word: string): { valid: boolean; error?: string } => {
      const bridgeSide: ActiveSide = state.activeSide === "start" ? "end" : "start";
      const result = validateMove(
        state.locale,
        getFrontierWord(state),
        [...state.forwardChain, ...state.backwardChain],
        word,
        getFrontierWord(state, bridgeSide)
      );
      if (!result.valid) return result;

      setState((prev) => {
        const nextWord = word.toLowerCase();
        const nextState =
          prev.activeSide === "start"
            ? {
                ...prev,
                forwardChain: [...prev.forwardChain, nextWord],
                moveHistory: [...prev.moveHistory, "start" as const],
              }
            : {
                ...prev,
                backwardChain: [...prev.backwardChain, nextWord],
                moveHistory: [...prev.moveHistory, "end" as const],
              };

        return {
          ...nextState,
          isComplete: isChainsConnected(nextState),
        };
      });
      return { valid: true };
    },
    [state]
  );

  const handleGiveUp = useCallback(() => {
    setState((prev) => ({ ...prev, isComplete: true, isGivenUp: true }));
  }, []);

  const handleSwitchSide = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeSide: prev.activeSide === "start" ? "end" : "start",
    }));
  }, []);

  const handleUndo = useCallback(() => {
    setState((prev) => {
      if (prev.activeSide === "start") {
        if (prev.forwardChain.length <= 1) {
          return prev;
        }

        const nextHistory = [...prev.moveHistory];
        const undoIndex = nextHistory.lastIndexOf("start");
        if (undoIndex !== -1) {
          nextHistory.splice(undoIndex, 1);
        }

        return {
          ...prev,
          forwardChain: prev.forwardChain.slice(0, -1),
          moveHistory: nextHistory,
          isComplete: false,
        };
      }

      if (prev.backwardChain.length <= 1) {
        return prev;
      }

      const nextHistory = [...prev.moveHistory];
      const undoIndex = nextHistory.lastIndexOf("end");
      if (undoIndex !== -1) {
        nextHistory.splice(undoIndex, 1);
      }

      return {
        ...prev,
        backwardChain: prev.backwardChain.slice(0, -1),
        moveHistory: nextHistory,
        isComplete: false,
      };
    });
  }, []);

  useEffect(() => {
    if (state.isComplete) return;

    const handleGlobalKey = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        setState((prev) => ({
          ...prev,
          activeSide: prev.activeSide === "start" ? "end" : "start",
        }));
        return;
      }

      if (event.key !== "Escape") return;

      const canUndo =
        state.activeSide === "start"
          ? state.forwardChain.length > 1
          : state.backwardChain.length > 1;
      if (!canUndo) return;

      event.preventDefault();
      handleUndo();
    };

    window.addEventListener("keydown", handleGlobalKey, true);
    return () => window.removeEventListener("keydown", handleGlobalKey, true);
  }, [
    handleUndo,
    state.activeSide,
    state.backwardChain.length,
    state.forwardChain.length,
    state.isComplete,
  ]);

  const isSolved = state.isComplete && !state.isGivenUp;
  const mergedChain = getMergedChain(state);
  const steps = isSolved ? mergedChain.length - 1 : state.moveHistory.length;
  const backwardDisplay = [...state.backwardChain].reverse();
  const forwardRows =
    state.activeSide === "start" ? state.forwardChain.slice(0, -1) : state.forwardChain;
  const startInputWord = getFrontierWord(state, "start");
  const endInputWord = getFrontierWord(state, "end");
  const backwardRows =
    state.activeSide === "end" ? backwardDisplay.slice(1) : backwardDisplay;

  const switchButtonLabel =
    state.activeSide === "start" ? strings.buildFromEnd : strings.buildFromStart;
  const canUndoActiveSide =
    state.activeSide === "start"
      ? state.forwardChain.length > 1
      : state.backwardChain.length > 1;

  return (
    <div className="game">
      <div className="game-info">
        <span className="puzzle-number">#{state.puzzleNumber}</span>
        <span className="step-count">{strings.stepCount(steps)}</span>
      </div>

      <div className="chain-container">
        {isSolved ? (
          mergedChain.map((word, i, chain) => (
            <WordRow
              key={`${word}-${i}`}
              locale={state.locale}
              word={word}
              previousWord={i > 0 ? chain[i - 1] : undefined}
              isStart={i === 0}
              isEnd={i === chain.length - 1}
              startLabel={strings.startLabel}
              endLabel={strings.endLabel}
            />
          ))
        ) : (
          <>
            {forwardRows.map((word, i) => (
              <div key={`forward-${word}-${i}`} className="ladder-line">
                <WordRow
                  locale={state.locale}
                  word={word}
                  previousWord={i > 0 ? forwardRows[i - 1] : undefined}
                  isStart={i === 0}
                  startLabel={strings.startLabel}
                  endLabel={strings.endLabel}
                />
                {state.activeSide === "end" && i === forwardRows.length - 1 && (
                  <div className="ladder-line-action">
                    <button
                      className="switch-side-btn"
                      onClick={handleSwitchSide}
                      tabIndex={-1}
                      type="button"
                    >
                      <span className="button-label">{switchButtonLabel}</span>
                      <span className="button-key">(Tab)</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {state.activeSide === "start" && (
              <WordInput
                onSubmit={handleSubmit}
                onUndo={handleUndo}
                canUndo={canUndoActiveSide}
                locale={state.locale}
                alphabet={alphabet}
                previousWord={startInputWord}
                referenceWord={startInputWord}
                referencePreviousWord={
                  state.forwardChain.length > 1
                    ? state.forwardChain[state.forwardChain.length - 2]
                    : undefined
                }
                referencePlacement="above"
                referenceIsStart={state.forwardChain.length === 1}
                submitLabel={strings.submitWord}
                undoLabel={strings.undoWord}
                changeOneLetterMessage={strings.changeOneLetterToContinue}
                invalidWordMessage={strings.invalidWord}
                letterAriaLabel={strings.letterAriaLabel}
                startLabel={strings.startLabel}
                endLabel={strings.endLabel}
              />
            )}

            {state.activeSide === "end" && (
              <div className="chain-separator" aria-hidden="true">
                <span>⋮</span>
              </div>
            )}

            <PlaceholderRow />

            {state.activeSide === "start" && (
              <div className="chain-separator" aria-hidden="true">
                <span>⋮</span>
              </div>
            )}

            {state.activeSide === "end" && (
              <WordInput
                onSubmit={handleSubmit}
                onUndo={handleUndo}
                canUndo={canUndoActiveSide}
                locale={state.locale}
                alphabet={alphabet}
                previousWord={endInputWord}
                referenceWord={endInputWord}
                referencePlacement="below"
                referenceIsEnd={state.backwardChain.length === 1}
                referenceIsTarget={state.backwardChain.length === 1}
                submitLabel={strings.submitWord}
                undoLabel={strings.undoWord}
                changeOneLetterMessage={strings.changeOneLetterToContinue}
                invalidWordMessage={strings.invalidWord}
                letterAriaLabel={strings.letterAriaLabel}
                startLabel={strings.startLabel}
                endLabel={strings.endLabel}
              />
            )}

            {backwardRows.map((word, i) => (
              <div key={`backward-${word}-${i}`} className="ladder-line">
                <WordRow
                  locale={state.locale}
                  word={word}
                  previousWord={
                    state.activeSide === "end"
                      ? i === 0
                        ? endInputWord
                        : backwardRows[i - 1]
                      : i > 0
                        ? backwardRows[i - 1]
                        : undefined
                  }
                  isEnd={i === backwardRows.length - 1}
                  isTarget={i === backwardRows.length - 1}
                  startLabel={strings.startLabel}
                  endLabel={strings.endLabel}
                />
                {state.activeSide === "start" && i === 0 && (
                  <div className="ladder-line-action">
                    <button
                      className="switch-side-btn"
                      onClick={handleSwitchSide}
                      tabIndex={-1}
                      type="button"
                    >
                      <span className="button-label">{switchButtonLabel}</span>
                      <span className="button-key">(Tab)</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {!state.isComplete && (
        <div className="game-actions">
          <button className="give-up-btn" onClick={handleGiveUp} tabIndex={-1}>
            {strings.giveUp}
          </button>
        </div>
      )}

      {state.isComplete && <GameOver state={state} strings={strings} />}
    </div>
  );
}
