import type { Vec } from "./types.ts";

export const vec = (x: number, y: number): Vec => ({ x, y });
export const add = (a: Vec, b: Vec): Vec => vec(a.x + b.x, a.y + b.y);
export const sub = (a: Vec, b: Vec): Vec => vec(a.x - b.x, a.y - b.y);
export const scale = (a: Vec, k: number): Vec => vec(a.x * k, a.y * k);
export const dot = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y;
export const length = (a: Vec): number => Math.sqrt(dot(a, a));
export const distance = (a: Vec, b: Vec): number => length(sub(a, b));

export function stepToward(from: Vec, to: Vec, maxStep: number): Vec {
  const gap = distance(from, to);
  return gap <= maxStep ? to : add(from, scale(sub(to, from), maxStep / gap));
}

// Smallest positive root of a·s² + b·s + c = 0, or Infinity when none.
export function firstPositiveRoot(a: number, b: number, c: number): number {
  if (Math.abs(a) < 1e-9) {
    const s = b === 0 ? -1 : -c / b;
    return s > 0 ? s : Infinity;
  }
  const disc = b * b - 4 * a * c;
  if (disc < 0) return Infinity;
  const root = Math.sqrt(disc);
  const roots = [(-b - root) / (2 * a), (-b + root) / (2 * a)].filter(
    (s) => s > 0,
  );
  return roots.length ? Math.min(...roots) : Infinity;
}
