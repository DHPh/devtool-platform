export const FILE_CONVERTER_MAX_BYTES = 25 * 1024 * 1024;
export const METADATA_VIEWER_MAX_BYTES = 100 * 1024 * 1024;

export type ConversionTarget = "jpeg" | "png" | "webp" | "txt" | "json";

export interface ConversionTargetInfo {
  value: ConversionTarget;
  label: string;
  mime: string;
}

export const IMAGE_CONVERSION_TARGETS: readonly ConversionTargetInfo[] = [
  { value: "jpeg", label: "JPEG", mime: "image/jpeg" },
  { value: "png", label: "PNG", mime: "image/png" },
  { value: "webp", label: "WebP", mime: "image/webp" },
];

export const TEXT_CONVERSION_TARGETS: readonly ConversionTargetInfo[] = [
  { value: "txt", label: "Plain text", mime: "text/plain" },
  { value: "json", label: "JSON", mime: "application/json" },
];

const SUPPORTED_IMAGE_INPUTS = new Set(["image/jpeg", "image/png", "image/webp"]);
const SUPPORTED_TEXT_INPUTS = new Set(["text/plain", "application/json"]);

export type FileDescriptor = Pick<File, "name" | "size" | "type" | "lastModified">;

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > -1 && dot < name.length - 1 ? name.slice(dot + 1).toLowerCase() : "";
}

export function effectiveFileType(file: Pick<FileDescriptor, "name" | "type">): string {
  if (file.type) return file.type.toLowerCase();
  const extension = extensionOf(file.name);
  const inferred: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    txt: "text/plain",
    json: "application/json",
  };
  return inferred[extension] ?? "application/octet-stream";
}

export function getConversionTargets(
  file: Pick<FileDescriptor, "name" | "type">,
): readonly ConversionTargetInfo[] {
  const type = effectiveFileType(file);
  if (SUPPORTED_IMAGE_INPUTS.has(type)) return IMAGE_CONVERSION_TARGETS;
  if (SUPPORTED_TEXT_INPUTS.has(type)) return TEXT_CONVERSION_TARGETS;
  return [];
}

export function validateConverterFile(file: FileDescriptor): string | null {
  if (file.size <= 0) return "The file is empty.";
  if (file.size > FILE_CONVERTER_MAX_BYTES) return "Files must be 25 MB or smaller.";
  if (getConversionTargets(file).length === 0) {
    return "Unsupported type. Use JPEG, PNG, WebP, plain text, or JSON.";
  }
  return null;
}

export function targetInfo(target: ConversionTarget): ConversionTargetInfo {
  const info = [...IMAGE_CONVERSION_TARGETS, ...TEXT_CONVERSION_TARGETS].find(
    (candidate) => candidate.value === target,
  );
  if (!info) throw new Error(`Unsupported conversion target: ${target}`);
  return info;
}

export function convertTextContent(
  input: string,
  sourceType: string,
  target: Extract<ConversionTarget, "txt" | "json">,
  originalFilename: string,
): string {
  if (target === "json") {
    if (sourceType === "application/json") return JSON.stringify(JSON.parse(input), null, 2);
    return JSON.stringify({ originalFilename, content: input }, null, 2);
  }

  if (sourceType === "application/json") return JSON.stringify(JSON.parse(input), null, 2);
  return input;
}

export function basicFileMetadata(file: FileDescriptor) {
  return {
    name: file.name,
    sizeBytes: file.size,
    type: file.type || "application/octet-stream",
    extension: extensionOf(file.name),
    lastModified: new Date(file.lastModified).toISOString(),
  };
}

export function validateMetadataFile(file: FileDescriptor): string | null {
  if (file.size > METADATA_VIEWER_MAX_BYTES) return "Files must be 100 MB or smaller.";
  return null;
}

