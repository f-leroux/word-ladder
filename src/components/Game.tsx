import { useState, useEffect, useCallback, useRef } from "react";
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

function getSharedLetterIndices(a: string, b: string): Set<number> {
  const left = Array.from(a);
  const right = Array.from(b);
  const indices = new Set<number>();

  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    if (left[i] === right[i]) {
      indices.add(i);
    }
  }

  return indices;
}

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
  const initialStateRef = useRef<GameState | null>(null);
  const shiftUndoPendingRef = useRef(false);
  if (initialStateRef.current === null) {
    initialStateRef.current = loadGame(locale) || createGameState(locale);
  }

  const [state, setState] = useState<GameState>(() => initialStateRef.current!);
  const [startDraftWord, setStartDraftWord] = useState(() =>
    getFrontierWord(initialStateRef.current!, "start")
  );
  const [endDraftWord, setEndDraftWord] = useState(() =>
    getFrontierWord(initialStateRef.current!, "end")
  );
  const { alphabet } = getLocaleContent(locale);

  useEffect(() => {
    const nextState = loadGame(locale) || createGameState(locale);
    setState(nextState);
    setStartDraftWord(getFrontierWord(nextState, "start"));
    setEndDraftWord(getFrontierWord(nextState, "end"));
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

        const nextState = {
          ...prev,
          forwardChain: prev.forwardChain.slice(0, -1),
          moveHistory: nextHistory,
        };

        return {
          ...nextState,
          isComplete: isChainsConnected(nextState),
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

      const nextState = {
        ...prev,
        backwardChain: prev.backwardChain.slice(0, -1),
        moveHistory: nextHistory,
      };

      return {
        ...nextState,
        isComplete: isChainsConnected(nextState),
      };
    });
  }, []);

  useEffect(() => {
    if (state.isComplete) return;

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        shiftUndoPendingRef.current = false;
        event.preventDefault();
        setState((prev) => ({
          ...prev,
          activeSide: prev.activeSide === "start" ? "end" : "start",
        }));
        return;
      }

      if (event.key === "Shift" && !event.altKey && !event.ctrlKey && !event.metaKey) {
        shiftUndoPendingRef.current = true;
        return;
      }

      shiftUndoPendingRef.current = false;
    };

    const handleGlobalKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "Shift") {
        return;
      }

      const shouldUndo = shiftUndoPendingRef.current;
      shiftUndoPendingRef.current = false;
      if (!shouldUndo) return;

      const canUndo =
        state.activeSide === "start"
          ? state.forwardChain.length > 1
          : state.backwardChain.length > 1;
      if (!canUndo) return;

      event.preventDefault();
      handleUndo();
    };

    const resetPendingUndo = () => {
      shiftUndoPendingRef.current = false;
    };

    document.addEventListener("keydown", handleGlobalKeyDown, true);
    document.addEventListener("keyup", handleGlobalKeyUp, true);
    window.addEventListener("blur", resetPendingUndo);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown, true);
      document.removeEventListener("keyup", handleGlobalKeyUp, true);
      window.removeEventListener("blur", resetPendingUndo);
    };
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
  const currentTopWord = state.activeSide === "start" ? startDraftWord : startInputWord;
  const currentBottomWord =
    state.activeSide === "end" ? endDraftWord : (backwardRows[0] ?? endInputWord);
  const sharedFrontierIndices = getSharedLetterIndices(currentTopWord, currentBottomWord);

  const switchButtonLabel =
    state.activeSide === "start" ? strings.buildFromEnd : strings.buildFromStart;
  const canUndoActiveSide =
    state.activeSide === "start"
      ? state.forwardChain.length > 1
      : state.backwardChain.length > 1;

  return (
    <div className={`game${!state.isComplete ? " game--editing" : ""}`}>
      <div className="game-info">
        <span className="puzzle-number">#{state.puzzleNumber}</span>
        {!state.isComplete && (
          <div className="game-info-center">
            <button
              className="give-up-btn give-up-btn-mobile"
              onClick={handleGiveUp}
              tabIndex={-1}
              type="button"
            >
              {strings.giveUp}
            </button>
          </div>
        )}
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
                  matchedIndices={
                    state.activeSide === "end" && i === forwardRows.length - 1
                      ? sharedFrontierIndices
                      : undefined
                  }
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
                onDraftChange={setStartDraftWord}
                matchedIndices={sharedFrontierIndices}
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
                submitShortLabel={strings.submitShort}
                undoLabel={strings.undoWord}
                undoShortLabel={strings.undoShort}
                onSwitchSide={handleSwitchSide}
                switchSideLabel={switchButtonLabel}
                changeOneLetterMessage={strings.changeOneLetterToContinue}
                invalidWordMessage={strings.invalidWord}
                letterAriaLabel={strings.letterAriaLabel}
                moveLeftLabel={strings.moveLeft}
                moveRightLabel={strings.moveRight}
                backspaceLabel={strings.backspaceLabel}
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
                onDraftChange={setEndDraftWord}
                matchedIndices={sharedFrontierIndices}
                canUndo={canUndoActiveSide}
                locale={state.locale}
                alphabet={alphabet}
                previousWord={endInputWord}
                referenceWord={endInputWord}
                referencePlacement="below"
                referenceIsEnd={state.backwardChain.length === 1}
                referenceIsTarget={state.backwardChain.length === 1}
                submitLabel={strings.submitWord}
                submitShortLabel={strings.submitShort}
                undoLabel={strings.undoWord}
                undoShortLabel={strings.undoShort}
                onSwitchSide={handleSwitchSide}
                switchSideLabel={switchButtonLabel}
                changeOneLetterMessage={strings.changeOneLetterToContinue}
                invalidWordMessage={strings.invalidWord}
                letterAriaLabel={strings.letterAriaLabel}
                moveLeftLabel={strings.moveLeft}
                moveRightLabel={strings.moveRight}
                backspaceLabel={strings.backspaceLabel}
                startLabel={strings.startLabel}
                endLabel={strings.endLabel}
              />
            )}

            {backwardRows.map((word, i) => (
              <div key={`backward-${word}-${i}`} className="ladder-line">
                <WordRow
                  locale={state.locale}
                  word={word}
                  matchedIndices={
                    state.activeSide === "start" && i === 0
                      ? sharedFrontierIndices
                      : undefined
                  }
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
