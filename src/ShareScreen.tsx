import { useEffect, useState } from "react";
import { Link } from "./Link";
import { navigate } from "./navigate";
import { countdown, nextPuzzleAt } from "./share";
import type { ShareResult } from "./share";
import { ShareCard } from "./ShareCard";
import "./ShareScreen.css";

const COPIED_MS = 2000;

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 12.5l4 4 8-9" />
    </svg>
  );
}

// Ticks when the whole seconds left change, and stops at zero.
function useTimeLeft(target: number) {
  const [now, setNow] = useState(Date.now);
  const left = target - now;
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(
      () => setNow(Date.now()),
      (target - Date.now()) % 1000 || 1000,
    );
    return () => clearTimeout(id);
  }, [target, left]);
  return left;
}

export function ShareScreen({ share }: { share: ShareResult }) {
  const [copied, setCopied] = useState<"copy" | "share" | null>(null);
  const [nextAt] = useState(() => nextPuzzleAt(Date.now()));
  const left = useTimeLeft(nextAt);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(null), COPIED_MS);
    return () => clearTimeout(id);
  }, [copied]);
  function copy(button: "copy" | "share") {
    navigator.clipboard.writeText(share.text).then(() => setCopied(button));
  }
  function shareText() {
    if (!navigator.share) {
      copy("share");
      return;
    }
    navigator.share({ text: share.text }).catch((error: unknown) => {
      // The player closed the share sheet.
      if (error instanceof DOMException && error.name === "AbortError") return;
      throw error;
    });
  }
  return (
    <main className={`share-screen share-${share.variant}`}>
      <header className="share-header">
        <span className="share-brand">OMAHA</span>
        <button
          type="button"
          className="share-close"
          aria-label="Close"
          onClick={() => navigate("/")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>
      <div className="share-body">
        <div className="share-headline">
          <h1>{share.headline}</h1>
          <p>{share.line}</p>
        </div>
        <ShareCard share={share} />
        <div className="share-vs">
          <div className="share-pros">
            <span>The pros</span>
            <b>{share.pros}</b>
          </div>
          <div className="share-you">
            <span>You</span>
            <b>{share.you}</b>
          </div>
        </div>
        <div className="share-stats">
          <div className="share-stat">
            <b>{share.points}</b>
            <span>score</span>
          </div>
          <div className="share-stat">
            <b>—</b>
            <span>day streak</span>
          </div>
          <div className="share-stat">
            <b>—</b>
            <span>beat the pros</span>
          </div>
        </div>
        <div className="share-actions">
          <div className="share-buttons">
            <button
              type="button"
              className="share-copy"
              aria-label="Copy result"
              onClick={() => copy("copy")}
            >
              {copied === "copy" ? (
                <>
                  <Check />
                  <span>Copied</span>
                </>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V6a2 2 0 0 1 2-2h9" />
                </svg>
              )}
            </button>
            <button type="button" className="share-cta" onClick={shareText}>
              {copied === "share" ? (
                <>
                  <Check />
                  Copied
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 15V3M7 8l5-5 5 5" />
                    <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
                  </svg>
                  Share result
                </>
              )}
            </button>
          </div>
          {left > 0 ? (
            <p className="share-countdown">Next puzzle in {countdown(left)}</p>
          ) : (
            <Link className="share-countdown" href="/">
              New puzzle is out
            </Link>
          )}
        </div>
        <p className="visually-hidden" aria-live="polite">
          {copied ? "Copied to clipboard" : ""}
        </p>
      </div>
    </main>
  );
}
