import { useState, useRef, useEffect, useCallback } from "react";

interface WordInputProps {
  onSubmit: (word: string) => { valid: boolean; error?: string };
  disabled?: boolean;
  previousWord: string;
}

export function WordInput({ onSubmit, disabled, previousWord }: WordInputProps) {
  const [letters, setLetters] = useState<string[]>(["", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [disabled]);

  const handleSubmit = useCallback(() => {
    const word = letters.join("").toLowerCase();
    if (word.length < 5) {
      setError("Enter all 5 letters");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    const result = onSubmit(word);
    if (!result.valid) {
      setError(result.error || "Invalid word");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } else {
      setLetters(["", "", "", "", ""]);
      setError(null);
      // Focus first input after successful submit
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }, [letters, onSubmit]);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        if (letters[index]) {
          const newLetters = [...letters];
          newLetters[index] = "";
          setLetters(newLetters);
        } else if (index > 0) {
          const newLetters = [...letters];
          newLetters[index - 1] = "";
          setLetters(newLetters);
          inputRefs.current[index - 1]?.focus();
        }
        setError(null);
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        const newLetters = [...letters];
        newLetters[index] = e.key.toLowerCase();
        setLetters(newLetters);
        setError(null);
        if (index < 4) {
          inputRefs.current[index + 1]?.focus();
        }
      }
    },
    [letters, handleSubmit]
  );

  if (disabled) return null;

  const prevLetters = previousWord.split("");

  return (
    <div className="word-input-container">
      <div className={`word-row word-row-input ${shake ? "shake" : ""}`}>
        {letters.map((letter, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            className={`letter-cell letter-input ${
              letter && letter !== prevLetters[i] ? "letter-changed" : ""
            }`}
            value={letter.toUpperCase()}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onChange={() => {}} // controlled by onKeyDown
            maxLength={1}
            autoComplete="off"
            autoCapitalize="off"
            disabled={disabled}
          />
        ))}
        <button className="submit-btn" onClick={handleSubmit}>
          →
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
