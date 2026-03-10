import { useMemo } from "react";

interface WordRowProps {
  word: string;
  previousWord?: string;
  isStart?: boolean;
  isEnd?: boolean;
  isTarget?: boolean;
}

export function WordRow({
  word,
  previousWord,
  isStart,
  isEnd,
  isTarget,
}: WordRowProps) {
  const letters = word.toUpperCase().split("");

  const changedIndices = useMemo(() => {
    if (!previousWord) return new Set<number>();
    const indices = new Set<number>();
    for (let i = 0; i < 5; i++) {
      if (previousWord[i] !== word[i]) indices.add(i);
    }
    return indices;
  }, [word, previousWord]);

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
      {isStart && <span className="row-label">START</span>}
      {isEnd && <span className="row-label">END</span>}
    </div>
  );
}
