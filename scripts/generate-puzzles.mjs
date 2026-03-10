/**
 * Generates daily puzzle pairs for the word ladder game.
 * Finds word pairs where the shortest path (BFS) is at least 4 steps.
 * Outputs a JSON file with puzzle data.
 */

import { readFileSync, writeFileSync } from "fs";

const words = readFileSync("/tmp/sgb_clean.txt", "utf-8")
  .trim()
  .split("\n")
  .map((w) => w.trim().toLowerCase());

console.log(`Loaded ${words.length} words`);

const wordSet = new Set(words);

// Build adjacency list: words differing by exactly 1 letter
function getNeighbors(word) {
  const neighbors = [];
  const chars = word.split("");
  for (let i = 0; i < 5; i++) {
    const orig = chars[i];
    for (let c = 97; c <= 122; c++) {
      const ch = String.fromCharCode(c);
      if (ch === orig) continue;
      chars[i] = ch;
      const candidate = chars.join("");
      if (wordSet.has(candidate)) {
        neighbors.push(candidate);
      }
    }
    chars[i] = orig;
  }
  return neighbors;
}

// Pre-build adjacency map
console.log("Building adjacency map...");
const adj = new Map();
for (const word of words) {
  adj.set(word, getNeighbors(word));
}

// BFS from a word, returns distance map
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

// BFS returning one shortest path
function bfsPath(start, end) {
  if (start === end) return [start];
  const prev = new Map();
  prev.set(start, null);
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    for (const neighbor of adj.get(curr)) {
      if (!prev.has(neighbor)) {
        prev.set(neighbor, curr);
        if (neighbor === end) {
          // Reconstruct
          const path = [];
          let node = end;
          while (node !== null) {
            path.push(node);
            node = prev.get(node);
          }
          return path.reverse();
        }
        queue.push(neighbor);
      }
    }
  }
  return null;
}

// Find all shortest paths (up to a limit) for the reveal
function bfsAllPaths(start, end, maxPaths = 5) {
  if (start === end) return [[start]];

  // First find the shortest distance
  const distFromStart = bfs(start);
  const optimalDist = distFromStart.get(end);
  if (optimalDist === undefined) return [];

  // BFS backwards from end, only following edges that decrease distance
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

// Generate puzzles: pick common words, find pairs with optimal dist in [4, 7]
console.log("Generating puzzles...");

// Use a seeded RNG for reproducibility
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);

// Shuffle array with seeded RNG
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Filter to words with reasonable connectivity (at least 3 neighbors)
const goodWords = words.filter((w) => adj.get(w).length >= 3);
console.log(`Words with >= 3 neighbors: ${goodWords.length}`);

shuffle(goodWords);

const puzzles = [];
const usedPairs = new Set();
const TARGET_PUZZLES = 1000; // enough for ~3 years of daily puzzles

// Sample pairs
for (let i = 0; i < goodWords.length && puzzles.length < TARGET_PUZZLES; i++) {
  const start = goodWords[i];
  const distMap = bfs(start);

  // Find words at distance 4-6
  const candidates = [];
  for (const [word, dist] of distMap) {
    if (dist >= 4 && dist <= 6 && adj.get(word).length >= 3) {
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

    const optimalPaths = bfsAllPaths(start, end, 3);
    const optimalLength = candidates[j].dist;

    puzzles.push({
      start,
      end,
      optimalLength,
      optimalPaths,
    });
  }

  if (i % 100 === 0) {
    console.log(
      `  Checked ${i}/${goodWords.length} words, found ${puzzles.length} puzzles`
    );
  }
}

console.log(`Generated ${puzzles.length} puzzles`);

// Shuffle puzzles so daily order is mixed
shuffle(puzzles);

// Write output
const output = {
  puzzles: puzzles.map((p) => ({
    s: p.start,
    e: p.end,
    d: p.optimalLength,
    p: p.optimalPaths,
  })),
};

writeFileSync(
  new URL("../src/data/puzzles.json", import.meta.url),
  JSON.stringify(output)
);
console.log("Wrote src/data/puzzles.json");

// Also write the word list
writeFileSync(
  new URL("../src/data/words.json", import.meta.url),
  JSON.stringify(words)
);
console.log("Wrote src/data/words.json");
