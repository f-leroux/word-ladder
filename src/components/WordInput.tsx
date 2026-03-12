import { useState, useRef, useEffect, useCallback } from "react";
import type { Locale } from "../i18n";
import { normalizeLetterForLocale } from "../game/normalize";
import { WordRow } from "./WordRow";

interface WordInputProps {
  onSubmit: (word: string) => { valid: boolean; error?: string };
  onUndo?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
  previousWord: string;
  locale: Locale;
  alphabet: string[];
  referenceWord: string;
  referencePreviousWord?: string;
  referencePlacement: "above" | "below";
  referenceIsStart?: boolean;
  referenceIsEnd?: boolean;
  referenceIsTarget?: boolean;
  submitLabel: string;
  undoLabel: string;
  changeOneLetterMessage: string;
  invalidWordMessage: string;
  letterAriaLabel: (index: number) => string;
  startLabel: string;
  endLabel: string;
}

interface DraftState {
  letters: string[];
  activeIndex: number;
  changedIndex: number | null;
}

function createDraft(previousWord: string): DraftState {
  return {
    letters: Array.from(previousWord),
    activeIndex: 0,
    changedIndex: null,
  };
}

function cycleLetter(letter: string, alphabet: string[], direction: -1 | 1): string {
  const currentIndex = alphabet.indexOf(letter);
  const nextIndex =
    currentIndex === -1
      ? 0
      : (currentIndex + direction + alphabet.length) % alphabet.length;
  return alphabet[nextIndex];
}

