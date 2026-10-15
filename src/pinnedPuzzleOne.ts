import puzzleOneJson from "../public/puzzles/1.json";
import tutorial from "./tutorial.json";

// Puzzle 1's situation against the tutorial's fixed defense, so tests that pin
// reps, coverage names or flipped formations don't change when puzzle 1's
// defense does.
export const puzzleOne = {
  ...puzzleOneJson,
  defense: tutorial.defense,
  coverageName: tutorial.coverageName,
};
