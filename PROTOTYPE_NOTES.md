# Legibility prototype notes

Throwaway branch `prototype/legibility`. The engine (`src/engine/`) runs the
Resolution comments of #4, #9 (with its amendment), #10, #11, #12, #13, #14 and
#15 as decided, with the rule changes Mike made after the first and second
runs (below);
`src/scenarios.ts` holds the ten scenarios; `src/App.tsx` and
`src/Field.tsx` are the viewer.

- `pnpm dev` serves the viewer. Pick a scenario, watch it, then "Skip to end"
  or let it freeze on the dead-ball tick.
- `node scripts/check-engine.ts` runs every scenario twice, fails unless both
  runs are deep-equal, and prints each rep's cause, receiver feedback,
  ball-carrier heading changes and full event log. `--quiet` drops the log.
- `prototype-shots/frozen-{phone,desktop}-light/` holds each scenario's frozen
  frame at the Rep 1 and End tiers (`NN-sXX-rep1.png`, `NN-sXX-end.png`),
  captured with the `verify-omaha` skill.

## Constants used

All in `src/engine/constants.ts`. Distances in yards, times in seconds, speeds
in yards per second.

| Constant                                              | Value                                           | Anchor                            |
| ----------------------------------------------------- | ----------------------------------------------- | --------------------------------- |
| Tick                                                  | 0.05                                            | 0.05                              |
| Engine-error cap                                      | 20                                              | 20 s (#9 amendment)               |
| Contest radius                                        | 1                                               | ≈ 1                               |
| Open separation                                       | 3 (contested 1–3, covered < 1)                  | ≥ 3                               |
| Tackle radius                                         | 1                                               | ≈ 1, never above contest radius   |
| Hold time                                             | 2.5                                             | 2.5–4.5                           |
| Sack radius                                           | 1.5                                             | ≤ 1.5                             |
| Pressure radius                                       | 2                                               | ≈ 2                               |
| QB set depth                                          | 7 (unchanged)                                   | ≈ 7                               |
| QB drop speed                                         | 4 (the 2-yd drop takes 10 ticks, set at 0.50 s) | 4–5, set ≈ 0.5 s from shotgun     |
| Read time                                             | 0.5 (unchanged)                                 | ≈ 0.5                             |
| Ball speed                                            | 25                                              | 20–28, keep 25                    |
| Throwaway lands past the sideline by                  | 1                                               | free                              |
| Rub contact radius                                    | 0.75                                            | ≈ 0.75                            |
| Rub time / rub speed factor                           | 0.6 (12 ticks) / 0.5                            | ≈ 0.6 / ≈ 0.5, cost ≈ 6 ticks     |
| Cut hold                                              | 0.3 (6 ticks)                                   | keep 0.3                          |
| Speeds                                                | WR 6.5 (table below)                            | WR 10 yd past the line in ≈ 1.6 s |
| Reaction delay                                        | 0.3                                             | free                              |
| Break threshold                                       | cos 45°                                         | 45°                               |
| Trail distance                                        | 1                                               | free                              |
| Carry distance                                        | 6                                               | free                              |
| Ball-break radius                                     | 6                                               | free                              |
| Field half-width / numbers inset / boundary margin    | 15.75 / 4 / 1                                   | #4, #10                           |
| Line depth / line split / TE split / slot depth       | 0.5 / 1.5 / 1.5 / 1.5                           | free                              |
| Shotgun depth / RB offset                             | 5 / 1.5                                         | 5 (#4)                            |
| Gap D outside Y / pass-set depth / engage offset      | 0.75 / 1 / 0.7                                  | free                              |
| RB release outside the tackle                         | 1                                               | free                              |
| Slant and Drag break depth / Flat depth / Hitch depth | 2 / 1 / 1                                       | 2 / 1 / 0–1 (#10)                 |
| Hook back, inside / Comeback back, outside            | 2, 1 / 2, 2                                     | #10                               |
| Go/Seam throw point depth                             | 10                                              | 10 (#13)                          |
| Hard break / soft break / speed factor                | 0.15 (3 ticks) / 0.05 (1 tick) / 0.5            | free                              |

Zone ellipses (center x, y; radii x, y), ball on the middle hash:

| Zone                 | Center               | Radii              |
| -------------------- | -------------------- | ------------------ |
| deep-middle          | 0, 15                | 10, 8              |
| deep-half-L / R      | ∓7.875, 15           | 7.875, 8           |
| deep-third-L / M / R | −10.5 / 0 / 10.5, 15 | 5.25, 8            |
| hook-L / M / R       | −5 / 0 / 5, 6.5      | 3.5 / 3 / 3.5, 3.5 |
| curl-flat-L / R      | ∓10, 7               | 3.5, 4             |
| flat-L / R           | ∓13.25, 4            | 2.5, 4             |

Role speeds are average speeds over a route. The WR is set so X or Z on a Go
first reaches 10 yd past the line (y ≥ 10, from y = −0.5) at 1.65 s; 6.25 yd/s
would take until 1.70. Every other role is its earlier speed times 6.5 / 9,
rounded to 0.01, so their ratios are unchanged:

| Role | Earlier | Now  | Earlier × 6.5 / 9 |
| ---- | ------- | ---- | ----------------- |
| WR   | 9       | 6.5  | 6.5               |
| TE   | 8       | 5.78 | 5.778             |
| RB   | 8.5     | 6.14 | 6.139             |
| OL   | 6       | 4.33 | 4.333             |
| CB   | 9       | 6.5  | 6.5               |
| S    | 8.6     | 6.21 | 6.211             |
| LB   | 7.6     | 5.49 | 5.489             |
| DL   | 6.6     | 4.77 | 4.767             |

The QB starts at the 5-yd shotgun depth and sets at 7 yd 0.50 s after the snap.
From under center, starting 1 yd behind the line (just behind the center's 0.5
yd), the same 4 yd/s drop to 7 yd would take 1.50 s.

Every value stays inside its anchor. The hold time sits on the bottom of its
anchor on purpose: see scenario 3. The ball speed stays 25: nothing needed it
changed.

## Rules as changed by Mike

Mike reviewed the first and second runs' findings and changed these rules; the
engine runs them in place of the decided ones where they conflict.

1. **Out of reads.** When the last read's time runs out without a throw, the QB
   looks at every read in the order that is past its throw point and throws to
   the one with the most separation (nearest defender), the earlier read on a
   tie, if it is at least 1 yd. The log writes
   `forced(<letter>, sep X, out-of-reads, t)`. Under 1 yd he throws it away.
2. **Read timing.** Only the QB drop speed, set depth, read time and ball speed
   were tuned (values above).
3. **Cut hold.** After the ball carrier changes heading he keeps the new heading
   for the cut hold before he may change again. A held heading still respects
   the 1-yd boundary margin: on any tick where the next step along it would
   cross the margin, the hold ends and he picks among the headings that stay
   inside (a `cut` is logged when the heading changes).
4. **Hitch.** Mike confirmed the Hitch stays at 0–1 yd (#10); #14's 4-yd
   example is wrong. No engine change.
5. **7-man.** Mike decided the rule text is wrong, not the engine: 7-man covers
   every gap except the D gap on the slide side. No engine change.
6. **Interception ("got there first").** On the arrival tick, the nearest
   defender within the contest radius intercepts if he broke on the ball and,
   on the tick before arrival, was strictly nearer the catch point than the
   receiver was (a tie is a breakup); otherwise it is a breakup. There is no
   front/behind test.
   - _Superseded:_ rule 6's first version compared both distances on the
     arrival tick, where the receiver is always on the catch point, so it could
     never fire (see "Interceptions couldn't happen" below). The engine no
     longer has it.
7. **Rub.** A man defender whose chase step would pass within the rub contact
   radius of another route runner steers around him instead of stopping, and
   rejoins his chase. The log writes `rubbed(<defender>, by <letter>, t)` on
   the first tick of the detour. From that tick, for the rub time, he moves at
   the rub speed factor times his role speed (steering around the runner while
   his step would still pass within the radius), then returns to full speed.
8. **Speeds.** Role speeds are average speeds over a route, anchored on a WR
   reaching 10 yd past the line in about 1.6 s, with every other role scaled by
   the same ratio. The QB drops at a realistic 4 yd/s. No rule changed with the
   speeds.
9. **Flicker.** Mike accepts one pursuer-forced jog and a return upfield. A
   flicker is 3 or more heading changes within any 1.0-s window (below).

A forced throw that is broken up or intercepted ends `breakup-forced` /
`interception-forced` whether pressure or running out of reads forced it; the
cause line says which ("pressure forced a contested throw to Y" or "out of
reads, the QB forced the throw to Z").

## Scenario results

`node scripts/check-engine.ts` reports all ten deep-equal across two runs and
all ten matching what was expected. Times are seconds after the snap, quoted
from the event log.

| #   | Scenario                           | Coverage | Expected                                         | Actual cause                                                                                                                     |
| --- | ---------------------------------- | -------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Free rusher off the far edge       | Cover 1  | `sack-free-rusher`, edge rusher decisive         | `sack-free-rusher`, S2 (from R-D), 1.65                                                                                          |
| 2   | A-gap blitz against man protection | Cover 1  | RB picks up the blitzer, a double shows          | `pickup(RB on LB1)`, `double(LG helps C on DL2)`, `double(RG helps RT on DL3)`; ends `breakup-forced` (pressure), LB2 on Y, 4.05 |
| 3   | Hold-time sack                     | Cover 3  | `sack-beat-block`                                | `sack-beat-block`, DL3, 3.45                                                                                                     |
| 4   | Second read open                   | Cover 3  | throw to the second read, `converted` or `short` | `read-next(X → Z)` and `throw(Z, sep 6.3)` at 1.35; `short`, NB tackles at 5.0 yd                                                |
| 5   | Whole read order covered           | Cover 1  | `throwaway`                                      | `throwaway` at 2.65, lands 3.35                                                                                                  |
| 6   | Breakup by a disguised defender    | Cover 3  | `breakup-closed`, the safety decisive            | `throw(H, sep 3.1)` at 3.05; `breakup(S2 on H)` at 4.00                                                                          |
| 7   | Undercut interception              | Cover 2  | `interception-closed`                            | `throw(Y, sep 3.2)` at 2.30; `defender-react(S2, throw)` at 2.60; `interception(S2 on Y)` at 3.40                                |
| 8   | Hitch against an off corner        | Cover 1  | cuts 45° inside; `converted` or `short`          | `throw(Z, sep 4.1)` at 0.55; `cut(Z, inside)` at 1.20; `short`, CB2 tackles at 1.7 yd                                            |
| 9   | Rub                                | Cover 1  | `rubbed` and the crosser open                    | `rubbed(LB1, by X, 2.00s)`; Y's badge open (3.0 yd at 2.25); ends `breakup-closed`, NB on H                                      |
| 10  | Zone choice and carry              | Cover 3  | `zone-choose` and a seam carried                 | `zone-choose(LB2, Z over H)` at 1.90, `carry(S1, Y)` at 2.35; ends `interception-closed`, S1 on Z                                |

Scenario notes:

- **1.** DL4 sits in R-B so the right tackle owns him; the two extra rushers are
  LB2 (R-C) and S2 (R-D). Protection is 6-man slide left: the RB owns R-C and
  R-D and takes the inner one (LB2), so S2 comes free. Under 5-man slide left
  both edge gaps would be unowned and both rushers free. I used 6-man so
  exactly one rusher, the one off the far edge, comes free; strictly he is
  "owned by a busy back", not "unowned". Both read as `sack-free-rusher`. At
  the slower speeds S2 arrives at 1.65, after the QB has set.
- **2.** 3-DL front: DL1 in the LT's area, DL2 over the center, DL3 in the RT's
  area. LB1 rushes L-A. Both guards are idle, so both double. The RB, the only
  back, picks up LB1 as the first leftover inside-out. LB1, released at the hold
  time, pressures at 3.20 and the QB forces the contested third read.
- **3.** See "Hold-time sack" below.
- **4.** The first read X (In 5) is contested, never 3 yd clear, so the QB moves
  to Z's Hitch at 1.35 and throws at once. The non-target who was open while
  throwable and looks covered on the frozen frame is H (Wheel): open 6.2 yd at
  1.00, 0.95 yd from a defender on the dead-ball tick.
- **5.** Both reads, X and Z on Go routes against man, are under 1 yd on the
  snapshot when the QB runs out of reads at 2.65, so he throws it away.
- **6.** S2 lines up at 12 yd over the middle with `zone curl-flat-R` and
  travels about 9 yd to his landmark. H is 3.1 yd clear at the throw; S2
  reaches the catch point and stands on it, so the catch is broken up. On the
  tick before arrival S2 is 0.677 yd from the catch point and H is already on
  it, so H got there first: a breakup, not an interception.
- **7.** Y's Seam is the second read, 3.2 yd clear at 2.30. S2 (deep half
  right), carrying Z, is within the ball-break radius and breaks on the ball.
  On the tick before arrival (3.35) S2 is 0.000 yd from the catch point and Y
  0.289 yd; on arrival both are 0.000. S2 got there first: an interception.
- **8.** The off corner (CB2) lines up 5 yd deep and 1 yd outside Z. The Hitch
  is caught at 1 yd and Z cuts inside at once.
- **9.** Y and X run Drags at 2 yd in opposite directions. LB1 presses Y with a
  0.5-yd cushion, so his chase passes within 0.75 yd of X where they cross.
  The QB hits the first read H; the rub shows in the log and in Y's open
  badge. See "Rub cost" below.
- **10.** LB2 (hook-R) locks Y as Y's seam passes through his zone, and has to
  choose when Y leaves it with Z (Slant) and H (In 5) both inside. S1 (deep
  third middle) then carries Y, breaks on the throw to Z and gets to the catch
  point first (0.000 yd against Z's 0.325 on the tick before arrival).

### Re-shapes

Only scenarios' own designs and defenses changed, in `src/scenarios.ts`; no
engine or constant changed for a scenario, and no expected cause or `met` check
was loosened. The second run's re-shapes of scenarios 5 and 9 stay as they
were; 4 and 6 are re-shaped again here.

- **4.** H In 5 → Wheel, read order Y, Z, X → X, Z, Y (the original order).
  Under Y, Z, X at the slower speeds no receiver who was open while throwable
  ends within 1 yd of a defender on the frozen frame. Reading X (In 5) first,
  Z second, and sending H on a Wheel gives a covered-looking H who was open.
- **6.** Read order Z, H, Y → Z, X, H. At the slower speeds H's Out 10 is not
  3 yd clear while it is the second read, and the QB threw the third read Y
  (`converted`). Reading X second moves H to third, where he is 3.1 yd clear
  and S2 still closes.
- **8.** CB2's depth 7.5 → 5 (still 1 yd outside Z, in front of him). The Hitch
  is now thrown at 0.55 and caught at 1.15; with the corner 8 yd off, Z's first
  cut went outside (away from the corner) and the carrier never cut inside. At
  5 yd off the corner takes the outside away and Z cuts inside.
- **7** needs no re-shape: under rule 6's "got there first" test its own design
  intercepts (on Y, the second read, instead of the first read X's Slant).

Designs were found by hand and with a small search script over routes, read
orders and the corner's spot. No scenario has a branch in the engine; the
engine never reads a scenario name or a coverage name.

The viewer's expected text still states each scenario's target.

## Read timing and time to throw

The QB sets 0.50 s after the snap and decides from the next tick, so most first
reads open when their receiver reaches his throw point. A Go or Seam's throw
point is 10 yd downfield; a Hook 10's is the settle point 2 yd back.

First reads that are 10-yd routes, and when they became throwable:

| #   | First read | Throwable at | Source                                       |
| --- | ---------- | ------------ | -------------------------------------------- |
| 1   | X Hook 10  | 2.10         | sacked at 1.65, before it opened             |
| 2   | H Hook 10  | 2.25         | `read-next(H → X)` at 2.75, one read time on |
| 5   | X Go       | 1.65         | `read-next(X → Z)` at 2.15                   |
| 6   | Z Go       | 1.65         | `read-next(Z → X)` at 2.15                   |
| 9   | H Hook 10  | 2.25         | thrown at 2.25                               |
| 10  | X Hook 10  | 2.10         | `read-next(X → Z)` at 2.60                   |

The 1.8–2.0-s target falls between them: a Go's throw point opens at 1.65 and
a Hook 10's at 2.10 (X, from the line) or 2.25 (H, from the slot's 1.5 yd).
Neither is met; I left it, as asked.

Throw times of every throw to a receiver (throwaways excluded):

| #   | Throw                                | Time |
| --- | ------------------------------------ | ---- |
| 2   | Y, third read, forced under pressure | 3.25 |
| 4   | Z, second read (Hitch)               | 1.35 |
| 6   | H, third read                        | 3.05 |
| 7   | Y, second read                       | 2.30 |
| 8   | Z, first read (Hitch)                | 0.55 |
| 9   | H, first read                        | 2.25 |
| 10  | Z, second read                       | 2.60 |

The mean is 2.19 s over seven throws, under the 2.5–2.8-s target. The two
Hitches (0.55 and 1.35) pull it down; without them it is 2.69.

## Hold-time sack

Scenario 3's cause at each hold time, run on copies of the engine with only the
hold time changed (the committed value stays 2.5):

| Hold time | Cause                                                                       |
| --------- | --------------------------------------------------------------------------- |
| 2.50      | `sack-beat-block`, DL3, 3.45                                                |
| 2.75      | `sack-beat-block`, DL3, 3.70                                                |
| 3.00      | `breakup-forced`, CB2 on Z, after `forced(Z, sep 1.6, out-of-reads, 3.90s)` |
| 3.25      | same as 3.00                                                                |
| 3.50      | same as 3.00                                                                |
| 3.75      | same as 3.00                                                                |
| 4.00      | same as 3.00                                                                |
| 4.25      | same as 3.00                                                                |
| 4.50      | same as 3.00                                                                |

Only 2.5 and 2.75 give `sack-beat-block`. Scenario 3's three reads (Z Corner
15, H Hook 10, X Hook 10) open at 2.40, 2.90 and 3.40, so the QB runs out of
reads at 3.90. A blocked rusher released at the hold time needs about 0.95 s
to reach him at the slower speeds, so 3.0 s is the smallest hold time in the
sweep at which the three-read order runs out of reads before the hold-time
sack; from there on he forces Z (1.6 yd).

## Ball carrier heading changes

Counted from `cut` events (one per heading change, the first one measured
against straight upfield). A flicker is 3 or more heading changes within any
1.0-s window; the window is a fixed 1.0 s, not derived from the cut hold.
`scripts/check-engine.ts` counts one flicker for every heading change that comes
no more than 1.0 s after the heading change two before it. One pursuer-forced
jog and a return upfield is two changes and not a flicker.

| #   | Heading changes                      | Flickers |
| --- | ------------------------------------ | -------- |
| 4   | 2 (outside at 2.00, upfield at 2.30) | 0        |
| 8   | 1 (inside at 1.20)                   | 0        |

Only scenarios 4 and 8 end in a catch now; 9 and 10 end in a breakup and an
interception.

### Boundary probe

A held heading now ends when its next step would cross the 1-yd margin
(14.75 yd from the middle). Run on engine copies with the cut hold at 0.6 s
(the committed value stays 0.3), the largest |x| any ball carrier reached:

| #   | c385218's engine        | This engine | c385218's engine with only the boundary fix |
| --- | ----------------------- | ----------- | ------------------------------------------- |
| 4   | **15.57** (past margin) | 14.51       | 14.61                                       |
| 8   | 11.75                   | 11.75       | 11.75                                       |
| 9   | 14.15                   | no catch    | 14.15                                       |
| 10  | 13.94                   | no catch    | 13.94                                       |

The other scenarios have no ball carrier on either engine. c385218's engine
crossed the margin at 0.6 s: scenario 4's carrier held `outside` from 3.10 to
3.70 and reached 15.57. This engine's scenarios stay inside, but at the slower
speeds its scenario 4 carrier never reaches the margin (it holds `outside` the
full 0.6 s, from 2.00 to 2.60), so on its own scenarios the probe doesn't
exercise the fix. The third column runs c385218's engine and scenarios with only
the fix applied: the hold ends at 3.55, a `cut(Z, upfield)` is logged, and the
carrier stops at 14.61.

### Rub cost

Scenario 9's LB1 against an engine copy with the rub radius at 0 (no rub), from
the end of the rub time (2.60) to the end of the play (2.95): on every tick LB1
stands 1.67 yd from the no-rub LB1, nearest the spot the no-rub LB1 held 6 ticks
earlier (within 0.05 yd). The freeze cost 6 ticks and 2.3 yd at the old speeds;
the slowdown costs the same 6 ticks but 1.67 yd, because 6 ticks at the scaled
LB speed (5.49) cover less ground. Without the rub Y is contested (2.5 yd); with
it his badge is open (3.0 yd at the throw, 2.25), so the rub is what opens the
crosser.

## Ambiguities and how I read them

- **Hitch depth.** Settled by Mike: 0–1 yd. I use 1 yd.
- **Man cushion.** The cushion shrinks by how far upfield the receiver has gone,
  measured as his furthest progress, so it never regrows when a Hook or
  Comeback comes back toward the line. A cushion already at or under the trail
  distance (press) stays as it is. A receiver who sits is closed to trail
  distance by that rule alone; stopping is not treated as a break. The trail
  distance is how far the defender stays deeper than the receiver.
- **Break detection.** A corner can fall between two ticks, so the receiver's
  heading is compared with the heading the defender last reacted to, not with
  the previous tick's. During the reaction delay the defender keeps his own
  last step's direction.
- **Zone reactions.** Every change of an underneath defender's target (a
  receiver entering, a choice, a receiver leaving) waits one reaction delay,
  during which he keeps aiming at his previous point. `zone-choose` is written
  whenever he picks among two or more.
- **Zones from the snap.** An underneath defender plays a receiver in his zone
  as soon as there is one, even before he reaches his landmark.
- **Carry.** A receiver is a deep threat when he is inside the deep ellipse and
  no more than the carry distance shallower than the defender. A carry starts
  after the reaction delay, uses the man chase (including break reactions,
  from the leverage and cushion at the carry's start) and is never rubbed. No
  carry starts after the throw; one already running keeps going (see below).
- **Breaking on the ball.** Checked once, on the throw tick plus the reaction
  delay, against each defender's distance to the catch point. Rushers never
  break on the ball. A defender who breaks runs to the catch point and stops
  there.
- **Interception "got there first".** Strictly nearer: on the tick before
  arrival (the previous snapshot) the defender's distance to the catch point is
  compared with the receiver's, and a tie is a breakup. The contest itself (who
  is the nearest defender within the contest radius) is still decided on the
  arrival tick.
- **Out of reads.** "That tick's snapshot" is the previous tick's, the one the
  QB decides every throw from. A read is past its throw point once he has
  reached it on that snapshot. Pressure doesn't change the choice. A ball he
  forces to an open receiver (3 yd or more) is still logged as forced.
- **Rub detour.** A man defender's intended step is checked against every
  other route runner's position on the previous snapshot. If it passes within
  the rub radius, he heads for the tangent point of that runner's rub circle on
  the side nearer his chase target (left on a tie), with his normal step
  length; already inside the circle, he steps straight along the tangent.
  `rubbed` is written when a detour starts or switches to another runner, so a
  runner can rub the same defender again on a later crossing; each `rubbed`
  restarts the rub time. The detour check uses his full step; while the rub
  time runs his step is the rub speed factor times that. A defender who breaks
  on the ball stops being a man defender and drops the slowdown.
- **Cut hold.** It counts from the tick of the cut. The upfield heading the
  carrier takes on the catch isn't a cut, so his first cut is never held back.
  A held heading ends early on any tick where the next step along it would put
  him past the boundary margin; he then picks among the headings that stay
  inside, the same way as after a hold.
- **Protection geometry.** The side without Y spaces its C and D gaps as if Y
  were attached there. A blocked rusher stops at his gap 1 yd behind the line
  whether or not his blocker has arrived; his blocker stands 0.7 yd behind him,
  a helper 0.7 yd to the side. The hold time counts from the snap.
- **Double teams.** Idle linemen pick from the center out (LG before RG), and
  only linemen are helped. A lineman whose DL drops is idle.
- **Hug rush** is built (it fires at the reaction delay; the kept-in receiver
  picks him up if he has nobody), but no scenario has a man defender on a
  kept-in receiver, so it never fires.
- **Read clock.** A read's window is the 10 ticks from its start, deciding from
  the previous tick's snapshot. Pressure lowers the bar for the rest of the
  play. The QB is set 0.50 s after the snap.
- **Catch point.** The first future tick on the receiver's own track where the
  ball, at full speed, could already be there. The ball may wait at the point
  for less than one tick.
- **Throwaway.** From the middle (x = 0) the QB throws to the right sideline.
  The rep ends when the ball lands.
- **Free run.** Each defender is raced to within the tackle radius of the path,
  at role speed, straight from his current spot, including blocked linemen.
  A heading's run is capped at the boundary margin; a heading with less than
  one step of room is dropped.
- **Pursuit** starts on the catch tick for defenders who broke on the ball and
  one reaction delay later for everyone else, rushers and blocked linemen
  included.
- **Out of bounds** is never checked: routes stop 1 yd inside the lines and the
  carrier drops any heading that would cross the margin, held or not.
- **Role speeds.** Rounded to 0.01 yd/s. The WR anchor is measured from his
  alignment 0.5 yd behind the line to y = 10, the Go's throw point.
- **Under-center figure.** Start depth 1 yd behind the line; the engine has no
  under-center alignment, so this is arithmetic, not a run.
- **Viewer.** Defense art shows only on the dead-ball frame. A man defender's art
  is his track plus a dashed line from his look spot to his receiver's
  alignment; a zone defender's is the ellipse plus a drop line to the landmark;
  a rusher's is his track (orange when he is not a DL). Block lines join each
  blocker and rusher on the hold-release tick, or the last tick. Offense block
  art is the slide arrow plus a T from each kept-in back (the RB to the far C
  gap on a slide, straight up on man; Y to his D gap). Defenders carry their
  names, which DESIGN.md leaves off, so the cause line's "S2" can be found on
  the field. The scenario list shows each coverage name at every tier because
  the task asks for it there.

## Findings: rules that contradict themselves or couldn't be built as written

- **Interceptions couldn't happen (resolved by rule 6's "got there first").**
  Under rule 6's first version both distances were measured on the arrival
  tick, where the receiver is always exactly on the ball, so every contested
  arrival was a breakup. Measured on the tick before arrival, a defender
  standing on the catch point before the receiver gets there now intercepts:
  scenarios 7 and 10. A receiver already sitting on the point (a Hook,
  scenarios 2 and 9) ties at 0.000 and the ball is broken up.
- **The rub cost can't be both 2.3 yd and 6 ticks.** At the scaled speeds 6
  ticks of LB ground is about 1.6 yd. I tuned for the ticks (6, with rub time
  0.6 and factor 0.5); the yards come out at 1.67 (see "Rub cost").
- **The cut hold can't stop the return.** Measured in the second run at the old
  speeds: scenario 10's carrier went back upfield the first tick the hold let
  him for every hold from 0.05 to 2.0 s. Under the 1.0-s three-change flicker
  definition that one jog and return is not a flicker. No carrier here
  flickers now.
- **A held heading crossed the boundary margin (fixed).** The heading race
  dropped headings that would cross the margin, but a held heading skipped the
  race. At a 0.6-s hold, c385218's scenario 4 carrier reached 15.57 yd from the
  middle, past the 14.75 margin. A held heading now ends at the margin (see
  "Boundary probe").
- **A three-read order still outlasts the 2.5-s hold time.** With the QB set at
  0.50 and slower receivers, scenario 3's reads open at 2.40, 2.90 and 3.40 and
  he runs out at 3.90, while a rusher released at 2.5 sacks at 3.45. ADR 0005
  says a sack never comes from the QB waiting on covered receivers and that he
  throws away instead of forcing; both are still out of date.
- **Carry "until the throw"** (#11) doesn't say what the deep defender does
  next. Going back to his landmark mid-flight looked wrong, so a carry already
  running continues, and only new carries stop at the throw.
- **Time to throw misses both targets.** The mean throw time is 2.19 s against
  2.5–2.8, pulled down by the two Hitches (0.55 and 1.35); a Go first read
  opens at 1.65 and a Hook 10 at 2.10–2.25, either side of the 1.8–2.0 target.
  Not chased, as asked.
- **Quick game is very quick.** With the QB set at 0.50, scenario 8's Hitch
  leaves at 0.55 and is caught at 1.15, before most defenders have moved far.
  That is why its 8-yd corner had to come up to 5 yd for Z to cut inside.
- **Long leads.** At 25 yd/s scenario 10's throw to Z on a Slant flies 0.95 s
  (2.60 to 3.55), and S1, carrying the seam, gets there first.

## Things worth looking at live

- Scenario 4: H's open badge at his best moment against a defender 0.95 yd from
  him on the frozen frame. Turn on "Best-moment ghosts" to compare.
- Scenario 7: S2 standing on the catch point before Y gets there, called an
  interception; compare scenario 9, where H is already sitting on the point
  and NB's arrival is a breakup.
- Scenario 9: LB1 at half speed for 0.6 s after X crosses him at 2.00.
- Scenario 8: the whole play is over by 1.30.
- Overall pace: every player now moves at average route speed, about 70% of
  before.
- Scenario 6: the cause line says S2 closed, but at Rep 1 his path from 12 yd is
  hidden; only the ring and the replay show where he came from.
- Scenario 3 against scenario 5: the same covered reads end in a sack with
  three reads and in a throwaway with two.
