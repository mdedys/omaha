#!/usr/bin/env node
// Drives the running app in headless Chromium and writes evidence for one scenario.
// Usage: drive.mjs <scenario> [--viewport phone|desktop] [--theme light|dark] [step ...]
// Steps run in order in one browser context, so local storage carries between them:
//   goto=/path               navigate (relative to the server URL)
//   click=<role>:<name>      click the element with that ARIA role and accessible name
//   press=<key>              keyboard press, e.g. Enter, ArrowLeft, 5
//   expect=<text>            text is visible
//   expect-role=<role>:<name> element with that role and name is visible
//   expect-title=<text>      document title equals text
//   storage=<key>            log localStorage[key] into the transcript
//   wait=<ms>                pause (for animations; prefer an expect step)
//   shot=<label>             full-page screenshot
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = execFileSync(
  "git",
  ["-C", scriptDir, "rev-parse", "--show-toplevel"],
  { encoding: "utf8" },
).trim();
const { chromium } = createRequire(join(repoRoot, "package.json"))(
  "playwright",
);

const VIEWPORTS = {
  phone: { width: 390, height: 844 },
  desktop: { width: 1280, height: 800 },
};

const args = process.argv.slice(2);
const scenario = args.shift();
if (!scenario || scenario.startsWith("-")) {
  console.error(
    "usage: drive.mjs <scenario> [--viewport phone|desktop] [--theme light|dark] [step ...]",
  );
  process.exit(2);
}
let viewport = "phone";
let theme = "light";
const steps = [];
while (args.length) {
  const arg = args.shift();
  if (arg === "--viewport") viewport = args.shift();
  else if (arg === "--theme") theme = args.shift();
  else steps.push(arg);
}
if (!VIEWPORTS[viewport]) throw new Error(`unknown viewport ${viewport}`);

const runId = process.env.VERIFY_RUN_ID || "local";
const runDir = join(process.env.TMPDIR || "/tmp", "omaha-verify", runId);
const baseUrl = readFileSync(join(runDir, "state", "url"), "utf8").trim();
const evidenceRoot =
  process.env.VERIFY_EVIDENCE_DIR || join(runDir, "evidence");
const outDir = join(evidenceRoot, `${scenario}-${viewport}-${theme}`);
mkdirSync(outDir, { recursive: true });

const transcript = [];
const consoleLines = [];
let shotIndex = 0;
const log = (entry) => {
  transcript.push({ at: new Date().toISOString(), ...entry });
  console.log(
    `${entry.ok === false ? "FAIL" : "ok  "}  ${entry.step}${entry.detail ? `  ${entry.detail}` : ""}`,
  );
};
const splitRoleName = (value) => {
  const i = value.indexOf(":");
  return [value.slice(0, i), value.slice(i + 1)];
};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORTS[viewport],
  colorScheme: theme,
  hasTouch: viewport === "phone",
});
const page = await context.newPage();
page.on("console", (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => consoleLines.push(`[pageerror] ${err.message}`));

const shot = async (label) => {
  const file = `${String(shotIndex++).padStart(2, "0")}-${label}.png`;
  await page.screenshot({ path: join(outDir, file), fullPage: true });
  return file;
};

const actions = {
  goto: (v) =>
    page.goto(new URL(v, baseUrl).href, { waitUntil: "networkidle" }),
  click: (v) => {
    const [role, name] = splitRoleName(v);
    return page.getByRole(role, { name }).click();
  },
  press: (v) => page.keyboard.press(v),
  expect: (v) =>
    page.getByText(v).first().waitFor({ state: "visible", timeout: 5000 }),
  "expect-role": (v) => {
    const [role, name] = splitRoleName(v);
    return page
      .getByRole(role, { name })
      .first()
      .waitFor({ state: "visible", timeout: 5000 });
  },
  "expect-title": async (v) => {
    const title = await page.title();
    if (title !== v) throw new Error(`title is "${title}"`);
  },
  storage: async (v) =>
    JSON.stringify(await page.evaluate((k) => localStorage.getItem(k), v)),
  wait: (v) => page.waitForTimeout(Number(v)),
  shot,
};

let failed = false;
try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  log({ step: `open ${baseUrl}`, detail: await shot("loaded") });
  for (const step of steps) {
    const eq = step.indexOf("=");
    const [kind, value] = [step.slice(0, eq), step.slice(eq + 1)];
    if (!actions[kind]) throw new Error(`unknown step "${step}"`);
    try {
      const result = await actions[kind](value);
      log({ step, detail: typeof result === "string" ? result : undefined });
    } catch (err) {
      failed = true;
      log({ step, ok: false, detail: err.message.split("\n")[0] });
      break;
    }
  }
} finally {
  log({ step: "final state", detail: await shot("final") });
  writeFileSync(
    join(outDir, "aria.yml"),
    await page.locator("body").ariaSnapshot(),
  );
  writeFileSync(join(outDir, "console.log"), consoleLines.join("\n") + "\n");
  writeFileSync(
    join(outDir, "transcript.json"),
    JSON.stringify(
      { scenario, viewport, theme, baseUrl, steps, transcript },
      null,
      2,
    ),
  );
  await browser.close();
}

const errors = consoleLines.filter(
  (l) => l.startsWith("[error]") || l.startsWith("[pageerror]"),
);
if (errors.length) {
  failed = true;
  console.log(`FAIL  ${errors.length} console error(s), see console.log`);
}
console.log(`evidence: ${outDir}`);
process.exit(failed ? 1 : 0);
