/**
 * Builds locale-specific common endpoint lists used to constrain puzzle starts/ends.
 *
 * Examples:
 *   node scripts/build-common-words.mjs --locale en
 *   node scripts/build-common-words.mjs --locale fr
 */

import { readFileSync, writeFileSync } from "fs";
import { normalizeWordForLocale } from "./normalize-words.mjs";

const LOCALE_CONFIG = {
  en: {
    source: "/tmp/google-10000-english-no-swears.txt",
    dictionary: "../src/data/words.json",
    output: "../src/data/en-common.json",
    limit: 1000,
    parse(sourceText, dictionarySet) {
      const words = [];
      for (const rawWord of sourceText.trim().split(/\r?\n/)) {
        const word = normalizeWordForLocale("en", rawWord);
        if (!/^[a-z]{5}$/.test(word) || !dictionarySet.has(word) || words.includes(word)) {
          continue;
        }
        words.push(word);
        if (words.length >= this.limit) break;
      }
      return words;
    },
  },
  fr: {
    source: "/tmp/Lexique383.tsv",
    dictionary: "../src/data/fr-words.json",
    output: "../src/data/fr-common.json",
    limit: 1000,
    parse(sourceText, dictionarySet) {
      const [headerLine, ...rows] = sourceText.trim().split(/\r?\n/);
      const headers = headerLine.split("\t");
      const orthoIndex = headers.indexOf("ortho");
      const freqIndex = headers.indexOf("freqfilms2");
      const ranked = [];

      for (const row of rows) {
        const columns = row.split("\t");
        const word = normalizeWordForLocale("fr", columns[orthoIndex] ?? "");
        const frequency = Number(columns[freqIndex]);
        if (
          !word ||
          !/^[a-z]{5}$/u.test(word) ||
          !dictionarySet.has(word) ||
          Number.isNaN(frequency)
        ) {
          continue;
        }
        ranked.push({ word, frequency });
      }

      ranked.sort(
        (left, right) => right.frequency - left.frequency || left.word.localeCompare(right.word, "fr")
      );

      const words = [];
      const seen = new Set();
      for (const entry of ranked) {
        if (seen.has(entry.word)) continue;
        seen.add(entry.word);
        words.push(entry.word);
        if (words.length >= this.limit) break;
      }

      return words;
    },
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

const args = parseArgs(process.argv.slice(2));
const locale = args.locale || "en";
const config = LOCALE_CONFIG[locale];

if (!config) {
  throw new Error(`Unsupported locale: ${locale}`);
}

const sourcePath = args.source || config.source;
const dictionaryPath = args.dictionary || config.dictionary;
const outputPath = args.output || config.output;

const sourceText = readFileSync(sourcePath, "utf-8");
const dictionary = JSON.parse(
  readFileSync(new URL(dictionaryPath, import.meta.url), "utf-8")
);
const dictionarySet = new Set(dictionary);
const commonWords = config.parse(sourceText, dictionarySet);

writeFileSync(new URL(outputPath, import.meta.url), JSON.stringify(commonWords));
console.log(`Wrote ${commonWords.length} common ${locale} words to ${outputPath}`);
