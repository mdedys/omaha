import { describe, expect, it } from "vitest";
import { thumbnailLines } from "./thumbnail";

function lines(distance: number, spot: number) {
  return thumbnailLines({ distance, spot });
}

describe("thumbnail lines", () => {
  it.each([
    [7, 30, 27.2],
    [10, 45, 20],
    [14, 65, 10.4],
  ])("draws %i yards to go at 2.4 units per yard", (distance, spot, y) => {
    expect(lines(distance, spot).lineToGain).toBe(y);
  });

  it.each([1, 2, 4])(
    "keeps %i yards to go 10 units above the line of scrimmage",
    (distance) => {
      expect(lines(distance, 59).lineToGain).toBe(34);
    },
  );

  it("draws the goal line at the same scale when it falls in the frame", () => {
    expect(lines(10, 85)).toEqual({ lineToGain: 20, goalLine: 8 });
  });

  it("leaves out a goal line beyond the frame", () => {
    expect(lines(4, 78)).toEqual({ lineToGain: 34, goalLine: null });
  });

  it("puts goal-to-go's line to gain on the goal line", () => {
    expect(lines(6, 94)).toEqual({ lineToGain: 29.6, goalLine: 29.6 });
  });
});
