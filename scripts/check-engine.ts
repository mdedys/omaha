// Runs every scenario twice, fails unless both runs are deep-equal, and
// prints each rep's cause, receiver feedback, ball-carrier cuts and event log.
// Usage: node scripts/check-engine.ts [--quiet]
import { deepStrictEqual } from "node:assert/strict";
import { simulate } from "../src/engine/simulate.ts";
import { formatEvent, seconds } from "../src/format.ts";
import { SCENARIOS } from "../src/scenarios.ts";

const quiet = process.argv.includes("--quiet");
const FLICKER_WINDOW = 5;
let unmet = 0;

SCENARIOS.forEach((scenario, i) => {
  const rep = simulate(scenario.defense, scenario.design);
  deepStrictEqual(simulate(scenario.defense, scenario.design), rep);
  const met = scenario.met(rep, scenario.defense);
  if (!met) unmet++;
  const { code, decisive, thrownTo } = rep.cause;
  console.log(
    `\n${i + 1}. ${scenario.name} [${met ? "as expected" : "DIFFERS"}]` +
      `\n   expected: ${scenario.expected}` +
      `\n   actual:   ${code}, decisive ${decisive ?? "none"}, thrown to ${thrownTo ?? "none"}, ends ${seconds(rep.lastTick)}`,
  );
  console.log(
    "   feedback: " +
      rep.feedback
        .map(
          (f) =>
            `${f.letter} ${f.badge} ${f.separation.toFixed(1)} @${seconds(f.tick)}`,
        )
        .join(" | "),
  );
  const cuts = rep.events.filter((e) => e.kind === "cut");
  if (rep.carrier) {
    const flickers = cuts.filter(
      (c, k) =>
        k >= 2 &&
        c.kind === "cut" &&
        cuts[k - 2].kind === "cut" &&
        cuts[k - 2].heading === c.heading &&
        c.tick - cuts[k - 2].tick <= FLICKER_WINDOW,
    ).length;
    console.log(
      `   carrier: ${cuts.length} heading change(s), ${flickers} flicker(s)`,
    );
  }
  if (!quiet) {
    for (const e of rep.events) {
      console.log(`   ${seconds(e.tick).padStart(6)}  ${formatEvent(e)}`);
    }
  }
});

console.log(
  `\nAll ${SCENARIOS.length} scenarios deep-equal across two runs; ${unmet} differ from expected.`,
);
