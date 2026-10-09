// Fixed geometry, yards; source: prototype notes (#4), range: fixed v1 field.
export const FIELD_HALF_WIDTH_YARDS = 15.75;
export const HASH_OFFSET_YARDS = 4;
export const NUMBERS_INSET_YARDS = 4;
export const END_ZONE_YARDS = 10;
export const FIELD_LENGTH_YARDS = 100;
export const MIN_SPOT_YARDS = 10;
export const MAX_SPOT_YARDS = 99;
export const BOUNDARY_MARGIN_YARDS = 1;
// Alignment, yards; source: prototype, range: free.
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
// Range: fixed at 0.75 yd; source: free (prototype Gap D outside Y).
export const GAP_D_OUTSIDE_YARDS = 0.75;
// Range: fixed at 1 yd; source: free (prototype RB release outside tackle).
export const RB_RELEASE_OUTSIDE_YARDS = 1;
// Route geometry, yards; source: prototype (#10/#13), range: fixed rule distances.
export const SHORT_BREAK_DEPTH_YARDS = 2;
export const FLAT_DEPTH_YARDS = 1;
export const HITCH_DEPTH_YARDS = 1; // Range: 0–1, prototype.
export const HOOK_BACK_YARDS = 2;
export const HOOK_INSIDE_YARDS = 1;
export const COMEBACK_BACK_YARDS = 2;
export const COMEBACK_OUTSIDE_YARDS = 2;
export const GO_THROW_DEPTH_YARDS = 10;
export const SHORT_DEPTHS_YARDS = [5, 10, 15] as const;
export const LONG_DEPTHS_YARDS = [10, 15] as const;
// Zone ellipses, yards; source: prototype ellipse table, range: free.
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
