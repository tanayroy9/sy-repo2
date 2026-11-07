export function compressedImageSize(width: number, height: number, maxDimension: number) {
  const ratio = Math.min(1, maxDimension / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

/** Prefer WebP; PNG preserves transparency on browsers without a WebP encoder. */
export async function encodeImageCanvas(canvas: HTMLCanvasElement, quality = 0.82): Promise<Blob> {
  const encode = (type: string) => new Promise<Blob | null>((resolve, reject) => {
    try { canvas.toBlob(resolve, type, quality); } catch (error) { reject(error); }
  });
  let blob: Blob | null = null;
  try { blob = await encode("image/webp"); } catch { /* Retry using the universal PNG encoder. */ }
  if (blob && (blob.type === "image/webp" || blob.type === "image/png")) return blob;
  blob = await encode("image/png");
  if (blob?.type === "image/png") return blob;
  throw new Error("Billedet kunne ikke gemmes. Prøv et andet billede.");
}

export function imageFileExtension(blob: Blob): "webp" | "png" | "svg" | "jpg" {
  switch (blob.type) {
    case "image/webp": return "webp";
    case "image/png": return "png";
    case "image/svg+xml": return "svg";
    case "image/jpeg": return "jpg";
    default: throw new Error("Billedformatet understøttes ikke.");
  }
}

/** Bound decoded image memory before editing, preferring WebP with a PNG fallback. */
export async function compressImage(file: Blob, maxDimension: number, quality = 0.82): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Billedet kunne ikke læses. Prøv et JPG-, PNG- eller WebP-billede."));
      image.src = url;
    });
    const size = compressedImageSize(image.naturalWidth, image.naturalHeight, maxDimension);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Billedet kunne ikke behandles");
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, size.width, size.height);
    return await encodeImageCanvas(canvas, quality);
  } finally { URL.revokeObjectURL(url); }
}