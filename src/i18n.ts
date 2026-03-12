export type Locale = "en" | "fr";

export interface LocaleStrings {
  appTitle: string;
  lightModeLabel: string;
  darkModeLabel: string;
  helpTitle: string;
  helpIntro: string;
  helpBullets: string[];
  helpFooter: string;
  helpClose: string;
  startLabel: string;
  endLabel: string;
  submitWord: string;
  submitShort: string;
  undoWord: string;
  undoShort: string;
  buildFromEnd: string;
  buildFromStart: string;
  switchSideShort: string;
  moveLeft: string;
  moveRight: string;
  giveUp: string;
  copied: string;
  shareResult: string;
  maybeTomorrow: string;
  perfect: string;
  niceWork: string;
  gaveUpStat: string;
  solvedStat: (steps: number, optimal: number) => string;
  stepCount: (steps: number) => string;
  optimalToggle: (showOptimal: boolean, count: number) => string;
  pathLabel: (index: number) => string;
  letterAriaLabel: (index: number) => string;
  changeOneLetterToContinue: string;
  invalidWord: string;
  validation: {
    wordLength: string;
    invalidWord: string;
    oneLetter: string;
    used: string;
  };
  share: {
    gameName: string;
    perfect: string;
    great: string;
    good: string;
    done: string;
    summary: (steps: number, optimal: number, rating: string) => string;
    startTag: string;
    endTag: string;
    url: string;
  };
}

const STRINGS: Record<Locale, LocaleStrings> = {
  en: {
    appTitle: "Word Ladder",
    lightModeLabel: "Light",
    darkModeLabel: "Dark",
    helpTitle: "How to Play",
    helpIntro:
      "Get from the start word to the end word by changing one letter at a time.",
    helpBullets: [
      "Each step must be a valid English word",
      "You can only change one letter per step",
      "The next row starts from your current word",
      "You can switch and build upward from the end word too",
      "Click a letter or use the arrow keys to edit; Tab switches sides and Shift undoes the last word on that side",
    ],
    helpFooter: "A new puzzle is available every day.",
    helpClose: "Got it!",
    startLabel: "START",
    endLabel: "END",
    submitWord: "Submit Word",
    submitShort: "Submit",
    undoWord: "Undo Word",
    undoShort: "Undo",
    buildFromEnd: "Build From End",
    buildFromStart: "Build From Start",
    switchSideShort: "Switch",
    moveLeft: "Move left",
    moveRight: "Move right",
    giveUp: "Give Up",
    copied: "Copied!",
    shareResult: "Share Result 📋",
    maybeTomorrow: "Maybe Tomorrow!",
    perfect: "Perfect! ⭐",
    niceWork: "Nice Work!",
    gaveUpStat: "You gave up on this one",
    solvedStat: (steps, optimal) =>
      `You solved it in ${steps} step${steps === 1 ? "" : "s"} (optimal: ${optimal})`,
    stepCount: (steps) => `${steps} step${steps === 1 ? "" : "s"}`,
    optimalToggle: (showOptimal, count) =>
      `${showOptimal ? "Hide" : "Show"} Optimal Path${count > 1 ? "s" : ""}`,
    pathLabel: (index) => `Path ${index}`,
    letterAriaLabel: (index) => `Letter ${index} of next word`,
    changeOneLetterToContinue: "Change one letter to continue",
    invalidWord: "Invalid word",
    validation: {
      wordLength: "Word must be 5 letters",
      invalidWord: "Not a valid word",
      oneLetter: "Must change exactly one letter",
      used: "Word already used",
    },
    share: {
      gameName: "Word Ladder",
      perfect: "⭐ Perfect!",
      great: "🔥 Great!",
      good: "👍 Good",
      done: "✅ Done",
      summary: (steps, optimal, rating) =>
        `${steps} steps (optimal: ${optimal}) ${rating}`,
      startTag: "(start)",
      endTag: "(end)",
      url: "https://f-leroux.github.io/word-ladder/",
    },
  },
  fr: {
    appTitle: "L'Échelle",
    lightModeLabel: "Clair",
    darkModeLabel: "Sombre",
    helpTitle: "Comment jouer",
    helpIntro:
      "Passez du mot de début au mot de fin en changeant une seule lettre à la fois.",
    helpBullets: [
      "Chaque étape doit être un mot français valide de 5 lettres",
      "Vous ne pouvez changer qu'une seule lettre par étape",
      "La ligne suivante repart de votre mot actuel",
      "Vous pouvez aussi partir du mot de fin et remonter",
      "Cliquez une lettre ou utilisez les flèches pour modifier ; Tab change de côté et Shift annule le dernier mot sur ce côté",
      "Les accents ne comptent pas ; écrivez les mots sans accents",
    ],
    helpFooter: "Un nouveau puzzle est disponible chaque jour.",
    helpClose: "Compris !",
    startLabel: "DÉBUT",
    endLabel: "FIN",
    submitWord: "Valider",
    submitShort: "Valider",
    undoWord: "Annuler",
    undoShort: "Annuler",
    buildFromEnd: "Partir de la fin",
    buildFromStart: "Partir du début",
    switchSideShort: "Changer",
    moveLeft: "Vers la gauche",
    moveRight: "Vers la droite",
    giveUp: "Abandonner",
    copied: "Copié !",
    shareResult: "Partager 📋",
    maybeTomorrow: "À demain !",
    perfect: "Parfait ! ⭐",
    niceWork: "Bien joué !",
    gaveUpStat: "Vous avez abandonné celle-ci",
    solvedStat: (steps, optimal) =>
      `Résolu en ${steps} étape${steps === 1 ? "" : "s"} (optimal : ${optimal})`,
    stepCount: (steps) => `${steps} étape${steps === 1 ? "" : "s"}`,
    optimalToggle: (showOptimal, count) => {
      const noun = count > 1 ? "les chemins optimaux" : "le chemin optimal";
      return `${showOptimal ? "Masquer" : "Afficher"} ${noun}`;
    },
    pathLabel: (index) => `Chemin ${index}`,
    letterAriaLabel: (index) => `Lettre ${index} du mot suivant`,
    changeOneLetterToContinue: "Changez une lettre pour continuer",
    invalidWord: "Mot invalide",
    validation: {
      wordLength: "Le mot doit avoir 5 lettres",
      invalidWord: "Mot non valide",
      oneLetter: "Il faut changer une seule lettre",
      used: "Mot déjà utilisé",
    },
    share: {
      gameName: "L'Échelle",
      perfect: "⭐ Parfait !",
      great: "🔥 Super !",
      good: "👍 Bien joué",
      done: "✅ Terminé",
      summary: (steps, optimal, rating) =>
        `${steps} étapes (optimal : ${optimal}) ${rating}`,
      startTag: "(début)",
      endTag: "(fin)",
      url: "https://f-leroux.github.io/word-ladder/?lang=fr",
    },
  },
};

export function getLocaleFromSearch(search = window.location.search): Locale {
  const params = new URLSearchParams(search);
  const rawLocale = params.get("lang") ?? params.get("locale");
  return rawLocale === "fr" ? "fr" : "en";
}

export function getLocaleStrings(locale: Locale): LocaleStrings {
  return STRINGS[locale];
}
