export interface ImageCropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RenderedImageResult {
  blob: Blob;
  dataUrl: string;
}

/**
 * Loads a File into an HTMLImageElement and revokes the temporary ObjectURL
 * immediately after load or failure so decoded bitmaps never leak URLs.
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };
    img.src = objectUrl;
  });
}

function exportCanvas(
  canvas: HTMLCanvasElement,
  mimeType: string,
  qualityRatio: number,
): Promise<RenderedImageResult> {
  const dataUrl = canvas.toDataURL(mimeType, qualityRatio);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ blob, dataUrl });
        } else {
          reject(new Error("Failed to encode image from canvas."));
        }
      },
      mimeType,
      qualityRatio,
    );
  });
}

/** Draws `img` scaled to `(targetWidth, targetHeight)` on `canvas` and exports it. */
export function renderResizedCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  mimeType: string,
  qualityRatio: number,
): Promise<RenderedImageResult> {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.reject(new Error("Canvas context not available"));
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;
  ctx.clearRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  return exportCanvas(canvas, mimeType, qualityRatio);
}

/** Draws the specified `cropArea` of `img` onto `canvas` and exports it. */
export function renderCroppedCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  cropArea: ImageCropArea,
  mimeType: string,
  qualityRatio: number,
): Promise<RenderedImageResult> {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.reject(new Error("Canvas context not available"));
  }

  canvas.width = cropArea.width;
  canvas.height = cropArea.height;
  ctx.clearRect(0, 0, cropArea.width, cropArea.height);
  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height,
  );

  return exportCanvas(canvas, mimeType, qualityRatio);
}
