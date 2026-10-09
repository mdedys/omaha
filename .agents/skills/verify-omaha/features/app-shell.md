# App shell

The shell opens Landing at `/`, follows the system theme and navigates between four URLs without replacing the browser document. All screens except Landing remain explicitly labelled placeholders.

## Sub-features

- `shell-load`: `/` renders Landing with document title `omaha` and no console errors.
- `shell-navigation`: Landing links open `/puzzles`, `/how-to-play` and `/puzzle/<n>`; browser Back and Forward traverse those same-document entries.
- `shell-direct-entry`: direct entry at each placeholder route works; an unknown route renders Landing.
- `shell-theme`: system light and dark preferences select cream (#F4EFE4) and charcoal (#18201C) paper surfaces. Field and CTA colors stay unchanged.

## How to get to it (user POV)

- Open `/` on phone or desktop.
- Follow Landing's links, or open one of the four URLs directly.

## Driving it with drive.mjs

Precondition: `doctor.sh` exits `0`.

- **Load:** `drive.mjs shell expect-title=omaha expect-role=heading:Omaha expect-role=link:"Play today's puzzle" shot=landing`.
- **Navigation:** `drive.mjs shell-nav expect-role=link:"Play today's puzzle" shot=before click=link:"Play today's puzzle" expect="This screen is not available yet." shot=destination click=link:"Back to Landing" expect-role=heading:Omaha shot=returned`.
- **Direct entry:** separate drives with `goto=/puzzles expect-role=heading:"All puzzles"`, `goto=/how-to-play expect-role=heading:"How to play"`, `goto=/puzzle/2 expect-role=heading:"Puzzle #2"`, and `goto=/unknown expect-role=heading:Omaha`.
- **Theme/layout:** repeat load with `--viewport phone` / `--viewport desktop` and `--theme light` / `--theme dark`. Capture the whole Landing composition.
- The Playwright suite (`pnpm test:e2e`) additionally asserts the URLs, document continuity and browser Back/Forward, which drive.mjs does not expose as steps.

## Gotchas

- React StrictMode cancels the first development fetch before starting the active request.
- Static deployment needs an index.html fallback for SPA paths, but must still serve JSON and font assets as files.
- Placeholder destinations do not prove Protect controls, Puzzles or Tutorial behavior.
