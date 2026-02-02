import { describe, expect, it } from "vitest";
import {
  FILE_CONVERTER_MAX_BYTES,
  METADATA_VIEWER_MAX_BYTES,
  basicFileMetadata,
  convertTextContent,
  effectiveFileType,
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
  });
});