export function WordInput({
  onSubmit,
  onUndo,
  canUndo = false,
  disabled,
  previousWord,
  locale,
  alphabet,
  referenceWord,
  referencePreviousWord,
  referencePlacement,
  referenceIsStart,
  referenceIsEnd,
  referenceIsTarget,
  submitLabel,
  undoLabel,
  changeOneLetterMessage,
  invalidWordMessage,
  letterAriaLabel,
  startLabel,
  endLabel,
}: WordInputProps) {
  const [draft, setDraft] = useState<DraftState>(() => createDraft(previousWord));
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const alphabetSet = new Set(alphabet);
  const previousLetters = Array.from(previousWord);
  const normalizeInput = useCallback(
    (value: string) => normalizeLetterForLocale(locale, value),
    [locale]
  );

  const focusCell = useCallback((index: number) => {
    const input = inputRefs.current[index];
    setDraft((prev) =>
      prev.activeIndex === index ? prev : { ...prev, activeIndex: index }
    );
    input?.focus();
    input?.select();
  }, []);

  const triggerError = useCallback((message: string) => {
    setError(message);
    setShake(true);
    window.setTimeout(() => setShake(false), 400);
  }, []);

  const applyLetter = useCallback(
    (index: number, nextLetter: string) => {
      const normalized = normalizeInput(nextLetter);
      if (!alphabetSet.has(normalized)) return;

      setDraft((prev) => {
        const nextLetters = [...prev.letters];

        if (
          normalized !== previousLetters[index] &&
          prev.changedIndex !== null &&
          prev.changedIndex !== index
        ) {
          nextLetters[prev.changedIndex] = previousLetters[prev.changedIndex];
        }

        nextLetters[index] = normalized;

        let nextChangedIndex = prev.changedIndex;
        if (normalized !== previousLetters[index]) {
          nextChangedIndex = index;
        } else if (prev.changedIndex === index) {
          nextChangedIndex = null;
        }

        return {
          letters: nextLetters,
          activeIndex: index,
          changedIndex: nextChangedIndex,
        };
      });

      setError(null);
    },
    [alphabetSet, normalizeInput, previousLetters]
  );

  const revertLetter = useCallback(
    (index: number) => {
      setDraft((prev) => {
        if (prev.changedIndex !== index) {
          return { ...prev, activeIndex: index };
        }

        const nextLetters = [...prev.letters];
        nextLetters[index] = previousLetters[index];
        return {
          letters: nextLetters,
          activeIndex: index,
          changedIndex: null,
        };
      });

      setError(null);
    },
    [previousLetters]
  );

  const moveActive = useCallback(
    (fromIndex: number, direction: -1 | 1) => {
      const nextIndex = (fromIndex + direction + previousLetters.length) % previousLetters.length;
      focusCell(nextIndex);
      setError(null);
    },
    [focusCell, previousLetters.length]
  );

  const handleSubmit = useCallback(() => {
    if (draft.changedIndex === null) {
      triggerError(changeOneLetterMessage);
      return;
    }

    const word = draft.letters.join("").toLowerCase();
    const result = onSubmit(word);
    if (!result.valid) {
      triggerError(result.error || invalidWordMessage);
      return;
    }

    setError(null);
  }, [
    changeOneLetterMessage,
    draft.changedIndex,
    draft.letters,
    invalidWordMessage,
    onSubmit,
    triggerError,
  ]);

  useEffect(() => {
    setDraft(createDraft(previousWord));
    setError(null);
    if (!disabled) {
      window.setTimeout(() => focusCell(0), 0);
    }
  }, [disabled, focusCell, previousWord]);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveActive(index, -1);
        return;
      }

      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        moveActive(index, 1);
        return;
      }

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const direction = e.key === "ArrowUp" ? 1 : -1;
        applyLetter(index, cycleLetter(draft.letters[index], alphabet, direction));
        window.setTimeout(() => focusCell(index), 0);
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        if (draft.changedIndex === index) {
          revertLetter(index);
          window.setTimeout(() => focusCell(index), 0);
        } else {
          moveActive(index, -1);
        }
        return;
      }

      if (e.key === "Escape") {
        if (canUndo && onUndo) {
          e.preventDefault();
          e.stopPropagation();
          onUndo();
        }
        return;
      }

      const normalized = normalizeInput(e.key);
      if (alphabetSet.has(normalized)) {
        e.preventDefault();
        applyLetter(index, normalized);
        window.setTimeout(() => focusCell(index), 0);
      }
    },
    [
      alphabet,
      alphabetSet,
      applyLetter,
      canUndo,
      draft.changedIndex,
      draft.letters,
      focusCell,
      handleSubmit,
      moveActive,
      onUndo,
      revertLetter,
      normalizeInput,
    ]
  );

  if (disabled) return null;

  const handleChange = useCallback(
    (index: number, value: string) => {
      const nextChar = normalizeInput(value).slice(-1);
      if (!nextChar) {
        revertLetter(index);
        window.setTimeout(() => focusCell(index), 0);
        return;
      }

      if (alphabetSet.has(nextChar)) {
        applyLetter(index, nextChar);
        window.setTimeout(() => focusCell(index), 0);
      }
    },
    [alphabetSet, applyLetter, focusCell, normalizeInput, revertLetter]
  );

  const renderReferenceRow = useCallback(
    () => (
      <div className="ladder-line">
        <WordRow
          locale={locale}
          word={referenceWord}
          previousWord={referencePreviousWord}
          isStart={referenceIsStart}
          isEnd={referenceIsEnd}
          isTarget={referenceIsTarget}
          startLabel={startLabel}
          endLabel={endLabel}
        />
        {canUndo && onUndo && (
          <div className="ladder-line-action">
            <button className="undo-btn" onClick={onUndo} tabIndex={-1} type="button">
              <span className="button-label">{undoLabel}</span>
              <span className="button-key">(Esc)</span>
            </button>
          </div>
        )}
      </div>
    ),
    [
      canUndo,
      endLabel,
      locale,
      onUndo,
      referenceIsEnd,
      referenceIsStart,
      referenceIsTarget,
      referencePreviousWord,
      referenceWord,
      startLabel,
      undoLabel,
    ]
  );

  return (
    <div className="word-input-container">
      <div
        className={`word-input-stack word-input-stack--${referencePlacement}`}
      >
        {referencePlacement === "above" && renderReferenceRow()}

        <div className="ladder-line">
          {referencePlacement === "below" && error && (
            <div className="error-message error-message-inline error-message-inline-top">
              {error}
            </div>
          )}
          <div className={`word-row word-row-input ${shake ? "shake" : ""}`}>
            {draft.letters.map((letter, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                className={`letter-cell letter-input ${
                  draft.changedIndex === i ? "letter-changed" : ""
                } ${draft.activeIndex === i ? "letter-input-active" : ""}`}
                value={letter.toLocaleUpperCase(locale)}
                onFocus={(e) => {
                  setDraft((prev) =>
                    prev.activeIndex === i ? prev : { ...prev, activeIndex: i }
                  );
                  e.currentTarget.select();
                }}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onChange={(e) => handleChange(i, e.target.value)}
                maxLength={1}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-label={letterAriaLabel(i + 1)}
                disabled={disabled}
              />
            ))}
          </div>
          <div className="ladder-line-action">
            <button className="submit-btn" onClick={handleSubmit} tabIndex={-1}>
              <span className="button-label">{submitLabel}</span>
              <span className="button-key">(Enter)</span>
            </button>
          </div>
          {referencePlacement === "above" && error && (
            <div className="error-message error-message-inline error-message-inline-bottom">
              {error}
            </div>
          )}
        </div>

        {referencePlacement === "below" && renderReferenceRow()}
      </div>
    </div>
  );
}
