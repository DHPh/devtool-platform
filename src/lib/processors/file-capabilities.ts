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

export type FileCategory = "image" | "audio" | "video" | "other";

export interface ExtractedFileMetadata {
  basic: ReturnType<typeof basicFileMetadata>;
  image?: { width: number; height: number };
  audio?: { durationSeconds: number };
  video?: { durationSeconds: number; width: number; height: number };
}

export interface FileConversionAdapters {
  readText(file: File): Promise<string>;
  convertImage(file: File, mime: string): Promise<Blob>;
}

export interface MetadataExtractionAdapters {
  readImage(file: File): Promise<{ width: number; height: number }>;
  readMedia(
    file: File,
    category: "audio" | "video",
  ): Promise<{ durationSeconds: number; width?: number; height?: number }>;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > -1 && dot < name.length - 1 ? name.slice(dot + 1).toLowerCase() : "";
}

function hasValidLastModified(value: number): boolean {
  return Number.isFinite(value) && Number.isFinite(new Date(value).getTime());
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
  if (!Number.isFinite(file.size) || file.size <= 0) return "The file is empty or has an invalid size.";
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

async function convertImageInBrowser(file: File, mime: string): Promise<Blob> {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The browser could not decode this image."));
      image.src = sourceUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas conversion is unavailable in this browser.");
    if (mime === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error(`This browser cannot encode ${mime}.`)),
        mime,
        0.9,
      );
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

const DEFAULT_CONVERSION_ADAPTERS: FileConversionAdapters = {
  readText: (file) => file.text(),
  convertImage: convertImageInBrowser,
};

export async function convertFileContent(
  file: File,
  target: ConversionTarget,
  adapters: FileConversionAdapters = DEFAULT_CONVERSION_ADAPTERS,
): Promise<Blob> {
  const validationError = validateConverterFile(file);
  if (validationError) throw new Error(validationError);

  const targetDetails = targetInfo(target);
  const sourceType = effectiveFileType(file);
  if (!getConversionTargets(file).some((candidate) => candidate.value === target)) {
    throw new Error("That conversion is not supported for this file.");
  }

  if (sourceType.startsWith("image/")) {
    return adapters.convertImage(file, targetDetails.mime);
  }

  if (target !== "txt" && target !== "json") {
    throw new Error("That conversion is not supported for this file.");
  }
  const content = convertTextContent(
    await adapters.readText(file),
    sourceType,
    target,
    file.name,
  );
  return new Blob([content], { type: targetDetails.mime });
}

export function basicFileMetadata(file: FileDescriptor) {
  if (!hasValidLastModified(file.lastModified)) throw new Error("The file has an invalid last-modified timestamp.");
  return {
    name: file.name,
    sizeBytes: file.size,
    type: file.type || "application/octet-stream",
    extension: extensionOf(file.name),
    lastModified: new Date(file.lastModified).toISOString(),
  };
}

export function validateMetadataFile(file: FileDescriptor): string | null {
  if (!Number.isFinite(file.size) || file.size < 0) return "The file has an invalid size.";
  if (file.size > METADATA_VIEWER_MAX_BYTES) return "Files must be 100 MB or smaller.";
  if (!hasValidLastModified(file.lastModified)) return "The file has an invalid last-modified timestamp.";
  return null;
}

export function fileCategory(type: string): FileCategory {
  const normalized = type.toLowerCase();
  if (normalized.startsWith("image/")) return "image";
  if (normalized.startsWith("audio/")) return "audio";
  if (normalized.startsWith("video/")) return "video";
  return "other";
}

function waitForMediaMetadata(element: HTMLMediaElement, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Timed out while reading media metadata."));
    }, 5000);
    const cleanup = () => {
      window.clearTimeout(timeout);
      element.removeEventListener("loadedmetadata", loaded);
      element.removeEventListener("error", failed);
    };
    const loaded = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error("The browser could not read this media file.")); };
    element.addEventListener("loadedmetadata", loaded);
    element.addEventListener("error", failed);
    element.src = url;
  });
}

const DEFAULT_METADATA_ADAPTERS: MetadataExtractionAdapters = {
  async readImage(file) {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("The browser could not read this image."));
        image.src = url;
      });
      return { width: image.naturalWidth, height: image.naturalHeight };
    } finally {
      URL.revokeObjectURL(url);
    }
  },
  async readMedia(file, category) {
    const url = URL.createObjectURL(file);
    const element = category === "audio" ? new Audio() : document.createElement("video");
    try {
      await waitForMediaMetadata(element, url);
      if (!Number.isFinite(element.duration)) throw new Error("The media duration is unavailable.");
      return category === "video"
        ? {
            durationSeconds: element.duration,
            width: (element as HTMLVideoElement).videoWidth,
            height: (element as HTMLVideoElement).videoHeight,
          }
        : { durationSeconds: element.duration };
    } finally {
      element.removeAttribute("src");
      element.load();
      URL.revokeObjectURL(url);
    }
  },
};

export async function extractFileMetadata(
  file: File,
  adapters: MetadataExtractionAdapters = DEFAULT_METADATA_ADAPTERS,
): Promise<ExtractedFileMetadata> {
  const validationError = validateMetadataFile(file);
  if (validationError) throw new Error(validationError);

  const metadata: ExtractedFileMetadata = { basic: basicFileMetadata(file) };
  const category = fileCategory(effectiveFileType(file));
  if (category === "other") return metadata;
  if (category === "image") {
    metadata.image = await adapters.readImage(file);
    return metadata;
  }

  const media = await adapters.readMedia(file, category);
  if (!Number.isFinite(media.durationSeconds) || media.durationSeconds < 0) {
    throw new Error("The media duration is unavailable.");
  }
  if (category === "audio") {
    metadata.audio = { durationSeconds: media.durationSeconds };
  } else {
    if (!Number.isFinite(media.width) || !Number.isFinite(media.height)) {
      throw new Error("The video dimensions are unavailable.");
    }
    metadata.video = {
      durationSeconds: media.durationSeconds,
      width: media.width as number,
      height: media.height as number,
    };
  }
  return metadata;
}
