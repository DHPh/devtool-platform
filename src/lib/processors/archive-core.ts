import JSZip from "jszip";

export const ZIP_LIMITS = {
  maxCompressedBytes: 50 * 1024 * 1024,
  maxEntries: 500,
  maxEntryBytes: 50 * 1024 * 1024,
  maxUncompressedBytes: 100 * 1024 * 1024,
} as const;

export interface ZipLimits {
  maxCompressedBytes: number;
  maxEntries: number;
  maxEntryBytes: number;
  maxUncompressedBytes: number;
}

export interface ZipEntryInfo {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
}

export interface ExtractedZipFile {
  name: string;
  path: string;
  size: number;
  data: Uint8Array;
}

export class ZipValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZipValidationError";
  }
}

type ZipInput = ArrayBuffer | Uint8Array;

function byteLength(input: ZipInput): number {
  return input instanceof Uint8Array ? input.byteLength : input.byteLength;
}

/** Converts an untrusted ZIP entry name into a relative, non-traversing path. */
export function sanitizeZipPath(input: string, isDirectory = false): string {
  const segments: string[] = [];
  const normalized = input.replace(/\\/g, "/").replace(/^[A-Za-z]:/, "");

  for (const rawSegment of normalized.split("/")) {
    const segment = rawSegment.replace(/[\u0000-\u001f\u007f]/g, "").trim();
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }

  const fallback = isDirectory ? "folder" : "unnamed-file";
  const safePath = segments.join("/") || fallback;
  return isDirectory ? `${safePath.replace(/\/$/, "")}/` : safePath;
}

function errorMessage(error: unknown): string {
  if (error instanceof ZipValidationError) return error.message;
  return "The selected file is not a valid ZIP archive.";
}

async function readZip(
  input: ZipInput,
  limits: ZipLimits,
): Promise<{ entries: ZipEntryInfo[]; files: ExtractedZipFile[] }> {
  if (byteLength(input) > limits.maxCompressedBytes) {
    throw new ZipValidationError("The ZIP file exceeds the compressed size limit.");
  }

  let zip: JSZip;
  try {
    // Do not enable JSZip's CRC pass here: it expands every entry before we can
    // enforce the archive's declared uncompressed sizes.
    zip = await JSZip.loadAsync(input);
  } catch (error) {
    throw new ZipValidationError(errorMessage(error));
  }

  const objects = Object.values(zip.files);
  if (objects.length > limits.maxEntries) {
    throw new ZipValidationError(`The ZIP contains more than ${limits.maxEntries} entries.`);
  }

  let declaredTotalSize = 0;
  for (const object of objects) {
    if (object.dir) continue;
    const declaredSize = (
      object as JSZip.JSZipObject & { _data?: { uncompressedSize?: number } }
    )._data?.uncompressedSize;
    if (typeof declaredSize !== "number") continue;
    if (declaredSize > limits.maxEntryBytes) {
      const path = sanitizeZipPath(object.unsafeOriginalName ?? object.name);
      throw new ZipValidationError(`ZIP entry "${path}" exceeds the per-file size limit.`);
    }
    declaredTotalSize += declaredSize;
    if (declaredTotalSize > limits.maxUncompressedBytes) {
      throw new ZipValidationError("The ZIP exceeds the total uncompressed size limit.");
    }
  }

  const entries: ZipEntryInfo[] = [];
  const files: ExtractedZipFile[] = [];
  const paths = new Set<string>();
  let totalSize = 0;

  for (const object of objects) {
    const originalPath = object.unsafeOriginalName ?? object.name;
    const path = sanitizeZipPath(originalPath, object.dir);
    if (paths.has(path)) {
      throw new ZipValidationError(`Multiple ZIP entries resolve to the same safe path: ${path}`);
    }
    paths.add(path);

    if (object.dir) {
      entries.push({ name: path.split("/").filter(Boolean).at(-1) ?? "folder", path, size: 0, isDirectory: true });
      continue;
    }

    const data = await object.async("uint8array");
    if (data.byteLength > limits.maxEntryBytes) {
      throw new ZipValidationError(`ZIP entry "${path}" exceeds the per-file size limit.`);
    }
    totalSize += data.byteLength;
    if (totalSize > limits.maxUncompressedBytes) {
      throw new ZipValidationError("The ZIP exceeds the total uncompressed size limit.");
    }

    const name = path.split("/").at(-1) ?? "unnamed-file";
    entries.push({ name, path, size: data.byteLength, isDirectory: false });
    files.push({ name, path, size: data.byteLength, data });
  }

  return { entries, files };
}

export async function inspectZip(
  input: ZipInput,
  limits: ZipLimits = ZIP_LIMITS,
): Promise<ZipEntryInfo[]> {
  return (await readZip(input, limits)).entries;
}

export async function extractZip(
  input: ZipInput,
  limits: ZipLimits = ZIP_LIMITS,
): Promise<ExtractedZipFile[]> {
  return (await readZip(input, limits)).files;
}
