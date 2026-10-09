import type { Puzzle, Vec, ZoneId } from "../contract";
import { ballX } from "./formations";
import * as t from "./tuning";

export type Zone = { center: Vec; radii: Vec };
export function zoneCatalog(puzzle: Puzzle): Record<ZoneId, Zone> {
  const ball = ballX(puzzle);
  const half = t.FIELD_HALF_WIDTH_YARDS;
  const deep = (x: number, radius: number): Zone => ({
    center: { x, y: t.DEEP_DEPTH_YARDS },
    radii: { x: radius, y: t.DEEP_RADIUS_YARDS },
  });
  const hook = (offset: number, radius: number): Zone => ({
    center: { x: ball + offset, y: t.HOOK_DEPTH_YARDS },
    radii: { x: radius, y: t.HOOK_RADIUS_YARDS },
  });
  const curl = (side: number): Zone => ({
    center: {
      x: (ball + side * t.CURL_OFFSET_YARDS + side * t.CURL_OFFSET_YARDS) / 2,
      y: t.CURL_DEPTH_YARDS,
    },
    radii: { x: t.CURL_RADIUS_X_YARDS, y: t.FLAT_RADIUS_Y_YARDS },
  });
  const flat = (side: number): Zone => ({
    center: {
      x: side * (half - t.FLAT_RADIUS_X_YARDS),
      y: t.FLAT_DEPTH_ZONE_YARDS,
    },
    radii: { x: t.FLAT_RADIUS_X_YARDS, y: t.FLAT_RADIUS_Y_YARDS },
  });
  return {
    "deep-middle": deep(0, t.MIDDLE_RADIUS_YARDS),
    "deep-half-L": deep(-half / 2, half / 2),
    "deep-half-R": deep(half / 2, half / 2),
    "deep-third-L": deep((-half * 2) / 3, half / 3),
    "deep-third-M": deep(0, half / 3),
    "deep-third-R": deep((half * 2) / 3, half / 3),
    "deep-quarter-1": deep((-half * 3) / 4, half / 4),
    "deep-quarter-2": deep(-half / 4, half / 4),
    "deep-quarter-3": deep(half / 4, half / 4),
    "deep-quarter-4": deep((half * 3) / 4, half / 4),
    "hook-L": hook(-t.HOOK_OFFSET_YARDS, t.HOOK_RADIUS_YARDS),
    "hook-M": hook(0, t.HOOK_MIDDLE_RADIUS_YARDS),
    "hook-R": hook(t.HOOK_OFFSET_YARDS, t.HOOK_RADIUS_YARDS),
    "curl-flat-L": curl(-1),
    "curl-flat-R": curl(1),
    "flat-L": flat(-1),
    "flat-R": flat(1),
  };
}
export const zoneIds: readonly ZoneId[] = [
  "deep-half-L",
  "deep-half-R",
  "deep-third-L",
  "deep-third-M",
  "deep-third-R",
  "deep-quarter-1",
  "deep-quarter-2",
  "deep-quarter-3",
  "deep-quarter-4",
  "deep-middle",
  "hook-L",
  "hook-M",
  "hook-R",
  "curl-flat-L",
  "curl-flat-R",
  "flat-L",
  "flat-R",
];
