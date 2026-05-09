import { describe, expect, it } from "vitest";
import { countText, encodeHtmlEntities, decodeHtmlEntities } from "@/lib/processors/tool-core";

describe("multilingual tool examples", () => {
  it("counts Chinese words without whitespace", () => {
    expect(countText("中文文字计数").words).toBeGreaterThan(1);
    expect(countText("……").words).toBe(0);
  });

  it("round-trips named entities and tolerates invalid numeric references", () => {
    expect(encodeHtmlEntities("© €")).toBe("&copy; &euro;");
    expect(decodeHtmlEntities("&copy; &euro;")).toBe("© €");
    expect(decodeHtmlEntities("&#99999999;")).toBe("�");
  });
});
