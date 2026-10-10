import { describe, expect, it } from "vitest";
import index from "../public/puzzles/index.json";
import first from "../public/puzzles/1.json";
import second from "../public/puzzles/2.json";
import { publishedPuzzles } from "./puzzles";

function entry(number: number, date: string) {
  return { number, date, down: 1, distance: 10, spot: 25, label: "Go." };
}

describe("published puzzles", () => {
  it("lists entries dated on or before today, newest first", () => {
    const listed = publishedPuzzles(
      [
        entry(1, "2026-10-01"),
        entry(4, "2026-10-11"),
        entry(3, "2026-10-10"),
        entry(2, "2026-10-05"),
      ],
      "2026-10-10",
    );
    expect(listed.map(({ number }) => number)).toEqual([3, 2, 1]);
  });

  it("keeps index order for entries sharing a date", () => {
    const listed = publishedPuzzles(
      [entry(7, "2026-10-09"), entry(8, "2026-10-09")],
      "2026-10-10",
    );
    expect(listed.map(({ number }) => number)).toEqual([7, 8]);
  });
});

describe("puzzle index", () => {
  it("matches each puzzle file's number, date and situation", () => {
    const files = [first, second].map(({ number, date, situation }) => ({
      number,
      date,
      down: situation.down,
      distance: situation.distance,
      spot: situation.spot,
    }));
    expect(
      index.map(({ number, date, down, distance, spot }) => ({
        number,
        date,
        down,
        distance,
        spot,
      })),
    ).toEqual(files);
  });
});
