import { useEffect, useState } from "react";

// Seconds since `run` started, on animation frames, until `end`; then
// `onEnd` runs. A different `run` starts again from 0.
export function usePlaybackSeconds(
  run: number | null,
  end: number,
  onEnd: () => void,
) {
  const [clock, setClock] = useState({ run, seconds: 0 });
  useEffect(() => {
    if (run === null) return;
    let start: number | undefined;
    let frame = requestAnimationFrame(function tick(now) {
      start ??= now;
      const seconds = (now - start) / 1000;
      if (seconds >= end) {
        onEnd();
        return;
      }
      setClock({ run, seconds });
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [run, end, onEnd]);
  return clock.run === run ? clock.seconds : 0;
}
