import { describe, expect, it } from "vitest";
import {
  groupDuplicateFiles,
  hashFileContent,
  hashFileForDuplicateDetection,
} from "@/lib/processors/file-core";

function fileContent(bytes: Uint8Array): Pick<File, "arrayBuffer"> {
  return {
    arrayBuffer: async () => bytes.slice().buffer,
  };
}

describe("file integrity processors", () => {
  it("hashes the complete content so equal prefixes with different suffixes do not collide", async () => {
    const sharedPrefix = new Uint8Array(32).fill(0x61);
    const first = new Uint8Array([...sharedPrefix, 0x31]);
    const second = new Uint8Array([...sharedPrefix, 0x32]);

    const firstHash = await hashFileForDuplicateDetection(fileContent(first));
    const secondHash = await hashFileForDuplicateDetection(fileContent(second));

    expect(firstHash).toMatch(/^[0-9a-f]{64}$/);
    expect(secondHash).toMatch(/^[0-9a-f]{64}$/);
    expect(firstHash).not.toBe(secondHash);
    expect(
      groupDuplicateFiles([
        { name: "first.bin", hash: firstHash },
        { name: "second.bin", hash: secondHash },
      ]),
    ).toEqual([]);
  });

  it("groups files only when their complete-content SHA-256 hashes match", async () => {
    const bytes = new TextEncoder().encode("identical complete content");
    const hash = await hashFileForDuplicateDetection(fileContent(bytes));
    const differentHash = await hashFileForDuplicateDetection(
      fileContent(new TextEncoder().encode("different complete content")),
    );

    expect(
      groupDuplicateFiles([
        { name: "copy-a.txt", hash },
        { name: "copy-b.txt", hash },
        { name: "unique.txt", hash: differentHash },
      ]),
    ).toEqual([
      [
        { name: "copy-a.txt", hash },
        { name: "copy-b.txt", hash },
      ],
    ]);
  });

  it("surfaces file read failures instead of returning a fabricated digest", async () => {
    const failure = new Error("file read failed");
    const unreadableFile: Pick<File, "arrayBuffer"> = {
      arrayBuffer: async () => Promise.reject(failure),
    };

    await expect(hashFileContent(unreadableFile, "sha256")).rejects.toBe(failure);
    await expect(hashFileForDuplicateDetection(unreadableFile)).rejects.toBe(failure);
  });
});
