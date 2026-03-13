import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { Locale } from "../i18n";
import { normalizeLetterForLocale } from "../game/normalize";
import { WordRow } from "./WordRow";

interface WordInputProps {
  onSubmit: (word: string) => { valid: boolean; error?: string };
  onUndo?: () => void;
  onSwitchSide?: () => void;
  onDraftChange?: (word: string) => void;
  matchedIndices?: Set<number>;
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
  submitShortLabel: string;
  undoLabel: string;
  undoShortLabel: string;
  switchSideLabel: string;
  changeOneLetterMessage: string;
  invalidWordMessage: string;
  letterAriaLabel: (index: number) => string;
  moveLeftLabel: string;
  moveRightLabel: string;
  backspaceLabel: string;
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

const MOBILE_BREAKPOINT_QUERY = "(max-width: 720px)";

function prefersAzerty(locale: Locale): boolean {
  if (locale === "fr") return true;

  const languages =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];
  return languages.some((language) => language.toLowerCase().startsWith("fr"));
}

function getMobileKeyboardRows(locale: Locale): string[][] {
  if (prefersAzerty(locale)) {
    return [
      Array.from("azertyuiop"),
      Array.from("qsdfghjklm"),
      Array.from("wxcvbn"),
    ];
  }

  return [
    Array.from("qwertyuiop"),
    Array.from("asdfghjkl"),
    Array.from("zxcvbnm"),
  ];
}

