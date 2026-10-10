import type { Page } from "@playwright/test";

// Resolves after the tasks already queued, such as React's render of the
// last animation frame. The page clock doesn't fake message channels.
export function rendered(page: Page) {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = resolve;
        channel.port2.postMessage(null);
      }),
  );
}

// The screen as markup: React leaves an empty style attribute where an inline
// style was removed, which draws nothing.
export function screenMarkup(page: Page) {
  return page
    .locator("main")
    .evaluate((main) => main.outerHTML.replaceAll(' style=""', ""));
}
