import type { ComponentProps, MouseEvent } from "react";
import { navigate } from "./navigate";

export function Link({ href, children, ...props }: ComponentProps<"a">) {
  function click(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !href
    ) {
      return;
    }
    event.preventDefault();
    navigate(href);
  }
  return (
    <a
      {...props}
      href={href}
      onClick={click}
      onKeyDown={(event) => {
        if (event.key === " ") {
          event.preventDefault();
          if (!event.repeat) event.currentTarget.click();
        }
      }}
    >
      {children}
    </a>
  );
}
