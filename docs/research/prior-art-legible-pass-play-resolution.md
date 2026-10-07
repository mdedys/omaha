# Prior art for legible pass-play resolution

How existing football games and play simulators resolve routes against coverage, the rush against protection, and the throw, which of those approaches are deterministic and legible, and how Monday QB grades plays. Researched on 2026-10-07. Monday QB's findings come from its shipped JavaScript as served that day.

Labels: _(inference)_ marks a conclusion drawn here rather than stated by a source.

## Summary

- **Nothing found is both deterministic and built to explain itself.** Every football game and sim found rolls dice: Madden, Tecmo, Football GM, Front Office Football, Pro Strategy Football and the tabletop games. Monday QB has a seeded deterministic mode, but its daily puzzle runs on `Math.random()`. Playbook animation tools are deterministic, but they play back drawn paths and resolve nothing.
- **What makes an outcome legible is a rule that names its cause.** Tabletop charts point at a named cell, such as "guessed right" or "empty zone +5". Madden made its play art the source of truth for how zones behave. Tecmo decides a catch by who is near the ball. None of these needs randomness, so they port to a deterministic engine.
- **Public analytics give defensible thresholds for openness, protection and read timing.** Next Gen Stats measures openness when the pass arrives: under 1 yard is a tight window and 3+ yards is open. ESPN scores a block held 2.5 s as a win for the blocker. Coaching guidance puts the first read at about 1.8–2.0 s.
- **The gaps are timing values.** No public source gives route break times, route-running speed, air time by depth, or interception rate by separation. These have to be named constants tuned by hand.

## Five families of resolution

| Family | Examples | How a pass resolves | Deterministic? | How it explains the result |
|---|---|---|---|---|
| Per-player real-time simulation driven by ratings | Madden, Axis Football, Retro Bowl, Tecmo | Every player moves each frame; ratings and chance settle each block and catch | No | Play art, zone shading, on-field icons, animation |
| Outcome first, then choreographed animation | Pro Strategy Football | The engine picks the result, then animates a matching play | No (seeded dice) | The animation always agrees with the result |
| Abstract probabilities | Football GM, Front Office Football, Monday QB | Team or player ratings feed probabilities; no field positions | No | Play-by-play text, canned lines |
| Offense call × defense call chart | Avalon Hill Football Strategy, Paydirt, Strat-O-Matic, Statis Pro, Pizza Box Football | Look up the two calls in a chart, sometimes adjusted by a dice roll | Football Strategy mostly yes; the rest no | The chart cell names the reason |
| Scripted animation | Playbook animators (CoachYouths, Luceo, Football Play Card) | Players follow drawn paths with per-segment timing | Yes | The diagram itself; nothing is resolved |

