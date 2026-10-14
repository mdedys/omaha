import type { Engine, Puzzle, Rep } from "./engine/contract";
import { shareResult } from "./share";
import type { ShareResult, ShareTile } from "./share";
import "./ShareCard.css";

function TileFace({ tile }: { tile: ShareTile }) {
  switch (tile.kind) {
    case "fail":
      return (
        <svg
          className="share-icon-fail"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M7 7l10 10M17 7L7 17" />
        </svg>
      );
    case "converted":
      return (
        <svg
          className="share-icon-check"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 12.5l4 4 8-9" />
        </svg>
      );
    case "short":
      return tile.yards;
    case "not needed":
      return null;
  }
}

function Tiles({ share }: { share: ShareResult }) {
  return (
    <div className="share-tiles" role="img" aria-label={share.tilesLabel}>
      {share.tiles.map((tile, index) => (
        <div
          key={index}
          className={`share-rep ${tile.kind === "not needed" ? "not-needed" : tile.kind}`}
        >
          <span className="share-tile">
            <TileFace tile={tile} />
          </span>
          <span className="share-rep-label">
            Rep {index + 1}
            <br />
            {tile.kind === "not needed" ? "—" : tile.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function Footer({ share }: { share: ShareResult }) {
  return (
    <div className="share-card-footer">
      <span className={`share-chip ${share.variant}`}>{share.chip}</span>
      <span className="share-points">{share.points} pts</span>
    </div>
  );
}

export function ShareCard({ share }: { share: ShareResult }) {
  return (
    <section className="share-card" aria-label="Share card preview">
      <div className="share-card-top">
        <span>OMAHA #{share.number}</span>
        <span className="share-card-situation">{share.situation}</span>
      </div>
      <Tiles share={share} />
      <Footer share={share} />
    </section>
  );
}

export function LinkPreviewCard({
  puzzle,
  engine,
  reps,
}: {
  puzzle: Puzzle;
  engine: Engine;
  reps: readonly Rep[];
}) {
  const share = shareResult(puzzle, engine, reps);
  return (
    <div className="link-preview">
      <div className="link-preview-copy">
        <div className="link-preview-head">
          <span className="link-preview-wordmark">OMAHA</span>
          <span className="link-preview-result">
            #{share.number} · {share.situation} · {share.status}
          </span>
          <span className="link-preview-tagline">
            Can you out-coach the pros?
          </span>
        </div>
        <span className="link-preview-button">Play today's puzzle</span>
      </div>
      <div className="link-preview-panel">
        <Tiles share={share} />
        <Footer share={share} />
      </div>
    </div>
  );
}
