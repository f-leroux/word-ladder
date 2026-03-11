import { useEffect, useState } from "react";
import { Game } from "./components/Game";
import { getLocaleFromSearch, getLocaleStrings } from "./i18n";
import "./App.css";

type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "word-ladder-theme";

function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function App() {
  const locale = getLocaleFromSearch();
  const strings = getLocaleStrings(locale);
  const [showHelp, setShowHelp] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.title = strings.appTitle;
  }, [strings.appTitle]);

  return (
    <div className="app" data-locale={locale}>
      <header className="header">
        <h1 className="title">{strings.appTitle}</h1>
        <div className="header-controls">
          <button
            className="theme-btn"
            onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            tabIndex={-1}
          >
            {theme === "dark" ? strings.lightModeLabel : strings.darkModeLabel}
          </button>
          <button className="help-btn" onClick={() => setShowHelp(!showHelp)} tabIndex={-1}>
            ?
          </button>
        </div>
      </header>

      {showHelp && (
        <div className="help-modal" onClick={() => setShowHelp(false)}>
          <div className="help-content" onClick={(e) => e.stopPropagation()}>
            <h2>{strings.helpTitle}</h2>
            <p>{strings.helpIntro}</p>
            <ul>
              {strings.helpBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <p>{strings.helpFooter}</p>
            <button
              className="close-help-btn"
              onClick={() => setShowHelp(false)}
              tabIndex={-1}
            >
              {strings.helpClose}
            </button>
          </div>
        </div>
      )}

      <Game locale={locale} strings={strings} />
    </div>
  );
}

export default App;