export function WordInput({
  onSubmit,
  onUndo,
  onSwitchSide,
  onDraftChange,
  matchedIndices,
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
  submitShortLabel,
  undoLabel,
  undoShortLabel,
  switchSideLabel,
  changeOneLetterMessage,
  invalidWordMessage,
  letterAriaLabel,
  moveLeftLabel,
  moveRightLabel,
  backspaceLabel,
  startLabel,
  endLabel,
}: WordInputProps) {
  const [draft, setDraft] = useState<DraftState>(() => createDraft(previousWord));
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const focusTimeoutRef = useRef<number | null>(null);
  const alphabetSet = new Set(alphabet);
  const previousLetters = Array.from(previousWord);
  const mobileKeyboardRows = useMemo(() => getMobileKeyboardRows(locale), [locale]);
  const normalizeInput = useCallback(
    (value: string) => normalizeLetterForLocale(locale, value),
    [locale]
  );

  const clearScheduledFocus = useCallback(() => {
    if (focusTimeoutRef.current !== null) {
      window.clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }
  }, []);

  const activateCell = useCallback(
    (index: number) => {
      clearScheduledFocus();
      setDraft((prev) => {
        if (prev.changedIndex === null || prev.changedIndex === index) {
          return prev.activeIndex === index ? prev : { ...prev, activeIndex: index };
        }

        const nextLetters = [...prev.letters];
        nextLetters[prev.changedIndex] = previousLetters[prev.changedIndex];
        return {
          letters: nextLetters,
          activeIndex: index,
          changedIndex: null,
        };
      });
      setError(null);
    },
    [clearScheduledFocus, previousLetters]
  );

  const focusCell = useCallback(
    (index: number) => {
      const input = inputRefs.current[index];
      activateCell(index);
      if (!isMobileLayout) {
        input?.focus();
        input?.select();
      }
    },
    [activateCell, isMobileLayout]
  );

  const scheduleFocusCell = useCallback(
    (index: number) => {
      if (isMobileLayout) {
        return;
      }

      clearScheduledFocus();
      focusTimeoutRef.current = window.setTimeout(() => {
        focusTimeoutRef.current = null;
        const input = inputRefs.current[index];
        input?.focus();
        input?.select();
      }, 0);
    },
    [clearScheduledFocus, isMobileLayout]
  );

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

  const handleMobileKeyPress = useCallback(
    (letter: string) => {
      applyLetter(draft.activeIndex, letter);
    },
    [applyLetter, draft.activeIndex]
  );

  const handleBackspace = useCallback(() => {
    if (draft.changedIndex === draft.activeIndex) {
      revertLetter(draft.activeIndex);
      return;
    }

    moveActive(draft.activeIndex, -1);
  }, [draft.activeIndex, draft.changedIndex, moveActive, revertLetter]);

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
    if (!disabled && !isMobileLayout) {
      scheduleFocusCell(0);
    }
  }, [disabled, isMobileLayout, previousWord, scheduleFocusCell]);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileLayout(event.matches);
    };

    setIsMobileLayout(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    onDraftChange?.(draft.letters.join(""));
  }, [draft.letters, onDraftChange]);

  useEffect(() => () => clearScheduledFocus(), [clearScheduledFocus]);

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
        scheduleFocusCell(index);
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        if (draft.changedIndex === index) {
          revertLetter(index);
          scheduleFocusCell(index);
        } else {
          moveActive(index, -1);
        }
        return;
      }

      if (e.key === "Shift") {
        return;
      }

      const normalized = normalizeInput(e.key);
      if (alphabetSet.has(normalized)) {
        e.preventDefault();
        applyLetter(index, normalized);
        scheduleFocusCell(index);
      }
    },
    [
      alphabet,
      alphabetSet,
      applyLetter,
      draft.changedIndex,
      draft.letters,
      handleSubmit,
      moveActive,
      revertLetter,
      normalizeInput,
      scheduleFocusCell,
    ]
  );

  const handleChange = useCallback(
    (index: number, value: string) => {
      const nextChar = normalizeInput(value).slice(-1);
      if (!nextChar) {
        revertLetter(index);
        scheduleFocusCell(index);
        return;
      }

      if (alphabetSet.has(nextChar)) {
        applyLetter(index, nextChar);
        scheduleFocusCell(index);
      }
    },
    [alphabetSet, applyLetter, normalizeInput, revertLetter, scheduleFocusCell]
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
              <span className="button-key">(Shift)</span>
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

  const renderEditableCell = useCallback(
    (letter: string, index: number) => {
      const className = `letter-cell letter-input ${
        draft.changedIndex === index ? "letter-changed" : ""
      } ${matchedIndices?.has(index) ? "letter-common" : ""} ${
        draft.activeIndex === index ? "letter-input-active" : ""
      } ${isMobileLayout ? "letter-input-mobile" : ""}`;

      if (isMobileLayout) {
        return (
          <button
            key={index}
            className={className}
            onClick={() => activateCell(index)}
            type="button"
            tabIndex={-1}
            aria-label={letterAriaLabel(index + 1)}
          >
            {letter.toLocaleUpperCase(locale)}
          </button>
        );
      }

      return (
        <input
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          className={className}
          value={letter.toLocaleUpperCase(locale)}
          onMouseDown={() => activateCell(index)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onChange={(e) => handleChange(index, e.target.value)}
          maxLength={1}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-label={letterAriaLabel(index + 1)}
          disabled={disabled}
        />
      );
    },
    [
      activateCell,
      disabled,
      draft.activeIndex,
      draft.changedIndex,
      handleChange,
      handleKeyDown,
      isMobileLayout,
      letterAriaLabel,
      locale,
      matchedIndices,
    ]
  );

  if (disabled) return null;

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
              <div key={i} className="letter-slot">
                {draft.changedIndex === i && (
                  <span
                    className={`letter-change-arrow letter-change-arrow--${
                      referencePlacement === "below" ? "below" : "above"
                    }`}
                    aria-hidden="true"
                  />
                )}
                {renderEditableCell(letter, i)}
              </div>
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

      {isMobileLayout && (
        <div className="mobile-input-dock">
          <div className="mobile-input-dock-inner">
            <div className="mobile-input-actions">
              <button
                className="mobile-control-btn mobile-control-btn-icon"
                onClick={() => moveActive(draft.activeIndex, -1)}
                type="button"
                tabIndex={-1}
                aria-label={moveLeftLabel}
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                className="mobile-control-btn mobile-control-btn-icon"
                onClick={() => moveActive(draft.activeIndex, 1)}
                type="button"
                tabIndex={-1}
                aria-label={moveRightLabel}
              >
                <span aria-hidden="true">→</span>
              </button>
              <button
                className="mobile-control-btn mobile-control-btn-primary"
                onClick={handleSubmit}
                type="button"
                tabIndex={-1}
              >
                {submitShortLabel}
              </button>
              <button
                className="mobile-control-btn"
                onClick={onUndo}
                type="button"
                tabIndex={-1}
                disabled={!canUndo || !onUndo}
              >
                {undoShortLabel}
              </button>
              <button
                className="mobile-control-btn"
                onClick={onSwitchSide}
                type="button"
                tabIndex={-1}
                aria-label={switchSideLabel}
              >
                <span className="mobile-switch-icon" aria-hidden="true">
                  ↑↓
                </span>
              </button>
            </div>

            <div className="mobile-keyboard" aria-label="On-screen keyboard">
              {mobileKeyboardRows.map((row, rowIndex) => (
                <div key={rowIndex} className="mobile-keyboard-row">
                  {row.map((letter) => (
                    <button
                      key={letter}
                      className="mobile-key-btn"
                      onClick={() => handleMobileKeyPress(letter)}
                      type="button"
                      tabIndex={-1}
                    >
                      {letter.toLocaleUpperCase(locale)}
                    </button>
                  ))}
                  {rowIndex === mobileKeyboardRows.length - 1 && (
                    <button
                      className="mobile-key-btn mobile-key-btn-action"
                      onClick={handleBackspace}
                      type="button"
                      tabIndex={-1}
                      aria-label={backspaceLabel}
                    >
                      <span aria-hidden="true">⌫</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
