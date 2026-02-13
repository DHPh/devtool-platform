import { describe, expect, it, vi } from "vitest";
import {
  FILE_CONVERTER_MAX_BYTES,
  METADATA_VIEWER_MAX_BYTES,
  basicFileMetadata,
  convertFileContent,
  convertTextContent,
  effectiveFileType,
  extractFileMetadata,
  fileCategory,
  getConversionTargets,
  validateConverterFile,
  validateMetadataFile,
} from "@/lib/processors/file-capabilities";

const descriptor = (overrides: Partial<File> = {}) => ({
  name: "sample.png",
  size: 128,
  type: "image/png",
  lastModified: 0,
  ...overrides,
}) as File;

describe("file converter capabilities", () => {
  it("only advertises canvas-encodable image outputs for supported images", () => {
    expect(getConversionTargets(descriptor()).map((target) => target.value)).toEqual([
      "jpeg",
      "png",
      "webp",
    ]);
  });

  it.each([
    ["animation.gif", "image/gif"],
    ["drawing.svg", "image/svg+xml"],
    ["scan.bmp", "image/bmp"],
    ["report.pdf", "application/pdf"],
    ["song.mp3", "audio/mpeg"],
    ["movie.mp4", "video/mp4"],
  ])("does not advertise unsupported conversion for %s", (name, type) => {
    const file = descriptor({ name, type });
    expect(getConversionTargets(file)).toEqual([]);
    expect(validateConverterFile(file)).toMatch(/Unsupported type/);
  });

  it("supports real text/JSON transformations and validates JSON input", () => {
    expect(convertTextContent("hello", "text/plain", "json", "note.txt")).toBe(
      '{\n  "originalFilename": "note.txt",\n  "content": "hello"\n}',
    );
    expect(convertTextContent('{"answer":42}', "application/json", "txt", "data.json")).toBe(
      '{\n  "answer": 42\n}',
    );
    expect(() => convertTextContent("not json", "application/json", "txt", "bad.json")).toThrow();
  });

  it("infers supported types when a browser omits MIME and enforces the size limit", () => {
    expect(effectiveFileType(descriptor({ name: "DATA.JSON", type: "" }))).toBe("application/json");
    expect(validateConverterFile(descriptor({ size: FILE_CONVERTER_MAX_BYTES + 1 }))).toMatch(/25 MB/);
    expect(validateConverterFile(descriptor({ size: 0 }))).toMatch(/empty/);
    expect(validateConverterFile(descriptor({ size: Number.NaN }))).toMatch(/invalid size/);
  });

  it("executes the same complete text conversion path used by the UI", async () => {
    const file = descriptor({ name: "note.txt", type: "text/plain", size: 5 });
    const blob = await convertFileContent(file, "json", {
      readText: async () => "hello",
      convertImage: async () => { throw new Error("image adapter must not run"); },
    });

    expect(blob.type).toBe("application/json");
    expect(await blob.text()).toContain('"content": "hello"');
  });

  it("rejects target spoofing before invoking conversion adapters", async () => {
    const readText = vi.fn(async () => "hello");
    await expect(convertFileContent(
      descriptor({ name: "note.txt", type: "text/plain" }),
      "jpeg",
      { readText, convertImage: async () => new Blob() },
    )).rejects.toThrow(/not supported/);
    expect(readText).not.toHaveBeenCalled();
  });
});

describe("metadata viewer capabilities", () => {
  it("returns only browser-provided basic metadata without invented EXIF or page counts", () => {
    const metadata = basicFileMetadata(descriptor({
      name: "report.PDF",
      type: "application/pdf",
      size: 42,
      lastModified: 0,
    }));
    expect(metadata).toEqual({
      name: "report.PDF",
      sizeBytes: 42,
      type: "application/pdf",
      extension: "pdf",
      lastModified: "1970-01-01T00:00:00.000Z",
    });
    expect(metadata).not.toHaveProperty("pages");
    expect(metadata).not.toHaveProperty("exif");
  });

  it("rejects oversized metadata inputs", () => {
    expect(validateMetadataFile(descriptor({ size: METADATA_VIEWER_MAX_BYTES }))).toBeNull();
    expect(validateMetadataFile(descriptor({ size: METADATA_VIEWER_MAX_BYTES + 1 }))).toMatch(/100 MB/);
    expect(validateMetadataFile(descriptor({ size: Number.NaN }))).toMatch(/invalid size/);
    expect(validateMetadataFile(descriptor({ lastModified: Number.NaN }))).toMatch(/last-modified/);
  });

  it("executes intrinsic metadata extraction through injectable production adapters", async () => {
    expect(fileCategory("IMAGE/PNG")).toBe("image");
    const readImage = vi.fn(async () => ({ width: 640, height: 480 }));
    const metadata = await extractFileMetadata(descriptor(), {
      readImage,
      readMedia: async () => { throw new Error("media adapter must not run"); },
    });

    expect(readImage).toHaveBeenCalledOnce();
    expect(metadata).toMatchObject({
      basic: { name: "sample.png", extension: "png" },
      image: { width: 640, height: 480 },
    });
  });

  it("rejects non-finite media results instead of exporting misleading metadata", async () => {
    await expect(extractFileMetadata(
      descriptor({ name: "clip.mp4", type: "video/mp4" }),
      {
        readImage: async () => ({ width: 0, height: 0 }),
        readMedia: async () => ({ durationSeconds: Number.NaN, width: 1920, height: 1080 }),
      },
    )).rejects.toThrow(/duration is unavailable/);
  });
});
