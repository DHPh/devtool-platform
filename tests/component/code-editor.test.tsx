// @vitest-environment jsdom

import { useState } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { CodeEditor } from "@/components/code-editor";

afterEach(cleanup);

describe("CodeEditor", () => {
  it("renders accessible textarea fallback in jsdom with spellCheck disabled and wrap toggle", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [val, setVal] = useState('{"hello":"world"}');
      return (
        <CodeEditor
          value={val}
          onChange={setVal}
          language="json"
          aria-label="JSON payload"
          showCopyButton
          showClearButton
        />
      );
    }

    render(<Harness />);

    const box = screen.getByRole("textbox", { name: "JSON payload" });
    expect(box).toHaveValue('{"hello":"world"}');
    expect(box).toHaveAttribute("spellcheck", "false");
    expect(screen.getByText("JSON")).toBeVisible();
    expect(screen.getByText("1 line · 17 chars")).toBeVisible();

    const wrapBtn = screen.getByRole("button", { name: "Toggle line wrap" });
    expect(wrapBtn).toHaveAttribute("aria-pressed", "true");
    await user.click(wrapBtn);
    expect(wrapBtn).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "Clear JSON payload" }));
    expect(box).toHaveValue("");
  });

  it("mounts CodeMirror 6 with line numbers and syncs external value and readOnly updates", async () => {
    function MountedHarness() {
      const [val, setVal] = useState("const a = 1;\nconst b = 2;");
      const [readOnly, setReadOnly] = useState(false);

      return (
        <div>
          <button type="button" onClick={() => setVal("const next = 3;")}>
            Replace value
          </button>
          <button type="button" onClick={() => setReadOnly(true)}>
            Lock editor
          </button>
          <CodeEditor
            _forceCodeMirror
            value={val}
            onChange={setVal}
            language="javascript"
            aria-label="JS source"
            readOnly={readOnly}
          />
        </div>
      );
    }

    const user = userEvent.setup();
    const { container } = render(<MountedHarness />);

    await waitFor(
      () => {
        expect(container.querySelector(".cm-editor")).not.toBeNull();
        expect(container.querySelector(".cm-lineNumbers")).not.toBeNull();
      },
      { timeout: 5000 },
    );

    const content = container.querySelector(".cm-content");
    expect(content).toHaveAttribute("aria-label", "JS source");
    expect(content).toHaveAttribute("spellcheck", "false");
    expect(content?.textContent).toContain("const a = 1;");

    await user.click(screen.getByRole("button", { name: "Replace value" }));
    await waitFor(() => {
      expect(container.querySelector(".cm-content")?.textContent).toContain(
        "const next = 3;",
      );
    });

    await user.click(screen.getByRole("button", { name: "Lock editor" }));
    expect(screen.getByText("Read-only")).toBeVisible();
    await waitFor(() => {
      expect(container.querySelector(".cm-content")).toHaveAttribute(
        "contenteditable",
        "false",
      );
    });
  });
});
