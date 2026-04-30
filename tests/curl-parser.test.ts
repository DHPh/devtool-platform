import { describe, expect, it } from "vitest";

import {
  generateCurlCommand,
  parseCurlCommand,
} from "@/lib/utils/network/api-client";

describe("cURL command parser & generator", () => {
  it("parses multiline curl commands with flags in any order", () => {
    const parsed = parseCurlCommand(`curl 'https://api.example.com/v1/items?active=true' \\
      --request POST \\
      -H 'Authorization: Bearer abc:123' \\
      --header "X-Custom: hello" \\
      --data-raw '{"name":"DevTool"}'`);

    expect(parsed).toEqual({
      url: "https://api.example.com/v1/items?active=true",
      method: "POST",
      headers: {
        Authorization: "Bearer abc:123",
        "X-Custom": "hello",
      },
      body: '{"name":"DevTool"}',
    });
  });

  it("infers POST when --data is provided without -X and respects --get", () => {
    const inferredPost = parseCurlCommand(
      'curl -d "{\\"ok\\":true}" https://api.example.com/submit',
    );
    expect(inferredPost?.method).toBe("POST");
    expect(inferredPost?.body).toBe('{"ok":true}');

    const forcedGet = parseCurlCommand(
      "curl -G -d 'q=search' https://api.example.com/find",
    );
    expect(forcedGet?.method).toBe("GET");
    expect(forcedGet?.body).toBe("q=search");
  });

  it("round-trips generated curl commands safely", () => {
    const request = {
      url: "https://api.example.com/users",
      method: "PUT" as const,
      headers: { "Content-Type": "application/json" },
      body: `{"note":"it's working"}`,
    };

    const generated = generateCurlCommand(request);
    const parsed = parseCurlCommand(generated);

    expect(parsed).toEqual(request);
  });
});
