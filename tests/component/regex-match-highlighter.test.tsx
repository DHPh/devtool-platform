// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RegexMatchHighlighter } from "@/lib/tools/regex-studio/components/RegexMatchHighlighter";

describe("RegexMatchHighlighter", () => {
  it("renders matched and unmatched HTML-like input as inert text", () => {
    const matched = '<img src=x onerror="alert(1)">';
    const unmatched = '<svg onload="alert(2)"></svg>';
    const text = `${matched} ${unmatched}`;
    const { container } = render(
      <RegexMatchHighlighter
        text={text}
        matches={[{ match: matched, index: 0, length: matched.length }]}
      />
    );

    expect(container.textContent).toBe(text);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector("[onerror], [onload]")).toBeNull();

    const mark = container.querySelector("mark");
    expect(mark).not.toBeNull();
    expect(mark).toHaveTextContent(matched);
    expect(mark).toHaveAttribute("data-match", "0");
  });

  it("does not interpret markup-breaking match content", () => {
    const payload = '</mark><script>globalThis.compromised = true</script><mark>';
    const text = `before ${payload} after`;
    const index = text.indexOf(payload);
    const { container } = render(
      <RegexMatchHighlighter
        text={text}
        matches={[{ match: payload, index, length: payload.length }]}
      />
    );

    expect(container.textContent).toBe(text);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelectorAll("mark")).toHaveLength(1);
    expect(container.querySelector("mark")).toHaveTextContent(payload);
  });
});
