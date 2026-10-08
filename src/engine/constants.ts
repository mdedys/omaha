// Every tunable the engine reads. Distances in yards, times in seconds,
// speeds in yards per second.

export const TICK = 0.05;
export const toTicks = (seconds: number): number => Math.round(seconds / TICK);
export const TICK_CAP = 20;

export const FIELD_HALF_WIDTH = 15.75;
export const NUMBERS_INSET = 4;
export const BOUNDARY_MARGIN = 1;

export const CONTEST_RADIUS = 1;
export const OPEN_SEPARATION = 3;
export const TACKLE_RADIUS = 1;

// Average speeds over a route: a WR covers 10 yd past the line in about 1.6 s,
// and every other role keeps its ratio to the WR.
export const SPEED = {
  WR: 6.5,
  TE: 5.78,
  RB: 6.14,
  OL: 4.33,
  CB: 6.5,
  S: 6.21,
  LB: 5.49,
  DL: 4.77,
} as const;

// Gun Trey, strong side right, ball on the middle of the field.
export const LINE_DEPTH = 0.5;
export const LINE_SPLIT = 1.5;
export const TE_SPLIT = 1.5;
export const SLOT_DEPTH = 1.5;
export const SHOTGUN_DEPTH = 5;
export const RB_OFFSET = 1.5;

export const GAP_D_OUTSIDE = 0.75;
export const PASS_SET_DEPTH = 1;
export const ENGAGE_OFFSET = 0.7;
export const HOLD_TIME = 2.5;
export const SACK_RADIUS = 1.5;
export const PRESSURE_RADIUS = 2;

export const QB_SET_DEPTH = 7;
export const QB_DROP_SPEED = 4;
export const READ_TIME = 0.5;
export const BALL_SPEED = 25;
export const THROWAWAY_PAST_SIDELINE = 1;

export const RB_RELEASE_OUTSIDE = 1;
export const SHORT_BREAK_DEPTH = 2;
export const FLAT_DEPTH = 1;
export const HITCH_DEPTH = 1;
export const HOOK_BACK = 2;
export const HOOK_INSIDE = 1;
export const COMEBACK_BACK = 2;
export const COMEBACK_OUTSIDE = 2;
export const GO_THROW_DEPTH = 10;
export const HARD_BREAK_TIME = 0.15;
export const SOFT_BREAK_TIME = 0.05;
export const BREAK_SPEED_FACTOR = 0.5;

export const REACTION_DELAY = 0.3;
// cos 45°: a heading change at least this sharp is a break.
export const BREAK_COSINE = Math.SQRT1_2;
export const TRAIL_DISTANCE = 1;
export const CARRY_DISTANCE = 6;
export const BALL_BREAK_RADIUS = 6;
export const RUB_RADIUS = 0.75;
// A rubbed defender moves at this share of his speed for the rub time.
export const RUB_TIME = 0.6;
export const RUB_SPEED_FACTOR = 0.5;
// The ball carrier keeps a new heading at least this long.
export const CUT_HOLD = 0.3;

// Zone ellipses (center and radii) with the ball on the middle hash, so the
// hooks and curl-flats, placed from the ball, need no hash shift.
export const ZONES = {
  "deep-middle": { x: 0, y: 15, rx: 10, ry: 8 },
  "deep-half-L": { x: -7.875, y: 15, rx: 7.875, ry: 8 },
  "deep-half-R": { x: 7.875, y: 15, rx: 7.875, ry: 8 },
  "deep-third-L": { x: -10.5, y: 15, rx: 5.25, ry: 8 },
  "deep-third-M": { x: 0, y: 15, rx: 5.25, ry: 8 },
  "deep-third-R": { x: 10.5, y: 15, rx: 5.25, ry: 8 },
  "hook-L": { x: -5, y: 6.5, rx: 3.5, ry: 3.5 },
  "hook-M": { x: 0, y: 6.5, rx: 3, ry: 3.5 },
  "hook-R": { x: 5, y: 6.5, rx: 3.5, ry: 3.5 },
  "curl-flat-L": { x: -10, y: 7, rx: 3.5, ry: 4 },
  "curl-flat-R": { x: 10, y: 7, rx: 3.5, ry: 4 },
  "flat-L": { x: -13.25, y: 4, rx: 2.5, ry: 4 },
  "flat-R": { x: 13.25, y: 4, rx: 2.5, ry: 4 },
} as const;