- **Pro Strategy Football** "computes all the possible outcomes and their percentages", then shows "a choreography of the engine's results". The result is the same whether you watch or simulate ([PSF](http://www.prostrategyfootball.com/)).
- **Avalon Hill's Football Strategy** (1959) puts 20 offensive plays against 10 defensive cards on one matrix. "Except for 'long gains', the outcome of each play against each defense is always the same" ([analog.games](https://analog.games/gameItem/show/419cd83f9656f45d01965730d05c19a7/football-strategy?lang=DE)).
- **Playbook tools:** players move along drawn lines with a delay per segment ([CoachYouths](https://www.footballplaybookdesigner.com/kb/article/route-settings), [Luceo](https://solutions.luceosports.com/drawing-animations-web-mobile)). Defenders follow "rush and coverage lines" the coach draws ([Football Play Card](https://footballplaycard.com/blog/animate-your-play-cards-and-playbooks)).

## Routes against coverage

**Madden: short priority lists per defender, and play art as the source of truth**

- **Madden 17** rebuilt zones as ten underneath assignments that share knowledge of the whole scheme. It added a receiver count, numbering receivers #1/#2/#3 from the outside in before and after the snap ([pastapadre quoting EA](https://www.pastapadre.com/2016/05/26/details-on-the-improvements-to-zone-defense-in-madden-nfl-17)).
- **Each zone is a short ordered rule.** A Cloud Flat defender will "protect against deep outside routes first and rally to short outside routes second". A Quarter Flat defender can "carry" an inside receiver's vertical route to a set depth ([EA](https://www.ea.com/games/battlefield/news/gridiron-notes-8-30)).
- **Madden 23** made every zone "strictly using spot-drop zone logic", so the play art is "the central source of truth for players so they can better predict how their zones will react during the play" ([EA](https://www.ea.com/inside-ea/news/gridiron-notes-madden-nfl-23-gameplay-foundational-football)). The richer match rules moved behind a coaching adjustment.
- **Counter-example, Madden 25:** the hook zones in Cover 3 and Cover 4 "massively overplay" toward trips and leave the middle empty. The defense did something its play art didn't show ([Madden School](https://madden-school.com/madden-25-changes-how-cover-3-and-cover-4-defenses-play)).
- **Madden 27:**
  - It grades coverage in four tiers, "open, partially covered, covered, and smothered", and each tier shrinks the catch timing window.
  - It adds settings for when zone defenders lock onto the nearest receiver, for example when the QB leaves the pocket or after a timer ([EA](https://www.ea.com/games/madden-nfl/madden-nfl-27/news/madden-27-gameplay)).

**Tabletop: count the defenders, or fix who covers whom**

- **Strat-O-Matic:**
  - The defense calls pass or run, can double one receiver, and moves defenders between the flat, look-in, short and long zones.
  - On the team defense card, "the only thing that matters… is the number of linebackers (or the Free Safety) in the zone at which the play is directed" ([rules](http://magic.hobbytown.com/stratomatic/Rules.aspx)).
- **Statis Pro Football:**
  - Each receiver is guarded by a fixed defender box.
  - That defender's pass-defense value shifts the QB's completion range: +5 for an empty box, −15 for triple coverage ([6th ed. rules](https://www.sycarion.com/wp-content/uploads/2011/07/SPF_6th-Edition-Rules-Avalon-Hill.pdf)).
- **Front Office Football:**
  - A defensive call is a coverage (16 types), a rush count, an optional spy and an optional double team.
  - "Pass coverage is a numbers game" ([docs](http://www.solecismic.com/documentation/dokuwiki/doku.php?id=defensive_philosophy)).

**Telling man from zone, and disguise**

- **Unsupervised clustering of cornerbacks:**
  - The strongest signal was how much the corner's direction of motion varies relative to the nearest receiver.
  - A man defender's heading tracks one receiver ([Dutta, Yurko & Ventura](https://arxiv.org/abs/1906.11373)).
- **The NGS coverage classifier** is 95.4% accurate on man vs zone. Its main confusion is Cover 3 zone against Cover 1 man: both are single-high looks, and disguise exploits exactly that pair ([AWS](https://aws.amazon.com/blogs/machine-learning/identifying-defense-coverage-schemes-in-nfls-next-gen-stats/)).
- **NGS's 2025 disguise flag** compares a pre-snap model of what the QB sees with the post-snap classification. A split-safety look that "rotates to single-high man (or spins to Cover 0)" counts as disguised ([NFL](https://www.nfl.com/news/next-gen-stats-new-advanced-metrics-you-need-to-know-for-the-2025-nfl-season)).

**How open a receiver is**

All of the following measure at the moment the pass arrives.

| Source | Bands | Completion rate |
|---|---|---|
| NGS | Tight window under 1 yd; open 3+ yd; wide open 5+ yd ([NFL.com](https://www.nfl.com/news/11-outrageous-next-gen-stats-entering-week-12)) | 10 air yards ≈ 80%, 40+ ≈ 20%; drops sharply after 3 s and near the sideline ([NGS](https://www.nfl.com/news/next-gen-stats-introduction-to-completion-probability-0ap3000000964655)) |
| PFF | Open means outside arm's length; tight means within it ([PFF](https://www.pff.com/news/nfl-pff-route-concept-and-separation-study-which-receivers-and-routes-are-creating-the-most-separation-for-nfl-offenses)) | Open 77.9%, tight 24.5% |
| Sports Info Solutions | Contested, normal, wide open, crossed with accurate or inaccurate throws ([SIS](https://www.sportsinfosolutions.com/2024/09/05/using-accuracy-and-openness-to-provide-context-for-receiver-play)) | Accurate 52 / 78 / 95%; inaccurate 9 / 27 / 45% |

- **Arrival matters more than the throw.** Separation at the catch attempt carries far more weight than separation at the throw: 6.74% feature importance against 0.08% ([Deshpande & Evans](https://arxiv.org/abs/1910.12337)).
- **ESPN's Open Score** is a catch probability, not a yardage band ([ESPN](https://africa.espn.com/nfl/story/_/id/34649390/espn-receiver-tracking-metrics-how-new-nfl-stats-work-open-catch-yac-scores)).

## The rush against protection

- **Madden 23:** rushers fill lanes "while avoiding having multiple rushers in a single gap" ([EA](https://www.ea.com/inside-ea/news/gridiron-notes-madden-nfl-23-gameplay-foundational-football)).
- **Madden 25:** pre-play art shows blocking assignments, and flame icons mark defenders "who will NOT be blocked if they blitz" ([Terminal Gamer quoting EA](https://terminalgamer.com/2024/07/23/ea-sports-releases-madden-nfl-25-gameplay-deep-dive/)).
- **Statis Pro:** the defense's total rush value is compared with the offense's total block value. Twice the difference shifts the sack range ([rules](https://www.sycarion.com/wp-content/uploads/2011/07/SPF_6th-Edition-Rules-Avalon-Hill.pdf)).
- **Strat-O-Matic:** a rush happens only when the defense guessed pass and a die triggers it. Then one named lineman faces one named blocker on a chart ([rules](http://magic.hobbytown.com/stratomatic/Rules.aspx)).
- **Anti-pattern, Football GM:** each blocker's win or loss is rolled, but it only feeds stats and decides who is blamed. The sack itself is one team-level roll, `probSack` ([GameSim.football](https://github.com/zengm-games/zengm/blob/bed6816b678a571c3c5ecb3a7ee9f19f79dca905/src/worker/core/GameSim.football/index.ts#L2148-L2156)).
- **Anti-pattern, Axis Football:** rushers "would suddenly squirt out of [a pile-up] with no warning and sack the QB". Deeper pass sets made "the pocket more readable" ([review](http://www.megabearsfan.net/post/2023/10/30/Axis-Football-24-game-review.aspx)).

**Timing and distance figures**

| Measure | Value | Source |
|---|---|---|
| Block win | A block held 2.5 s or more is a win for the blocker. The threshold is "about the average time to pass release" | [ESPN](https://www.espn.co.uk/nfl/story/_/id/24892208/creating-better-nfl-pass-blocking-pass-rushing-stats-analytics-explainer-faq-how-work) |
| Rusher win | "Closer to the quarterback than who is blocking him and… within a certain distance", or inside the pocket. Unblocked rushers are charged to no blocker. | ESPN, as above |
| Pressure | Defender within 2 yd of the QB at the throw, or within 1.5 yd at any point (NGS's older rule) | [NGS](https://www.nfl.com/news/next-gen-stats-introduction-to-pressure-probability) |
| Blocker in the way | A blocker within 1 yd of the straight line from rusher to QB fully interferes | [AWS/NGS paper](https://cdn.amazon.science/2b/fe/e4f2f6bc4092bba17cb3f84a0929/feeling-the-pressure-a-unified-framework-for-automating-pass-rushing-statistics-in-nfl-games.pdf) |
| Time to pressure | 2.9 s on average; quick pressure is 2.5 s or less | NGS, as above |
| Time to throw | About 2.8–2.86 s on average | [PFF](https://www.pff.com/news/nfl-quarterbacks-are-holding-the-ball-longer-than-ever-the-trends-behind-time-to-throw/) |
| Time to sack | 4.52 s on average (a three-week sample) | [NFL.com](https://nfl.com/news/next-gen-stats-raiders-o-line-vs-chiefs-d-line-0ap3000000753613) |
| Pressure to sack | About 15% of pressures become sacks (PFF, 2017–21) | [Pewter Report citing PFF](https://www.pewterreport.com/predicting-bucs-pass-rushers-2022-sack-numbers) |

## The throw, catch, interception and yards after catch

**Tecmo Super Bowl: position picks who takes part, a margin picks the result**

The rules below come from fans who disassembled the game's code ([tecmobowl.org](https://tecmobowl.org/forums/topic/7066-passing-game-ratings/)).

- **Who takes part.** At most two nearby defenders are checked, in a fixed roster order.
- **The result.**
  - The game computes QB pass control + receiver receptions − defender interceptions, then randomizes the total into a range.
  - The low band is an interception, the middle band a deflection, and the high band a catch.
- **A wide-open receiver** skips the defender term: the result is a catch or a drop.

_(inference)_ Replace the random number with separation at the catch point and this becomes a deterministic catch / breakup / interception rule. It lines up with open, contested and covered.

**Other games**

- **Madden 16:** a defender who plays the receiver instead of the ball gives up any chance of an interception ([Madden School](https://www.madden-school.com/madden-nfl-16-e3-gameplay-trailer-and-information/)).
- **Retro Bowl:** "the ball goes where you aimed, not to the receiver" ([retrobowl.gg](https://retrobowl.gg/blog/retro-bowl-passing-guide/)).
- **Anti-pattern, Football GM:** completion and interception are separate rolls. The "defender" is a random member of the defense with no link to the target ([GameSim.football](https://github.com/zengm-games/zengm/blob/bed6816b678a571c3c5ecb3a7ee9f19f79dca905/src/worker/core/GameSim.football/index.ts#L2158-L2200)).

**Interceptions in the data**

- **Turnover-worthy plays (PFF):**
  - These are throws "directly in harm's way": a bad read into coverage, a late throw over the middle, an underthrown deep ball.
  - They are 3.08% of attempts, and 49% of them are intercepted. Only 0.79% of other throws are ([PFF](https://www.pff.com/news/nfl-hidden-story-behind-quarterback-interceptions)).
- **The middle of the field** sees about twice the interception rate of the outside, for both short and deep throws ([Football Perspective](https://www.footballperspective.com/pass-efficiency-by-pass-direction/)).
- **Not found:** a public curve of interception rate by separation, or a tracking rule that tells a breakup from an interception.

**Yards after catch**

NGS first predicts "yards gained before close-in": how far the receiver gets before a defender closes within 1 yard ([NGS](https://www.nfl.com/news/next-gen-stats-intro-to-expected-yards-after-catch-0ap3000000983644)).

**Timing and speed**

| Measure | Value | Source |
|---|---|---|
| Read clock (coaching guidance, not tracking data) | First read 1.8–2.0 s; second 2.2–2.6 s; check-down or escape by 2.8 s; ball out before 3 s | [USA Football](https://blogs.usafootball.com/blog/4912/build-a-plan-to-improve-pass-protection-for-next-year-by-conducting-this-postseason-analysis) |
| QB drop | 3-step: 4–6 yd; 5-step: 7–8 yd; 7-step: 9+ yd | [PFF](https://www.pff.com/news/qbs-in-focus-drop-back-depth) |
| Top player speed | About 10.3–10.6 yd/s for the fastest players in a season | [NBC citing NGS](https://www.nbcsportsbayarea.com/nfl/san-francisco-49ers/breaking-down-fastest-2022-nfl-players-using-next-gen-stats/1435104) |
| Ball speed | Mostly 52–58 mph at the combine (about 25–28 yd/s) | [Ourlads](https://www.ourlads.com/story/default/Quarterback-Ball-Velocity-at-NFL-Combine-2008-2023/10243/ar/) |
| Route window | NGS tracks WR routes until the release or 4.6 s; WR screens average 1.6 s to throw | [NGS](https://www.nfl.com/news/next-gen-stats-intro-to-new-route-recognition-model) |

No public source gives break times for 5-, 10- and 15-yard routes, route-running speed, or air time by depth.

## Monday QB

Source: its daily puzzle JSON (`/api/daily?date=…`) and its shipped JavaScript bundles at [monday-qb.com](https://monday-qb.com). No press, Hacker News or Product Hunt coverage turned up.

**What it is**

- One game-winning drive a day between fictional, generated teams, not real games.
- You call every play, choosing a single target and a depth (screen, short, medium, deep), or a run concept, sneak, kneel, spike or field goal. That's about 34–38 legal calls per snap.
- There is no protection, no multi-route design and no read progression.

**The defense**

- A fixed rule picks the coverage from the situation:
  - Cover 1 inside the 10 or at 3 yards or less to go.
  - Quarters at 10+ to go or with 40 s or less left.
  - Cover 2 right after a deep call.
  - Cover 3 otherwise.
- The coverage is shown openly on the field, with no disguise.
- A scouting overlay lists every defender's ratings and whom each covers.

**How a play resolves**

- An advantage score is a weighted mix of the QB, target and defenders' ratings. It is adjusted for protection against the rush, stamina, weather, and a penalty for going back to the same target or side.
- Yards = `base + advantage × factor + noise`. The pass is incomplete when advantage plus noise falls below a threshold for that depth. Interceptions and fumbles are chances that scale with depth and stamina.
- The engine can run seeded: the noise comes from a hash of the scenario, play, situation and history. But the daily page calls it with `randomize: true`, which uses `Math.random()`. The FAQ admits that "live outcomes can vary like football does".

**How it grades**

Each call is graded by a hand-tuned value function applied to the noise-free expected result of every legal call. It is not compared with a real team's call or with an EPA model.

- **Value of a call:**
  - expected yards × 11 when trailing (× 7 otherwise)
  - +32 for a first down
  - +190 for a score
  - a cost per second of clock used
  - a risk penalty of −18 / −8 / −2
  - −16 for a deep ball in 12+ mph wind
  - −22 for repeating the exact same call
- **Quality** = (your value − worst) / (best − worst). The call's share square is green at 0.8 or more, yellow at 0.45 or more, and red below that.
- **Coach Rating** = average quality × 100. A loss caps it at 42 (an F). A win sets a floor of 73 and adds up to +8 for winning with under 20 s left.
- **Unused solver.** The bundle carries a search solver that returns an optimal line, but the daily page doesn't use it.
  - The endless Sudden Death mode uses search to generate defenses. It keeps a defense only if exactly one target can score and no more than two of the three main receivers can. In other words, it gates puzzles on how many solutions they have.

**How it explains a play**

A result ("+12", "INC", "INT"), a short headline and one "booth" line. The booth lines are canned per result type, not per cause: every interception gets "forced it into coverage".

**Sharing**

One colored square per call, a letter grade and Coach Rating, the final score and the time left.

## Legibility in deterministic plan-then-watch games

- **Into the Breach** telegraphs every enemy attack so "every death felt like your own fault" and "it's very clear how or why you failed" ([Game Developer](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-), [GDC 2019](https://gdcvault.com/play/1025772/-Into-the-Breach-Design)).
- **Frozen Synapse:**
  - It resolves turns deterministically and lets players preview and replay them ([Wikipedia](https://en.wikipedia.org/wiki/Frozen_Synapse)).
  - Its postmortem warns that because plans can be tested, players "feel like you could have predicted events perfectly", which causes "significant frustration". New players also didn't understand outcomes ([postmortem](https://www.gamedeveloper.com/audio/postmortem-mode-7-games-i-frozen-synapse-i-)).
- **Hitman GO:** enemies are static, rotate or patrol fixed routes, and move only after the player, like chess pieces ([Wikipedia](https://en.wikipedia.org/wiki/Hitman_Go)).
- **Opus Magnum:** the machine stops at the first invalid state, so a failure points at one moment ([Wikipedia](https://en.wikipedia.org/wiki/Opus_Magnum)).
- **Front Office Football:** its forum warns that once every player is shown in 2D, players ask "why didn't the QB throw to THAT guy". Every frame has to agree with the explanation ([FOFC](https://forums.operationsports.com/fofc/archive/index.php/%24file%3E%24file%3C/a%3E/t-55675.html)).

## Inputs for the open tickets

These are inputs, not decisions. Each ticket decides its own question.

- **[Simulation model](https://github.com/mdedys/omaha/issues/9)**
  - Two shapes keep the animation and the explanation in agreement:
    - per-player rules that the animation shows directly, as in Madden's spot-drop zones;
    - outcome first, with choreography generated to match, as in Pro Strategy Football.
  - _(inference)_ ADR 0001 promises that the separation the player sees is the separation the engine judges. That rules out a chart lookup with a painted-on animation, unless the generated positions are what the rules read.
- **[Defensive call model](https://github.com/mdedys/omaha/issues/11)**
  - Madden's short ordered rules per defender: deep outside first, then rally short; carry a vertical to a set depth; number receivers #1/#2/#3.
  - Spot-drop by default, for predictability.
  - Disguise modelled as a pre-snap shell against a post-snap shell, as NGS flags it.
  - Avoid zone behavior the play art doesn't show (Madden 25's trips overplay).
- **[Protection and the pass rush](https://github.com/mdedys/omaha/issues/12)**
  - Who comes free by counting rushers against blockers, not by rolling.
  - ESPN's 2.5 s block win; "closer to the QB than his blocker"; NGS's 1.5–2 yd pressure distance; about 2.9 s to pressure.
  - Avoid Football GM's team-level sack roll and Axis's unexplained "squirt out" sacks.
- **[QB reads and the throw](https://github.com/mdedys/omaha/issues/13)**
  - Read clock: about 1.8–2.0 s for the first read, 2.2–2.6 s for the second, out by 3 s.
  - Average time to throw is about 2.8 s.
  - Monday QB has no progression to learn from.
- **[Catch, interception and yards after catch](https://github.com/mdedys/omaha/issues/14)**
  - Tecmo's who's-near-the-ball model without the random number.
  - Separation measured when the pass arrives, not at the throw.
  - Interceptions need a defender at the catch point or in the throwing lane, and are likelier over the middle and on late throws.
  - Yards after catch end when a defender closes within 1 yd.
- **[What a rep tells the player](https://github.com/mdedys/omaha/issues/15)**
  - NGS bands map onto covered (under 1 yd), contested (1–3 yd) and open (3+ yd) _(inference)_.
  - Write lines per cause, not per result type (Monday QB's anti-pattern).
  - Show who comes free in the result play art, like Madden's flame icons.
  - Freeze on the decisive moment (Opus Magnum).
  - Frozen Synapse's warning bears on how much a failed rep reveals.
- **[Scoring and beating the pros](https://github.com/mdedys/omaha/issues/7)**
  - Monday QB grades each call against the best and worst of all calls, then bands the result.
  - _(inference)_ An exhaustive solve of Omaha's design space would give an exact best design and percentile. Its size depends on the route tree: five receivers with about 15–30 route-and-depth choices each, times 9 protections and 5 first reads, is tens of millions to about a billion designs per puzzle. That's plausible offline only with a small route tree or pruning.
- **[The pros' play: authored or simulated](https://github.com/mdedys/omaha/issues/8):** no prior art found. Monday QB has no real plays.
- **[Puzzle format](https://github.com/mdedys/omaha/issues/18):** Monday QB ships the full puzzle, every rating and its whole engine to the browser, readable in the network tab. It has nothing to hide, because its coverage is shown openly.
- **[Legibility prototype](https://github.com/mdedys/omaha/issues/16):** worth testing:
  - whether an Omaha zone ever does what its play art doesn't show;
  - whether every sack has a visible, named free rusher.
- **Tuning (still fog on the map):** there are no public figures for route break times, route speed, air time by depth or interception rate by separation. These need named constants tuned by hand.
