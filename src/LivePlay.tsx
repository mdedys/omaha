import { useEffect, useRef } from "react";
import type { Caption } from "./result";

export function LivePanel({
  caption,
  onSkip,
}: {
  caption: Caption;
  onSkip: () => void;
}) {
  const skip = useRef<HTMLButtonElement>(null);
  useEffect(() => skip.current?.focus(), []);
  return (
    <aside className="live-panel" aria-label="Live play">
      <div className="live-caption" aria-live="polite">
        <b>{caption.word}</b>
        <span>{caption.line}</span>
      </div>
      <button
        ref={skip}
        type="button"
        className="live-skip"
        aria-label="Skip to result"
        onClick={onSkip}
      >
        <span>
          Skip<span className="live-skip-more"> to result</span>
        </span>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M5 5v14l9-7z" />
          <rect x="16" y="5" width="2.6" height="14" rx="1" />
        </svg>
        <kbd aria-hidden="true">Esc</kbd>
      </button>
    </aside>
  );
}
