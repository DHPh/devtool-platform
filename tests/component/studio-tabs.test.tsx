// @vitest-environment jsdom

import { useState } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { StudioTabs } from "@/components/studio-tabs";
import type { StudioManifest } from "@/lib/studio-manifest";

beforeEach(() => {
  window.history.replaceState({}, "", "/tools/example-studio");
});

afterEach(cleanup);

function TestTab() {
  return <div>Tab content</div>;
}

function createManifest(tabCount: number): StudioManifest {
  return {
    id: "example-studio",
    directory: "example-studio",
    defaultTab: "tab-1",
    tabs: Array.from({ length: tabCount }, (_, index) => ({
      id: `tab-${index + 1}`,
      shortLabel: `Tab ${index + 1}`,
      label: `Example tool ${index + 1}`,
      icon: "Wrench",
      metadata: {},
      loadComponent: async () => ({ default: TestTab }),
    })),
  } as unknown as StudioManifest;
}

describe("studio tabs", () => {
  it.each([
    [3, ["grid-cols-2", "sm:grid-cols-3"]],
    [4, ["grid-cols-2", "sm:grid-cols-4"]],
    [8, ["grid-cols-2", "sm:grid-cols-4"]],
    [10, ["grid-cols-2", "sm:grid-cols-3", "lg:grid-cols-5"]],
  ])(
    "chooses a balanced responsive grid for %i tools",
    (tabCount, expectedClasses) => {
      render(
        <StudioTabs
          manifest={createManifest(tabCount)}
          componentProps={{}}
        />,
      );

      expect(screen.getByRole("tablist")).toHaveClass(
        "grid",
        "h-auto",
        "auto-rows-fr",
        ...expectedClasses,
      );
    },
  );

  it("gives every studio tab a compact, consistent minimum height", () => {
    render(
      <StudioTabs manifest={createManifest(4)} componentProps={{}} />,
    );

    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).toHaveClass(
        "h-full",
        "min-h-11",
        "min-w-0",
        "whitespace-normal",
      );
    }
  });

  it("hydrates the active tab from ?tab= and updates URL on tab click", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/tools/example-studio?tab=tab-3");

    render(
      <StudioTabs manifest={createManifest(4)} componentProps={{}} />,
    );

    expect(
      screen.getByRole("tab", { name: /Example tool 3/i }),
    ).toHaveAttribute("data-state", "active");

    await user.click(screen.getByRole("tab", { name: /Example tool 2/i }));

    expect(
      screen.getByRole("tab", { name: /Example tool 2/i }),
    ).toHaveAttribute("data-state", "active");
    expect(new URLSearchParams(window.location.search).get("tab")).toBe(
      "tab-2",
    );
  });

  it("syncs programmatic controlled tab changes to URL without snapping back", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/tools/example-studio?tab=tab-3");
    const manifest = createManifest(3);

    function ControlledHarness() {
      const [activeTab, setActiveTab] = useState("tab-1");
      return (
        <div>
          <button type="button" onClick={() => setActiveTab("tab-1")}>
            Jump to tab 1
          </button>
          <StudioTabs
            manifest={manifest}
            componentProps={{}}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      );
    }

    render(<ControlledHarness />);

    expect(
      screen.getByRole("tab", { name: /Example tool 3/i }),
    ).toHaveAttribute("data-state", "active");

    await user.click(screen.getByRole("button", { name: "Jump to tab 1" }));

    expect(
      screen.getByRole("tab", { name: /Example tool 1/i }),
    ).toHaveAttribute("data-state", "active");
    expect(new URLSearchParams(window.location.search).get("tab")).toBe(
      "tab-1",
    );
  });

  it("updates active tab on browser popstate navigation", () => {
    render(
      <StudioTabs manifest={createManifest(4)} componentProps={{}} />,
    );

    act(() => {
      window.history.pushState({}, "", "/tools/example-studio?tab=tab-4");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(
      screen.getByRole("tab", { name: /Example tool 4/i }),
    ).toHaveAttribute("data-state", "active");
  });
});
