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
        <div className="header-theme">
          <button
            className={`theme-toggle theme-toggle--${theme}`}
            onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            tabIndex={-1}
            type="button"
            aria-label={theme === "dark" ? strings.lightModeLabel : strings.darkModeLabel}
            aria-pressed={theme === "light"}
          >
            <span className="theme-toggle-track" aria-hidden="true">
              <span className="theme-toggle-icon theme-toggle-icon-sun">
                <svg viewBox="0 0 24 24" role="presentation">
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 2.5v3.1M12 18.4v3.1M21.5 12h-3.1M5.6 12H2.5M18.7 5.3l-2.2 2.2M7.5 16.5l-2.2 2.2M18.7 18.7l-2.2-2.2M7.5 7.5 5.3 5.3" />
                </svg>
              </span>
              <span className="theme-toggle-icon theme-toggle-icon-moon">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path d="M14.8 3.1a8.8 8.8 0 1 0 6.1 15.2A9.5 9.5 0 0 1 14.8 3.1Z" />
                </svg>
              </span>
              <span className="theme-toggle-thumb" />
            </span>
          </button>
        </div>
        <h1 className="title">{strings.appTitle}</h1>
        <div className="header-help">
          <button
            className="help-btn"
            onClick={() => setShowHelp(!showHelp)}
            tabIndex={-1}
            type="button"
          >
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
              type="button"
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
