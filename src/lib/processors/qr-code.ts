import QRCode from "qrcode";

export type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface QrCodeModel {
  text: string;
  byteLength: number;
  errorCorrectionLevel: QrErrorCorrectionLevel;
  version: number;
  moduleCount: number;
  modules: boolean[][];
}

export type QrGenerationErrorCode =
  | "EMPTY_CONTENT"
  | "INVALID_ERROR_CORRECTION"
  | "CAPACITY_EXCEEDED"
  | "INVALID_SIZE"
  | "SIZE_TOO_SMALL"
  | "CANVAS_UNAVAILABLE";

export class QrGenerationError extends Error {
  readonly name = "QrGenerationError";

  constructor(readonly code: QrGenerationErrorCode, message: string) {
    super(message);
  }
}

const ERROR_LEVELS = new Set<QrErrorCorrectionLevel>(["L", "M", "Q", "H"]);
const QUIET_ZONE_MODULES = 4;

export function createQrCodeModel(text: string, errorCorrectionLevel: QrErrorCorrectionLevel = "M"): QrCodeModel {
  if (!text.length) throw new QrGenerationError("EMPTY_CONTENT", "Enter content before generating a QR code.");
  if (!ERROR_LEVELS.has(errorCorrectionLevel)) {
    throw new QrGenerationError("INVALID_ERROR_CORRECTION", `Unsupported error-correction level '${errorCorrectionLevel}'.`);
  }

  try {
    const code = QRCode.create(text, { errorCorrectionLevel });
    const modules = Array.from({ length: code.modules.size }, (_, row) =>
      Array.from({ length: code.modules.size }, (_, column) => Boolean(code.modules.get(row, column))),
    );
    return {
      text,
      byteLength: new TextEncoder().encode(text).length,
      errorCorrectionLevel,
      version: code.version,
      moduleCount: code.modules.size,
      modules,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "The encoder rejected this content";
    throw new QrGenerationError(
      "CAPACITY_EXCEEDED",
      `Content does not fit a QR Code at error-correction level ${errorCorrectionLevel}. Reduce its UTF-8 byte length or choose a lower correction level. (${detail})`,
    );
  }
}

export function validateQrOutputSize(model: QrCodeModel, size: number): void {
  if (!Number.isInteger(size) || size < 64 || size > 2048) {
    throw new QrGenerationError("INVALID_SIZE", "Output size must be a whole number from 64 to 2048 pixels.");
  }
  const minimum = model.moduleCount + QUIET_ZONE_MODULES * 2;
  if (size < minimum) {
    throw new QrGenerationError(
      "SIZE_TOO_SMALL",
      `This version ${model.version} QR code needs at least ${minimum} pixels to preserve one pixel per module and its quiet zone.`,
    );
  }
}

export function renderQrCodeSvg(model: QrCodeModel): string {
  const dimension = model.moduleCount + QUIET_ZONE_MODULES * 2;
  const path = model.modules.flatMap((row, rowIndex) =>
    row.flatMap((dark, columnIndex) => dark
      ? [`M${columnIndex + QUIET_ZONE_MODULES} ${rowIndex + QUIET_ZONE_MODULES}h1v1h-1z`]
      : []),
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" width="${dimension}" height="${dimension}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}

export function qrSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Render an exact-size PNG locally with no image fetch or external service. */
export async function renderQrCodePng(model: QrCodeModel, size: number): Promise<Blob> {
  validateQrOutputSize(model, size);
  if (typeof document === "undefined") throw new QrGenerationError("CANVAS_UNAVAILABLE", "PNG rendering requires a browser canvas.");
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new QrGenerationError("CANVAS_UNAVAILABLE", "This browser did not provide a 2D canvas context.");

  const pixels = context.createImageData(size, size);
  const dimension = model.moduleCount + QUIET_ZONE_MODULES * 2;
  for (let y = 0; y < size; y += 1) {
    const row = Math.floor(y * dimension / size) - QUIET_ZONE_MODULES;
    for (let x = 0; x < size; x += 1) {
      const column = Math.floor(x * dimension / size) - QUIET_ZONE_MODULES;
      const dark = row >= 0 && row < model.moduleCount
        && column >= 0 && column < model.moduleCount
        && model.modules[row][column];
      const offset = (y * size + x) * 4;
      const channel = dark ? 0 : 255;
      pixels.data[offset] = channel;
      pixels.data[offset + 1] = channel;
      pixels.data[offset + 2] = channel;
      pixels.data[offset + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob
      ? resolve(blob)
      : reject(new QrGenerationError("CANVAS_UNAVAILABLE", "The browser could not encode the QR canvas as PNG.")), "image/png");
  });
}
