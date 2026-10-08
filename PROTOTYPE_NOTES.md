# Legibility prototype notes

Throwaway branch `prototype/legibility`. The engine (`src/engine/`) runs the
Resolution comments of #4, #9 (with its amendment), #10, #11, #12, #13, #14 and
#15 as decided; `src/scenarios.ts` holds the ten scenarios; `src/App.tsx` and
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

| Constant                                              | Value                                                 | Anchor                          |
| ----------------------------------------------------- | ----------------------------------------------------- | ------------------------------- |
| Tick                                                  | 0.05                                                  | 0.05                            |
| Engine-error cap                                      | 20                                                    | 20 s (#9 amendment)             |
| Contest radius                                        | 1                                                     | ≈ 1                             |
| Open separation                                       | 3 (contested 1–3, covered < 1)                        | ≥ 3                             |
| Tackle radius                                         | 1                                                     | ≈ 1, never above contest radius |
| Hold time                                             | 2.5                                                   | 2.5–4.5                         |
| Sack radius                                           | 1.5                                                   | ≤ 1.5                           |
| Pressure radius                                       | 2                                                     | ≈ 2                             |
| QB set depth                                          | 7                                                     | ≈ 7                             |
| QB drop speed                                         | 4 (shotgun shuffle of 2 yd takes 0.5 s)               | free                            |
| Read time                                             | 0.5                                                   | ≈ 0.5                           |
| Ball speed                                            | 20                                                    | ≈ 20 (I used 20, not 25–28)     |
| Throwaway lands past the sideline by                  | 1                                                     | free                            |
| Rub contact radius                                    | 0.75                                                  | ≈ 0.75                          |
| Rub cost                                              | 0.3 (6 ticks)                                         | free                            |
| Speeds                                                | WR 9, TE 8, RB 8.5, OL 6, CB 9, S 8.6, LB 7.6, DL 6.6 | WR ≈ 9                          |
| Reaction delay                                        | 0.3                                                   | free                            |
| Break threshold                                       | cos 45°                                               | 45°                             |
| Trail distance                                        | 1                                                     | free                            |
| Carry distance                                        | 6                                                     | free                            |
| Ball-break radius                                     | 6                                                     | free                            |
| Field half-width / numbers inset / boundary margin    | 15.75 / 4 / 1                                         | #4, #10                         |
| Line depth / line split / TE split / slot depth       | 0.5 / 1.5 / 1.5 / 1.5                                 | free                            |
| Shotgun depth / RB offset                             | 5 / 1.5                                               | 5 (#4)                          |
| Gap D outside Y / pass-set depth / engage offset      | 0.75 / 1 / 0.7                                        | free                            |
| RB release outside the tackle                         | 1                                                     | free                            |
| Slant and Drag break depth / Flat depth / Hitch depth | 2 / 1 / 1                                             | 2 / 1 / 0–1 (#10)               |
| Hook back, inside / Comeback back, outside            | 2, 1 / 2, 2                                           | #10                             |
| Go/Seam throw point depth                             | 10                                                    | 10 (#13)                        |
| Hard break / soft break / speed factor                | 0.15 (3 ticks) / 0.05 (1 tick) / 0.5                  | free                            |

Zone ellipses (center x, y; radii x, y), ball on the middle hash:

| Zone                 | Center               | Radii              |
| -------------------- | -------------------- | ------------------ |
| deep-middle          | 0, 15                | 10, 8              |
| deep-half-L / R      | ∓7.875, 15           | 7.875, 8           |
| deep-third-L / M / R | −10.5 / 0 / 10.5, 15 | 5.25, 8            |
| hook-L / M / R       | −5 / 0 / 5, 6.5      | 3.5 / 3 / 3.5, 3.5 |
| curl-flat-L / R      | ∓10, 7               | 3.5, 4             |
| flat-L / R           | ∓13.25, 4            | 2.5, 4             |

Every value stays inside its anchor. The hold time sits on the bottom of its
anchor on purpose: see scenario 3.

## Scenario results

`node scripts/check-engine.ts` reports all ten deep-equal across two runs and
all ten matching what was expected. Times are seconds after the snap, quoted
from the event log.

| #   | Scenario                           | Coverage | Expected                                         | Actual cause                                                                                                          |
| --- | ---------------------------------- | -------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 1   | Free rusher off the far edge       | Cover 1  | `sack-free-rusher`, edge rusher decisive         | `sack-free-rusher`, S2 (from R-D), 1.20                                                                               |
| 2   | A-gap blitz against man protection | Cover 1  | RB picks up the blitzer, a double shows          | `pickup(RB on LB1)`, `double(LG helps C on DL2)`, `double(RG helps RT on DL3)`; ends `breakup-forced`, LB2 on Y, 4.05 |
| 3   | Hold-time sack                     | Cover 3  | `sack-beat-block`                                | `sack-beat-block`, DL3, 3.15                                                                                          |
| 4   | Second read open                   | Cover 3  | throw to the second read, `converted` or `short` | `read-next(X → Z)` and `throw(Z, sep 5.9)` at 1.15; `short`, NB tackles at 1.3 yd                                     |
| 5   | Whole read order covered           | Cover 1  | `throwaway`                                      | `throwaway` at 2.70, lands 3.55                                                                                       |
| 6   | Breakup by a disguised defender    | Cover 3  | `breakup-closed`, the safety decisive            | `throw(H, sep 3.1)` at 1.30; `breakup(S2 on H)` at 2.45                                                               |
| 7   | Undercut interception              | Cover 2  | `interception-closed`                            | `throw(X, sep 3.1)` at 0.85; `interception(LB2 on X)` at 1.80                                                         |
| 8   | Hitch against an off corner        | Cover 1  | cuts 45° inside; `converted` or `short`          | `cut(Z, inside)` at 1.35; `short`, CB2 tackles at 5.6 yd                                                              |
| 9   | Rub                                | Cover 1  | `rubbed` and the crosser open                    | `rubbed(LB1, by X)` at 1.55; Y's badge open (3.4 yd at 1.65); ends `breakup-closed`, CB1 on H                         |
| 10  | Zone choice and carry              | Cover 3  | `zone-choose` and a seam carried                 | `zone-choose(LB2, Z over H)` at 1.40, `carry(S1, Y)` at 1.80 on Y's seam; ends `touchdown`, Z                         |

Scenario notes:

- **1.** DL4 sits in R-B so the right tackle owns him; the two extra rushers are
  LB2 (R-C) and S2 (R-D). Protection is 6-man slide left: the RB owns R-C and
  R-D and takes the inner one (LB2), so S2 comes free. Under 5-man slide left
  both edge gaps would be unowned and both rushers free. I used 6-man so
  exactly one rusher, the one off the far edge, comes free; strictly he is
  "owned by a busy back", not "unowned". Both read as `sack-free-rusher`.
- **2.** 3-DL front: DL1 in the LT's area, DL2 over the center, DL3 in the RT's
  area. LB1 rushes L-A. Both guards are idle, so both double. The RB, the only
  back, picks up LB1 as the first leftover inside-out.
- **3.** See "Hold-time sack needs the hold time at 2.5" below.
- **4.** The non-target who was open while throwable and looks covered on the
  frozen frame is H (In 5, not in the read order): open 3.2 yd at 1.15, then
  0.1 yd from LB1 on the dead-ball tick. The first read X is contested (2.5 yd),
  not covered; the QB moved on because X was never 3 yd clear.
- **6.** S2 lines up at 12 yd over the middle with `zone curl-flat-R` and
  travels about 9 yd to his landmark. H is 3.1 yd clear at the throw; S2
  reaches the catch point from the deep side, so the catch is broken up, not
  intercepted.
- **8.** The off corner (CB2) lines up 8 yd deep and 1 yd outside Z. The Hitch
  is caught at 1 yd, not 4 (see "Hitch depth" below).
- **9.** Y and X run Drags at 2 yd in opposite directions. LB1 presses Y with a
  0.5-yd cushion, so his chase passes within 0.75 yd of X where they cross.
  The QB's first read was H, so the throw went to H; the rub shows in the log,
  the replay and Y's open badge.
- **10.** LB2 (hook-R) locks Y as Y's seam passes through his zone, and has to
  choose when Y leaves it with Z (Slant) and H (In 5) both inside. S1 (deep
  third middle) then carries Y.

Designs were found by hand, with two small search scripts over routes and
defender look spots for scenarios 4, 6 and 7. No scenario has a branch in the
engine; the engine never reads a scenario name or a coverage name.

## Ball carrier heading changes

Counted from `cut` events (one per heading change, the first one measured
against straight upfield). A flicker is a heading that changes back within five
ticks (0.25 s).

| #   | Heading changes                                                                     | Flicker                                                    |
| --- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 4   | 1 (`cut(Z, outside)` at 1.95)                                                       | no; he is tackled the same tick                            |
| 8   | 2 (inside at 1.35, upfield at 2.00)                                                 | no                                                         |
| 10  | 6 (inside 4.50, upfield 4.60, inside 4.70, upfield 4.75, inside 4.90, upfield 4.95) | **yes**, inside/upfield three times in under half a second |

Scenario 10's flicker is the case #14 anticipated ("a minimum hold on a cut is
the fix"). I did not add the hold, so the flicker is visible in the replay.

## Ambiguities and how I read them

- **Hitch depth.** #10 says the Hitch "stops at 0–1 yd"; #14's example catches a
  Hitch at 4 yd. I followed #10 (1 yd).
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
- **Interception "in front".** Strictly on the QB's side of the catch point
  (positive dot product with the catch-to-QB vector).
- **Rubs** apply whenever a defender is in man coverage, including during the
  flight. Each route runner can rub a given defender once.
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
  play. The QB is set 0.5 s after the snap.
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
  carrier drops any heading that would cross the margin.
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

## Rules that contradict themselves or couldn't be built as written

- **Hitch depth** (above): #10's 0–1 yd and #14's 4-yd example can't both hold.
- **"7-man covers every gap"** (#12) is false for slide left in Gun Trey. Y is on
  the right, so he owns R-D, the RB owns R-C, and L-D is left open. It holds
  only when Y is on the slide side.
- **Defenders who break on the ball stand on the catch point.** The
  interception test asks whether the defender is in front of the catch point,
  but a defender who arrives early stands exactly on it, which is neither in
  front nor behind. With the strict reading every early arrival is a breakup;
  only a defender reaching the contest radius on the arrival tick itself, from
  the QB's side, intercepts. Scenario 7's LB2 does exactly that. Reading "on the
  point" as in front instead would turn every early arrival into an
  interception, including deep defenders coming from behind.
- **Carry "until the throw"** (#11) doesn't say what the deep defender does next.
  Going back to his landmark mid-flight looked wrong, so a carry already
  running continues, and only new carries stop at the throw.
- **Hold-time sack needs the hold time at 2.5.** A blocked rusher released at
  the hold time needs about 0.65 s to reach the QB, so the sack lands about
  0.65 s after the hold time. The latest a read order can run is about 3.7 s
  (a first throw point near 2.2 s plus three 0.5-s reads). Worse, the pressure
  radius is reached one tick before the sack radius, and on that tick the QB
  throws any read that is contested (1–3 yd). So a beat-block sack needs the
  current read to be _covered_ (under 1 yd) on the pressure tick. Scenario 3
  gets that with a Corner 15 first and two Hooks into zone defenders who sit
  on them. With the hold time at 2.75, 3, 3.5 or 4.5 the same design ends in
  a `throwaway` at 3.25 s (landing 4.10). Inside the anchor only 2.5 works for
  this design. In practice, sacks in this engine come almost only from free
  rushers.
- **Time to throw is short of the anchors.** Throws happen at 0.55–2.05 s
  (3.05 for scenario 2's forced throw); the mean of the seven throws is about
  1.5 s, well under the 2.8-s average. First reads open at their throw points
  (about 0.5 s for a Hitch, 1.3 s for a 10-yd break, 1.7 s for a 10-yd Hook).
  These scenarios favor quick routes, and the QB throws on the first tick a
  read is 3 yd clear; I haven't measured how the clock behaves with slower
  designs.
- **Long leads.** At 20 yd/s some leads are long: scenario 10's throw to Z on a
  Slant flies 1.6 s and is caught near the far sideline 25 yd downfield.

## Things worth looking at live

- Scenario 4: H's open badge at his best moment against a defender standing on
  him on the frozen frame. Turn on "Best-moment ghosts" to compare.
- Scenario 9: the rub is one tick of contact. LB1 stops for 0.3 s at the
  crossing.
- Scenario 10: the inside/upfield flicker after the catch.
- Scenario 6: the cause line says S2 closed, but at Rep 1 his path from 12 yd is
  hidden; only the ring and the replay show where he came from.
