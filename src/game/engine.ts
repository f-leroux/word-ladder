import { getLocaleStrings, type Locale } from "../i18n";
import { getLocaleContent } from "./content";
import { normalizeWordForLocale } from "./normalize";

export interface Puzzle {
  start: string;
  end: string;
  optimalLength: number;
  optimalPaths: string[][];
}

export type ActiveSide = "start" | "end";

export interface GameState {
  locale: Locale;
  puzzle: Puzzle;
  puzzleNumber: number;
  forwardChain: string[]; // starts with puzzle.start
  backwardChain: string[]; // starts with puzzle.end
  moveHistory: ActiveSide[];
  activeSide: ActiveSide;
  isComplete: boolean;
  isGivenUp: boolean;
}

export function isValidWord(locale: Locale, word: string): boolean {
  return getLocaleContent(locale).wordSet.has(normalizeWordForLocale(locale, word));
}

export function differsByOneLetter(a: string, b: string): boolean {
  const lettersA = Array.from(a);
  const lettersB = Array.from(b);
  if (lettersA.length !== lettersB.length) return false;
  let diffs = 0;
  for (let i = 0; i < lettersA.length; i++) {
    if (lettersA[i] !== lettersB[i]) diffs++;
    if (diffs > 1) return false;
  }
  return diffs === 1;
}

export function validateMove(
  locale: Locale,
  fromWord: string,
  usedWords: string[],
  newWord: string,
  bridgeWord?: string
): { valid: boolean; error?: string } {
  const normalizedFromWord = normalizeWordForLocale(locale, fromWord);
  const word = normalizeWordForLocale(locale, newWord);
  const normalizedBridgeWord = bridgeWord
    ? normalizeWordForLocale(locale, bridgeWord)
    : undefined;
  const strings = getLocaleStrings(locale);
  if (Array.from(word).length !== 5) {
    return { valid: false, error: strings.validation.wordLength };
  }
  if (!isValidWord(locale, word)) {
    return { valid: false, error: strings.validation.invalidWord };
  }
  if (!differsByOneLetter(normalizedFromWord, word)) {
    return { valid: false, error: strings.validation.oneLetter };
  }
  if (usedWords.includes(word) && word !== normalizedBridgeWord) {
    return { valid: false, error: strings.validation.used };
  }
  return { valid: true };
}

function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Get today's puzzle based on date
export function getDailyPuzzle(locale: Locale): { puzzle: Puzzle; puzzleNumber: number } {
  const puzzleData = getLocaleContent(locale).puzzles;
  // Epoch: March 10, 2026
  const epoch = new Date(2026, 2, 10); // months are 0-indexed
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  epoch.setHours(0, 0, 0, 0);

  const daysSinceEpoch = Math.floor(
    (today.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24)
  );
  const puzzleIndex =
    ((daysSinceEpoch % puzzleData.puzzles.length) +
      puzzleData.puzzles.length) %
    puzzleData.puzzles.length;

  const p = puzzleData.puzzles[puzzleIndex];
  return {
    puzzle: {
      start: p.s,
      end: p.e,
      optimalLength: p.d,
      optimalPaths: p.p,
    },
    puzzleNumber: daysSinceEpoch + 1,
  };
}

export function createGameState(locale: Locale): GameState {
  const { puzzle, puzzleNumber } = getDailyPuzzle(locale);
  return {
    locale,
    puzzle,
    puzzleNumber,
    forwardChain: [puzzle.start],
    backwardChain: [puzzle.end],
    moveHistory: [],
    activeSide: "start",
    isComplete: false,
    isGivenUp: false,
  };
}

// Save/load from localStorage
const STORAGE_KEY = "word-ladder-state";

function getStorageKey(locale: Locale): string {
  return `${STORAGE_KEY}-${locale}`;
}

export function saveGame(state: GameState): void {
  const today = getLocalDateKey();
  localStorage.setItem(
    getStorageKey(state.locale),
    JSON.stringify({ date: today, state })
  );
}

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GameState>;
  return Array.isArray(candidate.forwardChain) && Array.isArray(candidate.backwardChain);
}

