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

/** Rotates every page of a PDF document by `degreesAngle` clockwise degrees. */
export async function rotatePdfPages(
  file: PdfFileSource,
  degreesAngle: number,
): Promise<Uint8Array> {
  const { PDFDocument, degrees } = await import("pdf-lib");
  const sourceBytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(sourceBytes);

  for (const page of pdf.getPages()) {
    page.setRotation(degrees(degreesAngle));
  }

  return pdf.save();
}
