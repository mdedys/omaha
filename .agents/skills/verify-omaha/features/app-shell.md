# App shell

**Status:** Live. Today the root URL serves the stock Vite + React starter page. T01 replaces it with Omaha's routed scaffold, and T02 adds the Omaha themes. When T01 lands, rewrite the sub-features below to fit the scaffold.

The shell is what a player gets on opening the site: the document titled `omaha`, a React app mounted in `#root`, a page that follows the system light or dark preference, and an interactive UI with no console errors.

## Sub-features

- `shell-load` means `/` renders the React app with the title `omaha` and no console errors.
- `shell-interactive` means a click changes rendered state. Today that is the starter's `Count is N` button.
- `shell-theme` means the page background follows `prefers-color-scheme`: today `#fff` in light and `#16171d` in dark.

## How to get to it (user POV)

- Open the site root `/` in a phone or desktop browser.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`.

- **Load (light).** Open `/`. Run `drive.mjs shell expect-title=omaha expect-role=heading:"Get started"`. Both steps say `ok`, `00-loaded.png` shows the starter hero, and `console.log` has no `[error]` or `[pageerror]` lines.
- **Interact.** Click the counter. Add `click=button:"Count is 0" expect="Count is 1" shot=clicked` to the same drive. `aria.yml` shows `button "Count is 1"`.
- **Dark theme.** Repeat with `--theme dark`. Run `drive.mjs shell --theme dark expect-title=omaha shot=dark`. The screenshot background is near-black (`#16171d`), not white.
- **Desktop.** Repeat with `--viewport desktop`. The two-column "Documentation" and "Connect with us" section renders side by side.

## Gotchas

- The starter links to external sites (vite.dev, GitHub). Don't click them: they leave the app and need the network.
- React `StrictMode` double-invokes effects in dev. A side effect seen twice in `console.log` may be StrictMode, not a bug.
- This whole file describes throwaway starter content. If `/` no longer shows "Get started", the scaffold has landed and this file is stale.
