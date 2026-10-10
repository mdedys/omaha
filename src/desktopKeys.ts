import { useEffect, useSyncExternalStore } from "react";

const desktopQuery = "(min-width: 900px)";
function subscribe(onChange: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function useDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(desktopQuery).matches,
  );
}

// Handles a key at ≥900px unless a focused control owns it; `handle` returns
// whether it used the key.
export function useDesktopKeys(handle: (key: string) => boolean) {
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (
        !window.matchMedia(desktopQuery).matches ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement) {
        if (
          target.isContentEditable ||
          target.closest("input, textarea, select")
        ) {
          return;
        }
        if (event.key.startsWith("Arrow") && target.closest('[role="radio"]')) {
          return;
        }
        if (event.key === "Enter" && target.closest("button, a")) return;
      }
      if (handle(event.key)) event.preventDefault();
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [handle]);
}
