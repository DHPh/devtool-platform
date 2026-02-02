export type WebCryptoHashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
export type FileHashAlgorithm = "md5" | "sha1" | "sha256" | "sha512";

export async function hashBytes(
  data: Uint8Array,
  algorithm: WebCryptoHashAlgorithm = "SHA-256",
) {
  const bytes = new Uint8Array(data.byteLength);
  bytes.set(data);
  const digest = await crypto.subtle.digest(algorithm, bytes.buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

type FileContent = Pick<File, "arrayBuffer">;

/** Hashes the complete file contents and propagates read/digest failures. */
export async function hashFileContent(
  file: FileContent,
  algorithm: FileHashAlgorithm = "sha256",
): Promise<string> {
  const contents = new Uint8Array(await file.arrayBuffer());

  if (algorithm === "md5") {
    const { MD5, lib } = await import("crypto-js");
    return MD5(lib.WordArray.create(contents)).toString();
  }

  const webCryptoAlgorithms: Record<Exclude<FileHashAlgorithm, "md5">, WebCryptoHashAlgorithm> = {
    sha1: "SHA-1",
    sha256: "SHA-256",
    sha512: "SHA-512",
  };

  return hashBytes(contents, webCryptoAlgorithms[algorithm]);
}

/** Duplicate detection always uses SHA-256 over the complete file. */
export function hashFileForDuplicateDetection(file: FileContent): Promise<string> {
  return hashFileContent(file, "sha256");
}

export function fileMetadata(file: { name: string; size: number; type: string; lastModified: number }) {
  const extension = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  return {
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    extension,
    lastModified: new Date(file.lastModified).toISOString(),
  };
}

export function groupDuplicateFiles<T extends { hash: string }>(files: readonly T[]): T[][] {
  const groups = new Map<string, T[]>();
  for (const file of files) groups.set(file.hash, [...(groups.get(file.hash) ?? []), file]);
  return [...groups.values()].filter((group) => group.length > 1);
}

const CATEGORIES: Record<string, string> = {
  jpg: "images", jpeg: "images", png: "images", gif: "images", webp: "images",
  pdf: "documents", doc: "documents", docx: "documents", txt: "documents", csv: "documents",
  mp3: "audio", wav: "audio", m4a: "audio", mp4: "video", mov: "video", avi: "video",
  zip: "archives", rar: "archives", "7z": "archives", tar: "archives", gz: "archives",
};

export function categorizeFile(name: string): string {
  const extension = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  return CATEGORIES[extension] ?? "other";
}

export function convertTextFile(input: string, target: "txt" | "json" | "csv"): string {
  if (target === "txt") return input;
  if (target === "json") return JSON.stringify(input.split(/\r?\n/));
  return input.split(/\r?\n/).map((line) => `"${line.replace(/"/g, '""')}"`).join("\n");
}
