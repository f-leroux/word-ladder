# Word Ladder

A daily five-letter word ladder game built with React, TypeScript, and Vite.

- English is the default mode.
- French is available at `?lang=fr`.
- The puzzle set is precomputed offline and shipped as static JSON, so the deployed site is just a static frontend.

## Play Locally

```bash
npm install
npm run dev
```

To build the production bundle:

```bash
npm run build
```

## Puzzle Data

The app loads precomputed puzzle data from:

- `src/data/puzzles.json` and `src/data/words.json` for English
- `src/data/fr-puzzles.json` and `src/data/fr-words.json` for French

The generation script is:

```bash
node scripts/generate-puzzles.mjs --locale en --source src/data/words.json
node scripts/generate-puzzles.mjs --locale fr --source /tmp/french-array.json
```

Common-word endpoint lists are built with:

```bash
node scripts/build-common-words.mjs --locale en
node scripts/build-common-words.mjs --locale fr
```

The game restricts puzzle start and end words to those common-word endpoint lists, while allowing intermediate ladder words from the full dictionary.

## GitHub Pages Deployment

This repo is configured to deploy automatically to GitHub Pages with GitHub Actions.

1. Push the repository to GitHub.
2. In GitHub, open `Settings -> Pages`.
3. Set the publishing source to `GitHub Actions`.
4. Push to `main`, or run the `Deploy to GitHub Pages` workflow manually.

The Vite `base` path is set automatically:

- `https://<user>.github.io/<repo>/` for a project site
- `https://<user>.github.io/` for a user or org site repo

That means the same code works both locally and on GitHub Pages without hand-editing the config before each deploy.

## Notes

- French mode ignores accents during play and uses normalized five-letter words.
- The built site has no backend requirement.
- The bundle currently includes both English and French datasets eagerly.