function migrateState(rawState: unknown, locale: Locale): GameState | null {
  if (isGameState(rawState)) {
    if (rawState.locale && rawState.locale !== locale) {
      return null;
    }

    return {
      ...rawState,
      locale,
    };
  }

  if (!rawState || typeof rawState !== "object") {
    return null;
  }

  const legacyState = rawState as {
    puzzle?: Puzzle;
    puzzleNumber?: number;
    chain?: string[];
    isComplete?: boolean;
    isGivenUp?: boolean;
  };

  if (
    !legacyState.puzzle ||
    typeof legacyState.puzzleNumber !== "number" ||
    !Array.isArray(legacyState.chain)
  ) {
    return null;
  }

  return {
    locale,
    puzzle: legacyState.puzzle,
    puzzleNumber: legacyState.puzzleNumber,
    forwardChain: legacyState.chain,
    backwardChain: [legacyState.puzzle.end],
    moveHistory: Array.from({ length: Math.max(legacyState.chain.length - 1, 0) }, () => "start"),
    activeSide: "start",
    isComplete: Boolean(legacyState.isComplete),
    isGivenUp: Boolean(legacyState.isGivenUp),
  };
}

export function loadGame(locale: Locale): GameState | null {
  const todaysPuzzle = getDailyPuzzle(locale);
  const storageKeys = [getStorageKey(locale)];
  if (locale === "en") {
    storageKeys.push(STORAGE_KEY);
  }

  for (const storageKey of storageKeys) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) continue;
      const { date, state } = JSON.parse(raw);
      const today = getLocalDateKey();
      if (date !== today) continue;
      const migratedState = migrateState(state, locale);
      if (!migratedState) continue;
      if (
        migratedState.puzzleNumber !== todaysPuzzle.puzzleNumber ||
        migratedState.puzzle.start !== todaysPuzzle.puzzle.start ||
        migratedState.puzzle.end !== todaysPuzzle.puzzle.end
      ) {
        continue;
      }
      if (storageKey === STORAGE_KEY) {
        saveGame(migratedState);
        localStorage.removeItem(STORAGE_KEY);
      }
      return migratedState;
    } catch {
      continue;
    }
  }

  return null;
}

export function getFrontierWord(
  state: GameState,
  side: ActiveSide = state.activeSide
): string {
  return side === "start"
    ? state.forwardChain[state.forwardChain.length - 1]
    : state.backwardChain[state.backwardChain.length - 1];
}

export function isChainsConnected(state: GameState): boolean {
  const forwardFrontier = getFrontierWord(state, "start");
  const backwardFrontier = getFrontierWord(state, "end");
  return (
    forwardFrontier === backwardFrontier ||
    differsByOneLetter(forwardFrontier, backwardFrontier)
  );
}

export function getMergedChain(state: GameState): string[] {
  const backwardDisplay = [...state.backwardChain].reverse();
  const forwardFrontier = getFrontierWord(state, "start");
  const backwardFrontier = getFrontierWord(state, "end");

  if (forwardFrontier === backwardFrontier) {
    return [...state.forwardChain, ...backwardDisplay.slice(1)];
  }

  return [...state.forwardChain, ...backwardDisplay];
}

export function generateShareText(state: GameState): string {
  const strings = getLocaleStrings(state.locale);
  const { puzzle, puzzleNumber } = state;
  const chain = getMergedChain(state);
  const steps = chain.length - 1; // exclude start word

  let text = `🪜 ${strings.share.gameName} #${puzzleNumber}\n`;
  text += `${puzzle.start.toLocaleUpperCase(state.locale)} → ${puzzle.end.toLocaleUpperCase(
    state.locale
  )}\n`;
  text += `${strings.share.summary(steps)}\n\n`;
  text += `${strings.share.url}`;
  return text;
}
