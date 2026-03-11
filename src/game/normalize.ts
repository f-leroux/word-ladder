import type { Locale } from "../i18n";

function stripFrenchDiacritics(value: string): string {
  return value
    .replaceAll("œ", "oe")
    .replaceAll("æ", "ae")
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .normalize("NFC");
}

export function normalizeWordForLocale(locale: Locale, value: string): string {
  const lowered = value.trim().toLocaleLowerCase(locale);
  if (locale !== "fr") {
    return lowered;
  }

  return stripFrenchDiacritics(lowered);
}

export function normalizeLetterForLocale(locale: Locale, value: string): string {
  return normalizeWordForLocale(locale, value);
}
