import { useMemo } from "react";

interface WordRowProps {
  word: string;
  previousWord?: string;
  isStart?: boolean;
  isEnd?: boolean;
  isTarget?: boolean;
  locale?: string;
  startLabel?: string;
  endLabel?: string;
}

export function WordRow({
  word,
  previousWord,
  isStart,
  isEnd,
  isTarget,
  locale = "en",
  startLabel = "START",
  endLabel = "END",
}: WordRowProps) {
  const letters = Array.from(word.toLocaleUpperCase(locale));
  const previousLetters = previousWord ? Array.from(previousWord) : null;
  const currentLetters = Array.from(word);

  const changedIndices = useMemo(() => {
    if (!previousLetters) return new Set<number>();
    const indices = new Set<number>();
    for (let i = 0; i < currentLetters.length; i++) {
      if (previousLetters[i] !== currentLetters[i]) indices.add(i);
    }
    return indices;
  }, [currentLetters, previousLetters]);

  return (
    <div className={`word-row ${isTarget ? "word-row-target" : ""}`}>
      {letters.map((letter, i) => (
        <div
          key={i}
          className={`letter-cell ${
            changedIndices.has(i) ? "letter-changed" : ""
          } ${isStart ? "letter-start" : ""} ${isEnd ? "letter-end" : ""}`}
        >
          {letter}
        </div>
      ))}
      {isStart && <span className="row-label">{startLabel}</span>}
      {isEnd && <span className="row-label">{endLabel}</span>}
    </div>
  );
}
