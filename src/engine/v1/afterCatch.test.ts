import { describe, expect, it } from "vitest";
import { chooseHeading, interceptPoint } from "./afterCatch";

const wrStep = 6.5 * 0.05;
const cbStep = 6.5 * 0.05;
const dlStep = 4.77 * 0.05;
const carrier = { at: { x: 0, y: 0 }, step: wrStep };

describe("the ball carrier's heading", () => {
  it("takes the heading that reaches the target line first over one that gains more", () => {
    // Straight upfield reaches the line 9 yd ahead before the DL can cut it
    // off; 45° inside would run farther before he gets there.
    expect(
      chooseHeading(carrier, 1, [{ at: { x: -3, y: 22 }, step: dlStep }], 9),
    ).toBe("upfield");
  });
  it("takes the heading that gains most when none reaches the target line", () => {
    expect(
      chooseHeading(carrier, 1, [{ at: { x: 2, y: 4 }, step: cbStep }], 9),
    ).toBe("outside");
  });
  it("breaks a tie upfield first", () => {
    // A defender inside the tackle radius leaves every heading no free run.
    expect(
      chooseHeading(carrier, 1, [{ at: { x: 0, y: 0.5 }, step: cbStep }], 9),
    ).toBe("upfield");
  });
  it("breaks a tie between the 45° headings toward the middle", () => {
    // Both 45° headings reach the line and upfield doesn't; past the middle
    // from his own side, the middle is outside.
    expect(
      chooseHeading(
        { at: { x: 2, y: 0 }, step: wrStep },
        1,
        [{ at: { x: 1, y: 16 }, step: dlStep }],
        9,
      ),
    ).toBe("outside");
  });
  it("drops a heading whose step would cross the boundary margin", () => {
    // 45° outside would gain most before the corner closes, but the margin
    // is 0.15 yd away.
    expect(
      chooseHeading(
        { at: { x: 14.6, y: 0 }, step: wrStep },
        -1,
        [{ at: { x: 13.6, y: 0.6 }, step: cbStep }],
        9,
      ),
    ).toBe("upfield");
  });
});

describe("the intercept point", () => {
  it("is where the pursuer meets a carrier who keeps his velocity", () => {
    const point = interceptPoint(
      { x: 0, y: 0 },
      { x: 0, y: wrStep },
      { at: { x: 6, y: 8 }, step: cbStep },
    );
    expect(point).toEqual({ x: 0, y: expect.closeTo(6.25, 9) });
  });
  it("is the carrier's spot when the pursuer can never reach him", () => {
    expect(
      interceptPoint(
        { x: 0, y: 0 },
        { x: 0, y: wrStep },
        { at: { x: 0, y: -5 }, step: dlStep },
      ),
    ).toEqual({ x: 0, y: 0 });
  });
});
