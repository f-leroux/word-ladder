export function normalizeWordForLocale(locale, value) {
  const lowered = value.trim().toLocaleLowerCase(locale);
  if (locale !== "fr") {
    return lowered;
  }

  return lowered
    .replaceAll("œ", "oe")
    .replaceAll("æ", "ae")
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .normalize("NFC");
}
