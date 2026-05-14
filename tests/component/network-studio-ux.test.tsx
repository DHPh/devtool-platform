// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { serverPortScan, serverSpeedTest, serverFileLinkCheck, toast } = vi.hoisted(
  () => ({
    serverPortScan: vi.fn(),
    serverSpeedTest: vi.fn(),
    serverFileLinkCheck: vi.fn(),
    toast: { error: vi.fn(), success: vi.fn() },
  }),
);

vi.mock("@/lib/utils/network/server-api-client", () => ({
  serverPortScan,
  serverSpeedTest,
  serverFileLinkCheck,
}));
vi.mock("sonner", () => ({ toast }));

import { PortScanner } from "@/lib/tools/network-studio/components/PortScanner";
import { NetworkMonitor } from "@/lib/tools/network-studio/components/NetworkMonitor";
import { FileLinkChecker } from "@/lib/tools/network-studio/components/FileLinkChecker";
import { SUPPORTED_SCAN_PROFILES } from "@/lib/utils/network/network-monitor";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("network studio error UX", () => {
  it("only exposes profiles that fit the scan endpoint limit", () => {
    expect(SUPPORTED_SCAN_PROFILES.map((profile) => profile.name)).not.toContain("All TCP Ports");
    expect(SUPPORTED_SCAN_PROFILES.length).toBeGreaterThan(0);
    expect(SUPPORTED_SCAN_PROFILES.every((profile) => profile.ports.length <= 20)).toBe(true);
  });

  it("shows failed port checks separately from closed ports", async () => {
    const user = userEvent.setup();
    serverPortScan.mockResolvedValue([
      { host: "example.com", port: 443, open: false, error: "Connection timeout", timestamp: 1 },
      { host: "example.com", port: 80, open: false, timestamp: 1 },
    ]);
    render(<PortScanner />);

    await user.type(screen.getByPlaceholderText("example.com or 192.168.1.1"), "example.com");
    await user.click(screen.getByRole("button", { name: "Start Scan" }));

    expect(await screen.findByText("Could Not Check")).toBeVisible();
    expect(screen.getByText("Closed/Filtered Ports")).toBeVisible();
    expect(screen.getByText("Connection timeout")).toBeVisible();
    expect(screen.getByText("Port 80")).toBeVisible();
  });

  it("keeps scan API failures as an error instead of fabricated closed ports", async () => {
    const user = userEvent.setup();
    serverPortScan.mockRejectedValue(new Error("Scan limit exceeded"));
    render(<PortScanner />);

    await user.type(screen.getByPlaceholderText("example.com or 192.168.1.1"), "example.com");
    await user.click(screen.getByRole("button", { name: "Start Scan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Scan failed: Scan limit exceeded");
    expect(screen.queryByText("Closed/Filtered Ports")).not.toBeInTheDocument();
  });

  it("shows a speed-test error without a success notification", async () => {
    const user = userEvent.setup();
    serverSpeedTest.mockRejectedValue(new Error("Upstream unavailable"));
    render(<NetworkMonitor />);

    await user.click(screen.getByRole("button", { name: "Run Speed Test" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Speed test failed: Upstream unavailable");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("labels a link probe error as failed, not not-found", async () => {
    const user = userEvent.setup();
    serverFileLinkCheck.mockResolvedValue({
      url: "https://example.com/file.pdf",
      exists: false,
      error: "Rate limit exceeded",
      timestamp: 1,
    });
    render(<FileLinkChecker />);

    await user.type(screen.getByPlaceholderText("https://example.com/file.pdf"), "https://example.com/file.pdf");
    await user.click(screen.getByRole("button", { name: "Check File" }));

    expect(await screen.findAllByText("Check Failed")).toHaveLength(2);
    expect(screen.queryByText("Not Found")).not.toBeInTheDocument();
  });

  it("does not label an upstream 503 response as not-found", async () => {
    const user = userEvent.setup();
    serverFileLinkCheck.mockResolvedValue({
      url: "https://example.com/file.pdf",
      exists: false,
      statusCode: 503,
      statusText: "Service Unavailable",
      timestamp: 1,
    });
    render(<FileLinkChecker />);

    await user.type(screen.getByPlaceholderText("https://example.com/file.pdf"), "https://example.com/file.pdf");
    await user.click(screen.getByRole("button", { name: "Check File" }));

    expect(await screen.findByText("Unavailable")).toBeVisible();
    expect(screen.queryByText("Not Found")).not.toBeInTheDocument();
  });
});
