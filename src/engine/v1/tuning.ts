// Field width, numbers and boundary margin, yards; range: fixed v1 field;
// source: prototype.
export const FIELD_HALF_WIDTH_YARDS = 15.75;
export const NUMBERS_INSET_YARDS = 4;
export const BOUNDARY_MARGIN_YARDS = 1;
// Hashes, end zones, field length and the puzzle's spot limits, yards; range:
// fixed v1 field and puzzle format; source: free, from the field rules.
export const HASH_OFFSET_YARDS = 4;
export const END_ZONE_YARDS = 10;
export const FIELD_LENGTH_YARDS = 100;
export const MIN_SPOT_YARDS = 10;
export const MAX_SPOT_YARDS = 99;
// Alignment, yards; range: free; source: prototype.
export const LINE_DEPTH_YARDS = 0.5;
export const LINE_SPLIT_YARDS = 1.5;
export const TE_SPLIT_YARDS = 1.5;
export const SLOT_DEPTH_YARDS = 1.5;
export const SHOTGUN_DEPTH_YARDS = 5;
export const UNDER_CENTER_DEPTH_YARDS = 1;
export const RB_OFFSET_YARDS = 1.5;
// Range: fixed at 7 yd; source: free, from the resolved Ace formation rule.
// PROTOTYPE_NOTES.md does not specify an Ace RB depth.
export const ACE_RB_DEPTH_YARDS = 7;
// Range: free; source: prototype.
export const GAP_D_OUTSIDE_YARDS = 0.75;
// Range: free; source: prototype.
export const RB_RELEASE_OUTSIDE_YARDS = 1;
// Route geometry, yards; range: fixed route-tree distances; source: prototype.
export const SHORT_BREAK_DEPTH_YARDS = 2;
export const FLAT_DEPTH_YARDS = 1;
export const HITCH_DEPTH_YARDS = 1; // Range: 0–1, prototype.
export const HOOK_BACK_YARDS = 2;
export const HOOK_INSIDE_YARDS = 1;
export const COMEBACK_BACK_YARDS = 2;
export const COMEBACK_OUTSIDE_YARDS = 2;
export const GO_THROW_DEPTH_YARDS = 10;
// Route depths a player may pick, yards; range: fixed route-tree depths;
// source: free, from the route tree.
export const SHORT_DEPTHS_YARDS = [5, 10, 15] as const;
export const LONG_DEPTHS_YARDS = [10, 15] as const;
// Zone ellipses, yards; range: free; source: prototype ellipse table.
export const DEEP_DEPTH_YARDS = 15;
export const DEEP_RADIUS_YARDS = 8;
export const MIDDLE_RADIUS_YARDS = 10;
export const HOOK_OFFSET_YARDS = 5;
export const HOOK_DEPTH_YARDS = 6.5;
export const HOOK_RADIUS_YARDS = 3.5;
export const HOOK_MIDDLE_RADIUS_YARDS = 3;
export const CURL_OFFSET_YARDS = 10;
export const CURL_DEPTH_YARDS = 7;
export const CURL_RADIUS_X_YARDS = 3.5;
export const FLAT_DEPTH_ZONE_YARDS = 4;
export const FLAT_RADIUS_X_YARDS = 2.5;
export const FLAT_RADIUS_Y_YARDS = 4;
// Range: fixed at 20 s; source: prototype (engine-error cap).
export const REP_CAP_SECONDS = 20;
// Role speeds, yards per second; range: WR 10 yd past the line in about 1.6 s,
// every other role at its prototype ratio to the WR; source: prototype.
export const WR_SPEED_YARDS_PER_SECOND = 6.5;
export const TE_SPEED_YARDS_PER_SECOND = 5.78;
export const RB_SPEED_YARDS_PER_SECOND = 6.14;
export const OL_SPEED_YARDS_PER_SECOND = 4.33;
export const DL_SPEED_YARDS_PER_SECOND = 4.77;
export const LB_SPEED_YARDS_PER_SECOND = 5.49;
export const CB_SPEED_YARDS_PER_SECOND = 6.5;
export const S_SPEED_YARDS_PER_SECOND = 6.21;
// Range: 4–5 yd/s, set about 0.5 s after a shotgun snap; source: prototype.
export const QB_DROP_SPEED_YARDS_PER_SECOND = 4;
// Range: about 7 yd; source: prototype.
export const QB_SET_DEPTH_YARDS = 7;
// Route breaks, in seconds and as a share of role speed; range: free; source:
// prototype.
export const HARD_BREAK_SECONDS = 0.15;
export const SOFT_BREAK_SECONDS = 0.05;
export const BREAK_SPEED_FACTOR = 0.5;
// Range: free; source: prototype.
export const REACTION_DELAY_SECONDS = 0.3;
// Range: 2.5–4.5 s; source: ESPN (2.5 s pass-block win), 4.5 s average time
// to sack. Kept at the bottom so a long, covered read order still ends in
// `sack-beat-block` (scenario `hold-time-sack`).
export const HOLD_TIME_SECONDS = 2.5;
// Range: at most 1.5 yd; source: NGS.
export const SACK_RADIUS_YARDS = 1.5;
// Range: about 2 yd; source: prototype.
export const PRESSURE_RADIUS_YARDS = 2;
// Where a block is met: the rusher at the pass-set depth behind his gap, his
// blocker the engage offset behind him; range: free; source: prototype.
export const PASS_SET_DEPTH_YARDS = 1;
export const ENGAGE_OFFSET_YARDS = 0.7;
// Badges: open at or past the open separation, contested at or past the
// contest radius; range: 3 yd and about 1 yd; source: prototype.
export const OPEN_SEPARATION_YARDS = 3;
export const CONTEST_RADIUS_YARDS = 1;
// Range: about 0.5 s; source: prototype.
export const READ_TIME_SECONDS = 0.5;
// Range: 20–28 yd/s; source: prototype.
export const BALL_SPEED_YARDS_PER_SECOND = 25;
// Range: free; source: prototype.
export const THROWAWAY_PAST_SIDELINE_YARDS = 1;
// Range: free; source: prototype.
export const TRAIL_DISTANCE_YARDS = 1;
// Range: about 0.75 yd; source: prototype.
export const RUB_CONTACT_RADIUS_YARDS = 0.75;
// The rub's slowdown, in seconds and as a share of role speed; range: about
// 0.6 s at about half speed; source: prototype.
export const RUB_TIME_SECONDS = 0.6;
export const RUB_SPEED_FACTOR = 0.5;
// Range: free; source: prototype.
export const BALL_BREAK_RADIUS_YARDS = 6;
// How far shallower than a deep defender a receiver in his zone may be and
// still be carried; range: free; source: prototype.
export const CARRY_DISTANCE_YARDS = 6;
// Range: about 1 yd, never above the contest radius; source: NGS (close-in
// distance), prototype value.
export const TACKLE_RADIUS_YARDS = 1;
// How long the ball carrier keeps a new heading; range: keep 0.3 s; source:
// prototype.
export const CUT_HOLD_SECONDS = 0.3;
