// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import QrGenerator from "@/lib/tools/qr-generator";
import { DnsLookup } from "@/lib/tools/network-studio/components/DnsLookup";
import { UnifiedHttpTester } from "@/lib/tools/network-studio/components/UnifiedHttpTester";
import { WebSocketTester } from "@/lib/tools/network-studio/components/WebSocketTester";

describe("network tool disclosures", () => {
  it("does not present unsupported WHOIS functionality", () => {
    render(<DnsLookup />);
    expect(screen.getByText(/Resolve DNS records.*from the server/i)).toBeInTheDocument();
    expect(screen.queryByText(/WHOIS/i)).not.toBeInTheDocument();
  });

  it("states the browser HTTP and CORS boundary", () => {
    render(<UnifiedHttpTester />);
    expect(screen.getByText(/Requests run in your browser.*CORS/i)).toBeInTheDocument();
  });

  it("states that WebSocket testing ends after the handshake", () => {
    render(<WebSocketTester />);
    expect(screen.getByText(/verifies only the opening handshake/i)).toBeInTheDocument();
    expect(screen.getByText(/does not keep a connection open/i)).toBeInTheDocument();
  });

  it("discloses that QR content stays local", () => {
    render(<QrGenerator />);
    expect(screen.getByText(/no QR content is transmitted/i)).toBeInTheDocument();
    expect(screen.queryByText(/api\.qrserver\.com/i)).not.toBeInTheDocument();
  });
});
