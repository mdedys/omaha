---
name: pr-evidence
description: Produce an Omaha pull request's Proof section before opening or updating the PR. Classifies the change as UX, engine or no behavior change, captures the matching evidence (before and after screenshots from the running app, tests that fail on the base and pass on the branch, the checks), publishes images to a SHA-pinned evidence branch, and writes the Proof markdown that /push-pr puts in the PR body in place of its Visuals section. Use when opening a PR, pushing new commits to one, or when asked for PR evidence or proof.
---

# PR evidence

A reviewer should be able to approve from the PR page without checking out the branch. Proof shows the change doing what the PR claims: the real behavior, captured from this branch's head commit, compared against the base where there is a before. Describing evidence, or saying screenshots were inspected, is not proof.

The output is one markdown block, the `## 🧾 Proof` section. `/push-pr` writes it into the body in place of its `📸 Visuals` section. Run this skill after the branch's last commit and before `/push-pr`, and again whenever new commits change what the proof shows.

## 1. Classify the change

```bash
git diff --name-only <base>...HEAD
```

Use the PR's base: the branch below this one in a stack, otherwise `main`. Each path falls under one change type. A PR can have several, and it gets a subsection for each.

| Change type            | Paths                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| **UX**                 | `src/**` outside `src/engine/`, except `*.test.ts`; `index.html`; `public/**`                       |
| **Engine**             | `src/engine/**` except `*.test.ts`, including the scenario JSON in `src/engine/v1/scenarios/`       |
| **No behavior change** | everything else: tests and `e2e/` alone, `docs/`, `design/`, `.agents/`, `*.md`, config and tooling |

An engine change that shows up on screen, like a new result or a different defender path, is also **UX**. Use the feature map in `.claude/skills/verify-omaha/features/` to find the screens it reaches.

## 2. Capture

Commit everything first. Evidence belongs to the head commit, and a dirty tree captures something nobody can check out.

### UX: screenshots from the running app, before and after

Use the `verify-omaha` skill for launching, driving and cleanup, and follow its proof standards: drive the real player path, by role and accessible name.

- **After:** drive the changed screen and each interaction state the change adds, from this checkout. Do this at phone (390×844) and desktop (1280×800), in light and dark: four drives per state.
- **Before:** for a change to existing UI, run the same steps against the base. Use a worktree of the base, so the base's own scripts serve the base's code:

  ```bash
  git worktree add .worktrees/evidence-base <base>
  VERIFY_RUN_ID=base .worktrees/evidence-base/.claude/skills/verify-omaha/scripts/launch.sh
  VERIFY_RUN_ID=base .worktrees/evidence-base/.claude/skills/verify-omaha/scripts/drive.mjs ...
  VERIFY_RUN_ID=base .worktrees/evidence-base/.claude/skills/verify-omaha/scripts/cleanup.sh
  git worktree remove .worktrees/evidence-base
  ```

  A new screen or state has no before. Say so in the subsection instead of capturing an unrelated screen.

Open every image you publish and check that it shows the claim. A screenshot of the wrong state, a loading frame or a console-error run is not evidence. Copy the chosen shots into one staging folder in your scratchpad, named `<state>-<viewport>-<theme>[-before].png`, for example `break-phone-dark.png` and `break-phone-dark-before.png`.

### Engine: tests that fail on the base and pass on the branch

1. Name the tests that pin the changed behavior: the unit tests and the scenario in `src/engine/v1/scenarios/` that covers it. A behavior change without such a test isn't finished, so write the test first.
2. Run them on the branch: `pnpm vitest run <files>`. They must pass.
3. Run the same test files against the base's source. In the base worktree from above, copy the branch's versions of those test files in and run them. They must fail, and for the reason the PR fixes. A test that passes on the base proves nothing about this change.
4. Keep the failing assertion lines from step 3 and the summary line from step 2.

The simulation is deterministic, so a scenario's outcome on the base against its outcome on the branch is a direct before and after. Quote both outcomes.

### No behavior change

Explain why nothing a player sees changes. Name the checks that show it, such as the tests covering moved or renamed code passing without edits, or `pnpm test:e2e` passing unchanged.

### Checks (always)

Run `pnpm lint`, `pnpm fmt:check`, `pnpm build`, `pnpm test` and `pnpm test:e2e` at the head commit. Record each result with its count. Name pre-existing warnings as pre-existing.

## 3. Publish the images

```bash
.claude/skills/pr-evidence/scripts/publish.sh <staging-folder>
```

The script commits the folder to `pr-evidence/<branch>`, a branch that shares no history with `main`, and pushes it. It prints one raw URL per file, pinned to that commit's SHA. Main never carries the images, and the links keep working after the PR branch and the evidence branch move on. Pass a second argument to name the branch yourself. Republishing parents the new commit on the old one, so earlier links stay valid.

Use only the printed URLs. Local paths, `docs/` copies and links by branch name don't satisfy the evidence rule in `AGENTS.md`.

## 4. Write the Proof section

Keep only the subsections for the change types you found, plus **Checks**, and **Not covered** when it applies. Fill in every placeholder.

````markdown
## 🧾 Proof

Captured from the running app at `<short head sha>`. Before is `<base>` at `<short base sha>`.

### UX

<One line: what each pair shows, and the puzzle, design and steps that reach it.>

**<State name>**

|                          | Before                               | After                               |
| ------------------------ | ------------------------------------ | ----------------------------------- |
| Phone 390×844 · light    | ![<State>, phone light, before](url) | ![<State>, phone light, after](url) |
| Phone 390×844 · dark     | ![…](url)                            | ![…](url)                           |
| Desktop 1280×800 · light | ![…](url)                            | ![…](url)                           |
| Desktop 1280×800 · dark  | ![…](url)                            | ![…](url)                           |

### Engine

<The behavior that changed, in one sentence.>

| Test                                         | On `<base>`                       | On this branch |
| -------------------------------------------- | --------------------------------- | -------------- |
| `src/engine/v1/<file>.test.ts` › <test name> | ❌ <failing assertion, shortened> | ✅             |

<details><summary>Failure on <base></summary>

```text
<the assertion lines from step 3>
```

</details>

### No behavior change

<Why nothing a player sees changes, and the checks that show it.>

### Checks

- `pnpm lint`: passed (<n> pre-existing warnings)
- `pnpm fmt:check`: passed
- `pnpm build`: passed
- `pnpm test`: <n> passed
- `pnpm test:e2e`: <n> passed

### Not covered

<What this evidence does not show, and why. For example, a state Replay can't reach, or a before that couldn't be captured.>
````

For a new screen or state, drop the Before column and use the two-by-two layout: phone light and phone dark in one row, desktop light and desktop dark in the next. Give every image alt text that names the state, viewport and theme, so the proof still reads when images don't load.

## On an existing PR

When new commits change what a capture shows, capture again, republish, and replace the Proof section in the live body (`gh pr view --json body`, then `gh pr edit --body-file`). Leave the rest of the body as the author wrote it. Proof that no longer matches the head commit is worse than none.
