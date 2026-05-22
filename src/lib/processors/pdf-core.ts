type PdfFileSource = Pick<File, "arrayBuffer">;

/** Merges multiple PDF files in order using lazily loaded `pdf-lib`. */
export async function mergePdfFiles(
  files: readonly PdfFileSource[],
): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const mergedPdf = await PDFDocument.create();

  for (const source of files) {
    const pdfBytes = await source.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return mergedPdf.save();
}

/** Splits each page of a PDF document into standalone PDF byte buffers. */
export async function splitPdfPages(
  file: PdfFileSource,
): Promise<Uint8Array[]> {
  const { PDFDocument } = await import("pdf-lib");
  const sourceBytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(sourceBytes);
  const totalPages = pdf.getPageCount();
  const pages: Uint8Array[] = [];

  for (let i = 0; i < totalPages; i++) {
    const singlePagePdf = await PDFDocument.create();
    const [copiedPage] = await singlePagePdf.copyPages(pdf, [i]);
    singlePagePdf.addPage(copiedPage);
    pages.push(await singlePagePdf.save());
  }

  return pages;
}

/** Returns the page count of a PDF document. */
export async function getPdfPageCount(file: PdfFileSource): Promise<number> {
  const { PDFDocument } = await import("pdf-lib");
  const sourceBytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(sourceBytes);
  return pdf.getPageCount();
}

/** Parses 1-indexed page ranges like `"1-3, 5"` into zero-indexed page indices. */
export function parsePdfPageRanges(rangeSpec: string, totalPages: number): number[] {
  if (!Number.isInteger(totalPages) || totalPages < 1) {
    throw new Error("PDF has no pages.");
  }
  const tokens = rangeSpec
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (tokens.length === 0) {
    throw new Error("Enter a page range such as 1-3, 5.");
  }
  const indices: number[] = [];
  for (const token of tokens) {
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(token);
    if (!match) {
      throw new Error(`Invalid page range "${token}". Use formats like 1-3, 5.`);
    }
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    if (start < 1 || end < start || end > totalPages) {
      throw new Error(`Page range "${token}" is out of bounds (1–${totalPages}).`);
    }
    for (let page = start; page <= end; page++) {
      indices.push(page - 1);
    }
  }
  return indices;
}

/** Extracts specific page ranges (e.g., `"1-3, 5"`) into a single PDF buffer. */
export async function extractPdfPageRanges(
  file: PdfFileSource,
  rangeSpec: string,
): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const sourceBytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(sourceBytes);
  const indices = parsePdfPageRanges(rangeSpec, pdf.getPageCount());
  const extracted = await PDFDocument.create();
  const copiedPages = await extracted.copyPages(pdf, indices);
  copiedPages.forEach((page) => extracted.addPage(page));
  return extracted.save();
}

/** Rotates every page of a PDF document by `degreesAngle` clockwise degrees (additive). */
export async function rotatePdfPages(
  file: PdfFileSource,
  degreesAngle: number,
): Promise<Uint8Array> {
  const { PDFDocument, degrees } = await import("pdf-lib");
  const sourceBytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(sourceBytes);

  for (const page of pdf.getPages()) {
    const currentAngle = page.getRotation().angle;
    page.setRotation(degrees((((currentAngle + degreesAngle) % 360) + 360) % 360));
  }

  return pdf.save();
}
