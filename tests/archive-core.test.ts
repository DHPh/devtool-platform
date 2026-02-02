import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  extractZip,
  inspectZip,
  sanitizeZipPath,
  ZIP_LIMITS,
  ZipValidationError,
} from "@/lib/processors/archive-core";

async function makeZip(entries: Record<string, string>): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const [path, contents] of Object.entries(entries)) zip.file(path, contents);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

describe("archive processor", () => {
  it("inspects and extracts the actual ZIP entries and contents", async () => {
    const input = await makeZip({ "docs/readme.txt": "hello", "data.json": '{"ok":true}' });

    await expect(inspectZip(input)).resolves.toEqual([
      { name: "docs", path: "docs/", size: 0, isDirectory: true },
      { name: "readme.txt", path: "docs/readme.txt", size: 5, isDirectory: false },
      { name: "data.json", path: "data.json", size: 11, isDirectory: false },
    ]);

    const files = await extractZip(input);
    expect(files.map(({ path, size }) => ({ path, size }))).toEqual([
      { path: "docs/readme.txt", size: 5 },
      { path: "data.json", size: 11 },
    ]);
    expect(new TextDecoder().decode(files[0].data)).toBe("hello");
  });

  it("rejects invalid ZIP data with a safe error", async () => {
    await expect(inspectZip(new TextEncoder().encode("not a zip"))).rejects.toEqual(
      expect.objectContaining({
        name: "ZipValidationError",
        message: "The selected file is not a valid ZIP archive.",
      }),
    );
  });

  it("normalizes absolute and traversal paths before exposing them", () => {
    expect(sanitizeZipPath("../../private/../safe.txt")).toBe("safe.txt");
    expect(sanitizeZipPath("C:\\temp\\report.txt")).toBe("temp/report.txt");
    expect(sanitizeZipPath("/root/file.txt")).toBe("root/file.txt");
  });

  it("never exposes a traversal path loaded from a ZIP", async () => {
    const input = await makeZip({ "../../outside.txt": "safe" });
    const files = await extractZip(input);

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("outside.txt");
    expect(files[0].path).not.toContain("..");
  });

  it("enforces compressed-size, entry-count, and expanded-size limits", async () => {
    const input = await makeZip({ "one.txt": "1234", "two.txt": "5678" });

    await expect(inspectZip(input, { ...ZIP_LIMITS, maxCompressedBytes: 1 })).rejects.toThrow(
      "compressed size limit",
    );
    await expect(inspectZip(input, { ...ZIP_LIMITS, maxEntries: 1 })).rejects.toThrow(
      "more than 1 entries",
    );
    await expect(inspectZip(input, { ...ZIP_LIMITS, maxEntryBytes: 3 })).rejects.toThrow(
      'ZIP entry "one.txt" exceeds the per-file size limit',
    );
    await expect(inspectZip(input, { ...ZIP_LIMITS, maxUncompressedBytes: 6 })).rejects.toThrow(
      "total uncompressed size limit",
    );
  });

  it("uses a distinct validation error type for policy violations", async () => {
    const input = await makeZip({ "large.txt": "1234" });
    await expect(
      inspectZip(input, { ...ZIP_LIMITS, maxEntryBytes: 3 }),
    ).rejects.toBeInstanceOf(ZipValidationError);
  });
});
