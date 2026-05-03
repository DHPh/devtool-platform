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

const MD5_SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
] as const;

const MD5_TABLE = Uint32Array.from({ length: 64 }, (_, i) =>
  Math.floor(4294967296 * Math.abs(Math.sin(i + 1))) >>> 0,
);

export function md5Bytes(data: Uint8Array): string {
  const bitLen = data.byteLength * 8;
  const paddedLen = (((data.byteLength + 8) >>> 6) + 1) << 6;
  const padded = new Uint8Array(paddedLen);
  padded.set(data);
  padded[data.byteLength] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, bitLen >>> 0, true);
  view.setUint32(paddedLen - 4, Math.floor(bitLen / 4294967296) >>> 0, true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  const words = new Uint32Array(16);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      words[i] = view.getUint32(offset + i * 4, true);
    }

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      const sum = (a + f + MD5_TABLE[i] + words[g]) >>> 0;
      a = d;
      d = c;
      c = b;
      const shift = MD5_SHIFTS[i];
      b = (b + ((sum << shift) | (sum >>> (32 - shift)))) >>> 0;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, a0, true);
  outView.setUint32(4, b0, true);
  outView.setUint32(8, c0, true);
  outView.setUint32(12, d0, true);
  return [...out].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Hashes the complete file contents and propagates read/digest failures. */
export async function hashFileContent(
  file: FileContent,
  algorithm: FileHashAlgorithm = "sha256",
): Promise<string> {
  const contents = new Uint8Array(await file.arrayBuffer());

  if (algorithm === "md5") {
    return md5Bytes(contents);
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

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB", "TB"] as const;
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${parseFloat((bytes / Math.pow(1024, unitIndex)).toFixed(2))} ${units[unitIndex]}`;
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
  jpg: "images", jpeg: "images", png: "images", gif: "images", bmp: "images", svg: "images", webp: "images", ico: "images",
  pdf: "documents", doc: "documents", docx: "documents", txt: "documents", rtf: "documents", odt: "documents", pages: "documents",
  mp3: "audio", wav: "audio", flac: "audio", aac: "audio", ogg: "audio", m4a: "audio",
  mp4: "video", avi: "video", mkv: "video", mov: "video", wmv: "video", flv: "video", webm: "video",
  zip: "archives", rar: "archives", "7z": "archives", tar: "archives", gz: "archives", bz2: "archives",
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
