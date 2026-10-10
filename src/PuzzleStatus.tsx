export function PuzzleStatus({
  kind,
}: {
  kind: "loading" | "error" | "empty";
}) {
  return (
    <div className="puzzle-status" role="status" aria-live="polite">
      <span className="today-label">Today's puzzle</span>
      <h2>
        {kind === "loading"
          ? "Loading today's puzzle…"
          : kind === "error"
            ? "Couldn't load today's puzzle."
            : "No puzzle available yet."}
      </h2>
      <p>
        {kind === "loading"
          ? "Drawing up the situation."
          : kind === "error"
            ? "Please refresh to try again."
            : "Check back for the next situation."}
      </p>
    </div>
  );
}
