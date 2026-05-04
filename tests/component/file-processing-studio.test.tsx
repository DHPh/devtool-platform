// @vitest-environment jsdom

import { webcrypto } from "node:crypto";
import { cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PDFDocument } from "pdf-lib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useObjectUrls } from "@/hooks/use-object-urls";
import { mergePdfFiles, rotatePdfPages, splitPdfPages } from "@/lib/processors/pdf-core";
import FileHasherTab from "@/lib/tools/file-processing/tabs/FileHasherTab";
import FileOrganizerTab from "@/lib/tools/file-processing/tabs/FileOrganizerTab";
import PdfToolsTab from "@/lib/tools/file-processing/tabs/PdfToolsTab";

function makeMockPdfBytes(titleBytes: number): Promise<Uint8Array> {
  return PDFDocument.create().then((doc) => {
    const page = doc.addPage([200, 200]);
    page.drawText(`Page ${titleBytes}`);
    return doc.save();
  });
}

describe("file processing hooks, processors & studio tabs", () => {
  let urlSeq = 0;
  let createObjectUrlSpy: ReturnType<typeof vi.fn>;
  let revokeObjectUrlSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    urlSeq = 0;
    createObjectUrlSpy = vi.fn(() => `blob:test-${++urlSeq}`);
    revokeObjectUrlSpy = vi.fn();
    vi.stubGlobal("crypto", webcrypto);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: createObjectUrlSpy,
      revokeObjectURL: revokeObjectUrlSpy,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("tracks and revokes ObjectURLs cleanly via useObjectUrls", () => {
    const { result, unmount } = renderHook(() => useObjectUrls());

    const u1 = result.current.createObjectUrl(new Blob(["a"]));
    const u2 = result.current.createObjectUrl(new Blob(["b"]));
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(2);

    result.current.revokeObjectUrl(u1);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith(u1);

    unmount();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith(u2);
    expect(revokeObjectUrlSpy).toHaveBeenCalledTimes(2);
  });

  it("merges, splits, and rotates real PDF byte buffers via pdf-core", async () => {
    const pdfA = await makeMockPdfBytes(1);
    const pdfB = await makeMockPdfBytes(2);

    const merged = await mergePdfFiles([
      { arrayBuffer: async () => pdfA.slice().buffer },
      { arrayBuffer: async () => pdfB.slice().buffer },
    ]);
    const mergedDoc = await PDFDocument.load(merged);
    expect(mergedDoc.getPageCount()).toBe(2);

    const splitPages = await splitPdfPages({
      arrayBuffer: async () => merged.slice().buffer,
    });
    expect(splitPages).toHaveLength(2);

    const rotated = await rotatePdfPages(
      { arrayBuffer: async () => pdfA.slice().buffer },
      90,
    );
    const rotatedDoc = await PDFDocument.load(rotated);
    expect(rotatedDoc.getPages()[0].getRotation().angle).toBe(90);
  });

  it("hashes uploaded files inside FileHasherTab", async () => {
    const user = userEvent.setup();
    const { container } = render(<FileHasherTab />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const payload = new Uint8Array(Buffer.from("hello file"));
    const sample = new File([payload], "hello.txt", { type: "text/plain" });
    Object.defineProperty(sample, "arrayBuffer", {
      value: async () => payload.slice().buffer,
    });

    fireEvent.change(input, { target: { files: [sample] } });
    expect(await screen.findByText("hello.txt")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /^Hash$/i }));
    await waitFor(() => {
      expect(screen.getByText(/^[0-9a-f]{64}$/i)).toBeVisible();
    });
  });

  it("uploads, categorizes, and revokes ObjectURLs on unmount in FileOrganizerTab", async () => {
    const { container, unmount } = render(<FileOrganizerTab />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const photo = new File(["img"], "avatar.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [photo] } });
    expect(await screen.findByText(/Files uploaded: 1/i)).toBeVisible();
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);

    unmount();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:test-1");
  });

  it("allows selecting and merging PDFs inside PdfToolsTab", async () => {
    const user = userEvent.setup();
    const pdfA = await makeMockPdfBytes(1);
    const pdfB = await makeMockPdfBytes(2);
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    const { container, unmount } = render(<PdfToolsTab />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const fileA = new File([new Uint8Array(pdfA)], "first.pdf", {
      type: "application/pdf",
    });
    const fileB = new File([new Uint8Array(pdfB)], "second.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(fileA, "arrayBuffer", {
      value: async () => pdfA.slice().buffer,
    });
    Object.defineProperty(fileB, "arrayBuffer", {
      value: async () => pdfB.slice().buffer,
    });

    fireEvent.change(input, { target: { files: [fileA, fileB] } });

    expect(await screen.findByText("first.pdf")).toBeVisible();
    expect(screen.getByText("second.pdf")).toBeVisible();

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    await user.click(screen.getByRole("tab", { name: /^Merge$/i }));
    await user.click(screen.getByRole("button", { name: /Merge PDFs/i }));

    await waitFor(() => {
      expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    });

    unmount();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:test-1");
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:test-2");
  });
});
