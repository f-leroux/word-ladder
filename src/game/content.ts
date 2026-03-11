import enWords from "../data/words.json";
import enPuzzles from "../data/puzzles.json";
import frWords from "../data/fr-words.json";
import frPuzzles from "../data/fr-puzzles.json";
import type { Locale } from "../i18n";

interface CompactPuzzle {
  s: string;
  e: string;
  d: number;
  p: string[][];
}

interface PuzzleData {
  puzzles: CompactPuzzle[];
}

interface LocaleContent {
  words: string[];
  wordSet: Set<string>;
  puzzles: PuzzleData;
  alphabet: string[];
}

const CONTENT: Record<Locale, LocaleContent> = {
  en: {
    words: enWords,
    wordSet: new Set<string>(enWords),
    puzzles: enPuzzles as PuzzleData,
    alphabet: Array.from("abcdefghijklmnopqrstuvwxyz"),
  },
  fr: {
    words: frWords,
    wordSet: new Set<string>(frWords),
    puzzles: frPuzzles as PuzzleData,
    alphabet: Array.from("abcdefghijklmnopqrstuvwxyz"),
  },
};

export function getLocaleContent(locale: Locale): LocaleContent {
  return CONTENT[locale];
}
