/**
 * Generates locale-specific daily puzzle pairs for the word ladder game.
 *
 * Examples:
 *   node scripts/generate-puzzles.mjs
 *   node scripts/generate-puzzles.mjs --locale fr --source /tmp/french-array.json
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { normalizeWordForLocale } from "./normalize-words.mjs";

const LOCALE_CONFIG = {
  en: {
    source: "/tmp/sgb_clean.txt",
    wordsOutput: "../src/data/words.json",
    puzzlesOutput: "../src/data/puzzles.json",
    commonWords: "../src/data/en-common.json",
    alphabet: Array.from("abcdefghijklmnopqrstuvwxyz"),
    wordPattern: /^[a-z]{5}$/u,
  },
  fr: {
    source: "/tmp/french-array.json",
    wordsOutput: "../src/data/fr-words.json",
    puzzlesOutput: "../src/data/fr-puzzles.json",
    commonWords: "../src/data/fr-common.json",
    alphabet: Array.from("abcdefghijklmnopqrstuvwxyz"),
    wordPattern: /^[a-z]{5}$/u,
  },
};

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      options[key] = "true";
      continue;
    }
    options[key] = value;
    i++;
  }
  return options;
}

function loadSourceWords(sourcePath) {
  const raw = readFileSync(sourcePath, "utf-8").trim();
  if (sourcePath.endsWith(".json")) {
    return JSON.parse(raw);
  }

  return raw.split(/\r?\n/);
}

const args = parseArgs(process.argv.slice(2));
const locale = args.locale || "en";
const config = LOCALE_CONFIG[locale];

if (!config) {
  throw new Error(`Unsupported locale: ${locale}`);
}

const sourcePath = args.source || config.source;
const wordsOutputPath = args["words-output"] || config.wordsOutput;
const puzzlesOutputPath = args["puzzles-output"] || config.puzzlesOutput;
const commonWordsPath = args["common-words"] || config.commonWords;
const alphabet = config.alphabet;

const words = [
  ...new Set(
    loadSourceWords(sourcePath)
      .map((word) => normalizeWordForLocale(locale, word))
      .filter((word) => config.wordPattern.test(word))
  ),
];

console.log(`Loaded ${words.length} words for locale ${locale}`);

const wordSet = new Set(words);
const commonWords = commonWordsPath && existsSync(new URL(commonWordsPath, import.meta.url))
  ? new Set(JSON.parse(readFileSync(new URL(commonWordsPath, import.meta.url), "utf-8")))
  : null;

// Build adjacency list: words differing by exactly 1 letter.
function getNeighbors(word) {
  const neighbors = [];
  const chars = Array.from(word);
  for (let i = 0; i < chars.length; i++) {
    const original = chars[i];
    for (const letter of alphabet) {
      if (letter === original) continue;
      chars[i] = letter;
      const candidate = chars.join("");
      if (wordSet.has(candidate)) {
        neighbors.push(candidate);
      }
    }
    chars[i] = original;
  }
  return neighbors;
}

console.log("Building adjacency map...");
const adj = new Map();
for (const word of words) {
  adj.set(word, getNeighbors(word));
}

function bfs(start) {
  const dist = new Map();
  dist.set(start, 0);
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const d = dist.get(curr);
    for (const neighbor of adj.get(curr)) {
      if (!dist.has(neighbor)) {
        dist.set(neighbor, d + 1);
        queue.push(neighbor);
      }
    }
  }
  return dist;
}

function bfsAllPaths(start, end, maxPaths = 5) {
  if (start === end) return [[start]];

  const distFromStart = bfs(start);
  const optimalDist = distFromStart.get(end);
  if (optimalDist === undefined) return [];

  const paths = [];

  function backtrack(current, path) {
    if (paths.length >= maxPaths) return;
    if (current === start) {
      paths.push([...path].reverse());
      return;
    }
    const currentDist = distFromStart.get(current);
    for (const neighbor of adj.get(current)) {
      if (distFromStart.get(neighbor) === currentDist - 1) {
        path.push(neighbor);
        backtrack(neighbor, path);
        path.pop();
        if (paths.length >= maxPaths) return;
      }
    }
  }

  backtrack(end, [end]);
  return paths;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

console.log("Generating puzzles...");
const goodWords = words.filter(
  (word) =>
    adj.get(word).length >= 3 &&
    (commonWords === null || commonWords.has(word))
);
console.log(`Words with >= 3 neighbors: ${goodWords.length}`);

shuffle(goodWords);

const puzzles = [];
const usedPairs = new Set();
const TARGET_PUZZLES = 1000;

for (let i = 0; i < goodWords.length && puzzles.length < TARGET_PUZZLES; i++) {
  const start = goodWords[i];
  const distMap = bfs(start);
  const candidates = [];

  for (const [word, dist] of distMap) {
    if (
      dist >= 4 &&
      dist <= 6 &&
      adj.get(word).length >= 3 &&
      (commonWords === null || commonWords.has(word))
    ) {
      candidates.push({ word, dist });
    }
  }

  shuffle(candidates);

  for (
    let j = 0;
    j < Math.min(3, candidates.length) && puzzles.length < TARGET_PUZZLES;
    j++
  ) {
    const end = candidates[j].word;
    const pairKey = [start, end].sort().join("-");
    if (usedPairs.has(pairKey)) continue;
    usedPairs.add(pairKey);

    puzzles.push({
      start,
      end,
      optimalLength: candidates[j].dist,
      optimalPaths: bfsAllPaths(start, end, 3),
    });
  }

  if (i % 100 === 0) {
    console.log(
      `  Checked ${i}/${goodWords.length} words, found ${puzzles.length} puzzles`
    );
  }
}

console.log(`Generated ${puzzles.length} puzzles`);
shuffle(puzzles);

const output = {
  puzzles: puzzles.map((puzzle) => ({
    s: puzzle.start,
    e: puzzle.end,
    d: puzzle.optimalLength,
    p: puzzle.optimalPaths,
  })),
};

writeFileSync(
  new URL(puzzlesOutputPath, import.meta.url),
  JSON.stringify(output)
);
console.log(`Wrote ${puzzlesOutputPath}`);

writeFileSync(
  new URL(wordsOutputPath, import.meta.url),
  JSON.stringify(words)
);
console.log(`Wrote ${wordsOutputPath}`);
