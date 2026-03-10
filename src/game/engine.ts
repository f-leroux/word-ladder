import wordList from "../data/words.json";
import puzzleData from "../data/puzzles.json";

export interface Puzzle {
  start: string;
  end: string;
  optimalLength: number;
  optimalPaths: string[][];
}

export interface GameState {
  puzzle: Puzzle;
  puzzleNumber: number;
  chain: string[]; // starts with puzzle.start
  isComplete: boolean;
  isGivenUp: boolean;
}

const wordSet = new Set<string>(wordList);

export function isValidWord(word: string): boolean {
  return wordSet.has(word.toLowerCase());
}

export function differsByOneLetter(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diffs = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diffs++;
    if (diffs > 1) return false;
  }
  return diffs === 1;
}

export function validateMove(
  chain: string[],
  newWord: string
): { valid: boolean; error?: string } {
  const word = newWord.toLowerCase();
  if (word.length !== 5) {
    return { valid: false, error: "Word must be 5 letters" };
  }
  if (!isValidWord(word)) {
    return { valid: false, error: "Not a valid word" };
  }
  const lastWord = chain[chain.length - 1];
  if (!differsByOneLetter(lastWord, word)) {
    return { valid: false, error: "Must change exactly one letter" };
  }
  if (chain.includes(word)) {
    return { valid: false, error: "Word already used" };
  }
  return { valid: true };
}

// Get today's puzzle based on date
export function getDailyPuzzle(): { puzzle: Puzzle; puzzleNumber: number } {
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

export function createGameState(): GameState {
  const { puzzle, puzzleNumber } = getDailyPuzzle();
  return {
    puzzle,
    puzzleNumber,
    chain: [puzzle.start],
    isComplete: false,
    isGivenUp: false,
  };
}

// Save/load from localStorage
const STORAGE_KEY = "word-ladder-state";

export function saveGame(state: GameState): void {
  const today = new Date().toISOString().split("T")[0];
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ date: today, state })
  );
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { date, state } = JSON.parse(raw);
    const today = new Date().toISOString().split("T")[0];
    if (date !== today) return null; // stale
    return state;
  } catch {
    return null;
  }
}

export function generateShareText(state: GameState): string {
  const { puzzle, puzzleNumber, chain } = state;
  const steps = chain.length - 1; // exclude start word
  const optimal = puzzle.optimalLength;
  const rating =
    steps === optimal
      ? "⭐ Perfect!"
      : steps <= optimal + 1
        ? "🔥 Great!"
        : steps <= optimal + 3
          ? "👍 Good"
          : "✅ Done";

  let text = `🪜 Word Ladder #${puzzleNumber}\n`;
  text += `${puzzle.start.toUpperCase()} → ${puzzle.end.toUpperCase()}\n`;
  text += `${steps} steps (optimal: ${optimal}) ${rating}\n\n`;

  // Show the chain with changed letters highlighted
  for (let i = 0; i < chain.length; i++) {
    const word = chain[i].toUpperCase();
    if (i === 0) {
      text += `${word} (start)\n`;
    } else {
      // Find which letter changed
      const prev = chain[i - 1];
      let indicator = "";
      for (let j = 0; j < 5; j++) {
        indicator += prev[j] === chain[i][j] ? "·" : "↕";
      }
      text += `${indicator}\n${word}${i === chain.length - 1 ? " (end)" : ""}\n`;
    }
  }

  text += `\nhttps://word-ladder.game`;
  return text;
}
