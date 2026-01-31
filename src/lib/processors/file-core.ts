export async function hashBytes(data: Uint8Array, algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512" = "SHA-256") {
  const bytes = new Uint8Array(data.byteLength);
  bytes.set(data);
  const digest = await crypto.subtle.digest(algorithm, bytes.buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
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
