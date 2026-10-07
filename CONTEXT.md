# Omaha

A daily football puzzle: the player designs one pass play against a hidden defense and gets up to four reps to convert.

## Language

### The puzzle

**Puzzle**:
One day's challenge: a situation, a formation, a look, a defensive call, a goal and the pros' call.

**Situation**:
The game state a puzzle starts from: down, distance, spot, hash, score, clock and timeouts.

**Goal**:
What a rep must achieve to convert: a first down or a touchdown.
_Avoid_: success condition, objective

**Look**:
The defense's pre-snap alignment, the only part of the defense the player sees. It may disguise the defensive call.

**Defensive call**:
The coverage and pressure the defense actually runs, hidden from the player.
_Avoid_: "the defense" on its own

**Pros' call**:
What the real team ran on this play, and what happened. It always failed to convert.
_Avoid_: real call

### The field

**Field**:
The playing surface every rep is resolved on: full length with 10-yard end zones, but only about 31.5 yards wide, so the whole width shows at true scale.
_Avoid_: NFL field

**Hash**:
Where across the field the ball is snapped from: the left hash, the middle or the right hash.

### The offense

**Formation**:
One of a fixed set of named offensive alignments, such as Gun Trey. A puzzle picks one and may flip it left to right.
_Avoid_: set, alignment

**Personnel**:
How many RBs and TEs a formation uses, written as two digits: 11 is one RB and one TE, 12 is one RB and two TEs.
_Avoid_: grouping, package

**Receiver letter**:
The fixed name of each of a formation's five eligible receivers: X and Z are the outside WRs, Y is the TE, H is the slot or second TE, and RB is the running back. Players see display names such as "Left WR" instead.
_Avoid_: receiver slot, position

### Designing a play

**Design**:
The player's protection, routes and first read.
_Avoid_: play, play call

**First read**:
The receiver the QB looks to first.
_Avoid_: primary read

### Reps

**Rep**:
One snap of a design against the puzzle; a puzzle allows up to four.
_Avoid_: attempt

**Play outcome**:
What happened on the snap: a completion with yards, an incompletion, an interception or a sack.

**Rep verdict**:
The play outcome judged against the goal: converted when a completion reaches the goal, short when a completion falls short of it (even for a loss), failed on an incompletion, interception or sack.

**Receiver feedback**:
The open, contested or covered mark each route runner gets after a rep.

**Yards gained**:
Whole yards from the line of scrimmage to where the play ends, with any fraction dropped, so 9.6 yards counts as 9. Rep verdicts, the bonus and every stat use it.

### Scoring

**Solved**:
A puzzle in which a rep converted. Players see it as beating the pros.
_Avoid_: won, beat

**Out of reps**:
A puzzle in which all four reps failed to convert.

**Score**:
A puzzle's points: 100, 75, 50 or 25 for solving it on rep 1, 2, 3 or 4, plus the bonus, or 0 when out of reps.

**Bonus**:
Points the converting rep adds to the score: 20 for a touchdown when the goal is a first down, otherwise 1 per yard gained past the line to gain, up to 10.
_Avoid_: quality bonus
