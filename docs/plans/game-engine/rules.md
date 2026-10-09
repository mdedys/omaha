# Game engine: v1 rules

Every rule v1 runs, with the [Legibility prototype](https://github.com/mdedys/omaha/issues/16)'s amendments and the readings settled in [Tuning values before launch](https://github.com/mdedys/omaha/issues/39) already applied. Each section links the ticket that argued it. Numbers marked *tuned* are named constants in `v1/tuning.ts`, starting from [the prototype's values](https://github.com/mdedys/omaha/blob/prototype/legibility/PROTOTYPE_NOTES.md). Terms are as in [CONTEXT.md](../../../CONTEXT.md).

## The tick

[Simulation model](https://github.com/mdedys/omaha/issues/9)

1. Every rule reads the previous tick's frozen snapshot.
2. All players move at once: each steps up to his current speed toward his target point. No inertia, no turn rate.
3. Events are checked in this order: ball advance → sack → ball arrival → touchdown → tackle → out of bounds.

- Speeds are per role (WR, TE, RB, QB drop, OL, DL, LB, CB, S), averages over a route, *tuned*. NB and DB run at CB speed.
- Players pass through each other. Contact exists only where a named rule makes it: a block, a tackle, a contested ball, a rub ([ADR 0002](../../adr/0002-no-body-collisions.md)).
- The defense reads only positions from this tick and earlier, after any reaction delay. It never reads the design, a route's future or the read order. The offense may use its own plan.
- **One global reaction delay** (*tuned*) applies to every defender: a man defender at a break, a zone defender when a receiver enters or he chooses, everyone at the throw.
- The rep ends on the dead-ball tick: a sack, a ball arriving uncaught, an interception, a tackle, a touchdown, or a throwaway landing. A rep reaching 20 s throws `EngineError`; the cap is never an outcome.

## Field and formations

[Field geometry and formations](https://github.com/mdedys/omaha/issues/4), [ADR 0001](../../adr/0001-narrow-field.md)

- The field is 31.5 yd wide at true scale, full length with 10-yd end zones. Hashes are 4 yd either side of the middle; the numbers are 4 yd inside each sideline.
- Seven flippable catalog formations: Gun Trey, Gun Doubles, Gun Trips, Gun Spread, Gun Empty, Gun Doubles 12, Ace. A puzzle sets only formation, flip, hash and yard line. A real alignment the catalog lacks becomes a new catalog entry.
- Each entry gives each letter a display name ("Left WR"), a route menu (defaulting by letter: X and Z → WR, Y and H → Inside, RB → RB, with overrides such as Ace's H → Inside), and two flags: **RB in backfield** and **Y attached**.
- Shotgun QB at 5 yd, or under center. Outside receivers line up on the numbers; detached inside receivers spread evenly between the end of the line and the outside receiver on their side. Exact spots are *tuned*.

## Routes

[Route tree](https://github.com/mdedys/omaha/issues/10)

| Menu | Routes |
|---|---|
| WR | Hitch, Flat, Slant, Comeback, Hook, Out, In, Corner, Post, Go, Drag |
| Inside | the WR routes plus Wheel, with Go named Seam |
| RB | Flat, Hook, Out, In, Seam, Wheel |

Each menu lists its routes in route-tree order, as `design/05-routes` › Route order sets out.

- **Depth** from the line of scrimmage: In, Out, Hook take 5/10/15; Corner, Post, Comeback take 10/15; the rest take none. A depth whose break lands inside the end-line margin is unavailable.
- **Inside** is toward the ball, **outside** toward the receiver's own sideline. A flip mirrors routes with the receivers.
- X, Y, Z and H run a straight stem from their alignment. The RB first goes to his **release point**, just outside the tackle on his side at the line.
- Paths are polylines of exact 45° (`(1,1)/√2`) and 90° turns. A route **sits** (stops at its last point) or **runs** (until 1 yd inside the sideline or end line, then stops).

| Route | After the stem or release | End |
|---|---|---|
| Go / Seam | straight up | run |
| In / Out | 90° inside / outside at the depth | run |
| Hook | at the depth, back 2 yd and 1 yd inside | sit |
| Post / Corner | 45° inside / outside at the depth | run |
| Comeback | at the depth, back 2 yd and 2 yd outside | sit |
| Slant | 45° inside at 2 yd | run |
| Drag | 90° inside at 2 yd | run |
| Hitch | stops at 0–1 yd, turns to face the QB | sit |
| Flat | 90° outside at 1 yd | run |
| Wheel | 90° outside at 1 yd to the numbers, then straight up | run |

- A **hard break** (In, Out, Drag, Hook, Comeback, Hitch) and a **soft break** (Slant, Post, Corner, Flat, both Wheel turns) each cost a fixed time at reduced speed, *tuned*. A sitting route stops for good. Nothing about a route reacts to coverage.
- The route distances above (2 yd, 1 yd, the boundary margin) are *tuned*.

## Protection and the rush

[Protection and the pass rush](https://github.com/mdedys/omaha/issues/12), [ADR 0004](../../adr/0004-protection-by-ownership.md)

- **Who stays in:** 6-man keeps the RB (needs RB in backfield); 7-man also keeps Y (needs Y attached). Gun Empty is 5-man only. A kept-in receiver blocks all play; there's no check-release and no 8-man.
- **Gaps:** eight points on the line, A–D each side as drawn after any flip: A beside the center, B between guard and tackle, C just outside the tackle (inside Y when attached), D wider (outside Y). The side without Y spaces C and D as if Y were there. Spacing is *tuned*.
- **A rusher's gap** is the gap nearest his look spot across the field, ties toward the ball, unless the puzzle authors `rush <gap>`. A rusher attacks one gap; no stunts.
- **Slide** (slide left shown; slide right mirrors): C owns L-A, LG L-B, LT L-C, RG R-A, RT R-B; the RB owns R-C and R-D except a gap Y owns; Y owns the D gap on his own side. On a slide away from Y, the slide side's D gap is open.
- **Man (big on big):**
  1. Each lineman's area runs from the gap point inside him to the one outside him (the center's from L-A to R-A). Each DL-role defender falls in one area; one exactly on a gap point goes to the inside lineman. The lineman blocks his DL if he rushes.
  2. Two DL in one area: the lineman takes the inner one; the outer one passes to the next lineman outward if that lineman has no DL, else he's a leftover.
  3. Y (7-man) takes the first leftover rusher on his side, inside-out.
  4. The RB (6- and 7-man) takes the first leftover rusher anywhere, inside-out by gap, ties away from Y.
  5. Everyone else is free. Only the DL role counts as a lineman's man.
- **Two rushers for one slide owner:** he takes the innermost gap, then the one who started nearer the line, then the one nearer the ball. The other is free.
- **Double team:** a lineman with no rusher helps the nearest teammate who has one, by gap distance, ties toward the ball. Idle linemen pick doubles from the center out; one helper per rusher; a second idle lineman takes the next-nearest single block or stands. Only linemen help; an idle RB or Y stays home.
- **Hold time** (2.5 s, *tuned*) counts from the snap. A blocked rusher runs at his gap point, meets his blocker at the pass-set depth, and is held until the hold time, then chases the QB. A doubled rusher is held twice as long.
- **Free rusher:** runs to his gap point, then chases the QB's position each tick.
- **Hug rush:** at the reaction delay, a man defender whose receiver is kept in rushes straight at the QB from where he stands. The receiver he covers picks him up if that receiver has no rusher yet; otherwise he's free.
- **Pressure:** a rusher within the pressure radius (*tuned*, about 2 yd) of the QB before the ball is out. **Sack:** a rusher within the sack radius (*tuned*, at most 1.5 yd) before the ball is out. Ball advance precedes sack, so a throw on the same tick beats it. The rep ends where the QB stands.

## Defense

[Defensive call model](https://github.com/mdedys/omaha/issues/11), [ADR 0003](../../adr/0003-per-defender-assignments.md)

- Every defender moves toward his assignment from tick 0 at his role speed. Disguise is just the distance from his look spot.
- `rush` by a non-DL is a blitz. A DL with a `zone` assignment drops.
- **Zones** come from a fixed catalog, each with a landmark and an ellipse computed from the field (*tuned*): deep half L/R, third L/M/R, quarter 1–4, deep middle (placed by field width); hook L/M/R (by the ball); curl-flat L/R (by the ball and numbers); flat L/R (numbers to sideline). On a hash, hooks shift with the ball and thirds don't.
- **Underneath zones (spot-drop):** drop to the landmark. Play a receiver in the zone with the target clamped inside the zone; let him go when he leaves. No receiver: sit at the landmark. Two: lock onto the nearest one shallower than the defender, else the nearer; re-pick only when that one leaves. Underneath defenders never leave their zone.
- **Deep zones carry:** a receiver in or entering the zone who comes within the carry distance (*tuned*) of the defender's depth is carried, trailed like man, even out of the zone, until the throw; a carry already running continues after the throw. Two deep threats: take the deeper, ties to the one nearer the middle.
- **Man:** the target is the receiver's position plus the pre-snap inside/outside offset and depth cushion. The cushion shrinks to the trail distance (*tuned*) as the receiver eats it up, and never regrows. A sitting receiver is closed to trail distance. When the receiver's heading turns 45° or more between snapshots, the defender holds his old heading for the reaction delay, then resumes. Two defenders may both man one receiver.
- **Rub:** a man defender whose chase step would pass within the contact radius (*tuned*, about 0.75 yd) of a different route runner steers around him, outside the radius, at half speed for the rub time (*tuned*, 0.6 s), then rejoins his chase. Zone and carry defenders are never rubbed.
- **Breaking on the ball** is checked once, at the throw plus the reaction delay: defenders within the ball-break radius (*tuned*) of the catch point head for it. Everyone else keeps his assignment.

## The QB

[QB reads and the throw](https://github.com/mdedys/omaha/issues/13), [ADR 0005](../../adr/0005-player-set-read-order.md)

- **Drop:** to one set spot about 7 yd behind the line at the drop speed (*tuned*), from shotgun or under center. He never throws before he's set and never moves after.
- **Throw points:** the break (In, Out, Post, Corner, Slant, Drag, Flat); where he sits (Hook after settling, Comeback, Hitch); the Wheel's turn upfield; 10 yd past the line on Go/Seam.
- **Reading:** he looks at the first read from the snap. Each read gets one read time (*tuned*), starting at the latest of: reaching that read, being set, the receiver reaching his throw point. He throws on the first tick in the read time that the read is **open** (3 yd or more to the nearest defender, in the snapshot), else moves on.
- **Pressure:** from the first `pressure` event on, his bar drops to **contested** (1 yd or more) for the rest of the play, on any read past its throw point.
- **Out of reads:** he throws to the read with the most separation among reads past their throw point if it's at least contested, ties to the earlier read (a forced throw, out of reads). If none is, he throws it away: the ball flies to just past the nearest sideline, level with the QB, nobody can catch it, and the rep ends incomplete when it lands.
- No scrambles, stepping up, hot reads, or throws outside the read order.
- **The throw:** the ball flies straight at one ground speed (*tuned*) to the **catch point**: the first spot on the receiver's planned path the ball can reach in time, from the route function alone. A stopped receiver is thrown to where he stands.

## Ball arrival

[Catch, interception and yards after catch](https://github.com/mdedys/omaha/issues/14)

- The ball is played only at the catch point, on the arrival tick. Nothing touches it in flight.
- Defenders within the contest radius (1 yd) of the ball:
  - **None:** a catch. Every route stops inside the boundary margin, so no catch is out of bounds.
  - **One or more:** the nearest makes the play, ties by a fixed order of defender ids. **Interception** if he broke on the ball and, on the tick before arrival, was nearer the catch point than the receiver. Otherwise a **breakup** (incomplete). A stopped receiver is on the catch point, so he can only be broken up.
- An interception ends the rep at the catch point with no return. An interception in the end zone is only an interception.

## After the catch

- **Ball carrier:** each tick he chooses straight upfield, 45° inside or 45° outside, never sideways or back. His target line is the line to gain until he crosses it, then the goal line (the goal line from the start on a touchdown goal). For each heading, his **free run** is how far he gets before some defender could reach that path first, at role speeds from this tick's positions under the pursuit rule. He takes the heading that reaches the target line first, else the one that gains most before he's cut off; ties go upfield, then toward the middle. He drops any heading that would cross the 1-yd boundary margin. After a change he keeps the heading for the cut hold (*tuned*, 0.3 s), which the boundary margin ends early.
- **Pursuit:** blocks end at the catch. Every defender aims at the intercept point, where he'd meet the carrier if the carrier kept his velocity from the last two snapshots, or at the carrier's spot if he can't reach him. Defenders who broke on the ball pursue from the catch tick; the rest after the reaction delay.
- **Tackle:** the first tick a defender is within the tackle radius (1 yd, never more than the contest radius) ends the rep at the carrier's spot.
- **Touchdown:** a catch in the end zone, or the carrier reaching the goal line, on that tick. Touchdown is checked before tackle. On a first-down goal the play runs on past the line to gain.

## Verdict and score

[Scoring and beating the pros](https://github.com/mdedys/omaha/issues/7)

- **Yards gained** truncate toward zero.
- **Verdict:** `converted` when a completion reaches the goal (whole yards ≥ distance on a first-down goal; a touchdown on a touchdown goal); `short` for any other completion, a loss included; `failed` for an incompletion, interception or sack.
- **Base:** 100, 75, 50 or 25 for converting on rep 1–4; 0 out of reps. A puzzle ends on its first converting rep.
- **Bonus** on the converting rep: +20 for a touchdown on a first-down goal; otherwise +1 per whole yard past the line to gain, up to +10. A touchdown goal earns no bonus. Top score 120.

## Receiver feedback

[What a rep tells the player](https://github.com/mdedys/omaha/issues/15)

- Every route runner gets a badge: **open** at 3 yd or more to the nearest defender, **contested** 1 to 3 yd, **covered** under 1 yd.
- The receiver thrown to is measured on the arrival tick.
- Every other route runner is measured at his best separation from the tick the QB is set and he has reached his throw point, until the ball is out (throw, throwaway or sack). One who never became throwable is measured on the ball-out tick.

## Cause

Picked from the event log by outcome. Supporting events (`zone-choose`, carry, hug rush, `defender-react`, `rubbed`) never become the cause.

| Outcome | Code | Decisive defender |
|---|---|---|
| Sack by a rusher nobody picked up (unowned gap, or owner busy, hug rush included) | `sack-free-rusher` | sacker |
| Sack after the hold time ran out | `sack-beat-block` | sacker |
| Every read covered when the order ran out | `throwaway` | none |
| Breakup on a ball thrown open | `breakup-closed` | breaker |
| Breakup on a forced throw (pressure or out of reads, in `forcedBy`) | `breakup-forced` | breaker |
| Interception, split the same way | `interception-closed`, `interception-forced` | interceptor |
| Caught and tackled short | `short` | tackler |
| Converted, or converted by touchdown | `converted`, `touchdown` | none |

## Play art

The tier `revealedPlayArt` applies, by failed reps so far. A converted rep ends the puzzle, so the nth failure is rep n, and a short rep counts as failed.

| Failed reps | Revealed |
|---|---|
| 0–1 | nothing (the front end rings the decisive defender) |
| 2 | every DL and LB, by role; DBs stay hidden, even blitzing |
| 3 or more, or `puzzleEnded` | everything |

The coverage name, which is puzzle data, shows only once the puzzle ends.
