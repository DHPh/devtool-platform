// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WebsiteDiagnosticTool } from "@/lib/tools/website-diagnostics-studio/WebsiteDiagnosticTool";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mockDiagnosticResult(result: unknown) {
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      new Response(JSON.stringify({ result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Phase 5 website-diagnostics UX", () => {
  it("discloses server processing and gives every returned value its own copy action", async () => {
    const fetchMock = mockDiagnosticResult({
      title: "Example",
      openGraph: {
        "og:type": "website",
        "og:image": "https://example.com/image.png",
      },
      warnings: ["Missing og:description"],
    });
    const user = userEvent.setup();

    render(<WebsiteDiagnosticTool operation="open-graph-inspector" />);

    expect(
      screen.getByText(/sent to this site's serverless diagnostic endpoint/i),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Inspect metadata" }));

    expect(
      await screen.findByRole("button", { name: "Copy result 1" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy result 2" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy result 3" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy result 4" })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/network/website-inspection",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          operation: "open-graph-inspector",
          url: "https://example.com",
        }),
      }),
    );
  });

  it("uses the DNS endpoint and includes the selected record type", async () => {
    const fetchMock = mockDiagnosticResult({
      consistent: true,
      resolvers: [{ name: "Cloudflare", records: ["93.184.216.34"] }],
    });
    const user = userEvent.setup();

    render(<WebsiteDiagnosticTool operation="dns-propagation-checker" />);

    expect(
      screen.getByRole("combobox", { name: "Record type" }),
    ).toHaveTextContent("A");
    await user.click(screen.getByRole("button", { name: "Check propagation" }));

    expect(
      await screen.findByRole("button", { name: "Copy result 1" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy result 2" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy result 3" })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/network/dns-inspection",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          operation: "dns-propagation-checker",
          domain: "example.com",
          recordType: "A",
        }),
      }),
    );
  });
});
