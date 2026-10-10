function go(path: string, replace: boolean) {
  if (replace) window.history.replaceState(null, "", path);
  else window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function navigate(path: string) {
  go(path, false);
}

export function redirect(path: string) {
  go(path, true);
}
