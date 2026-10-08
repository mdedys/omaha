// Runs every scenario twice, fails unless both runs are deep-equal, and
// prints each rep's cause, receiver feedback, ball-carrier cuts and event log.
// Usage: node scripts/check-engine.ts [--quiet]
import { deepStrictEqual } from "node:assert/strict";
import { toTicks } from "../src/engine/constants.ts";
import { simulate } from "../src/engine/simulate.ts";
import { formatEvent, seconds } from "../src/format.ts";
import { SCENARIOS } from "../src/scenarios.ts";

const quiet = process.argv.includes("--quiet");
// A flicker is three heading changes within this many ticks: every change that
// comes no later than this after the change two before it counts once.
const FLICKER_WINDOW = toTicks(1);
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
  const cuts = rep.events.flatMap((e) => (e.kind === "cut" ? [e] : []));
  if (rep.carrier) {
    const flickers = cuts.filter(
      (c, k) => k >= 2 && c.tick - cuts[k - 2].tick <= FLICKER_WINDOW,
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
