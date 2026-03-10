import sharp from "sharp";

export interface ProcessedImage {
  originalBuffer: Buffer;
  thumbnailBuffer: Buffer;
  contentType: string;
}

/**
 * Process an uploaded image: convert original to WebP if needed,
 * and generate a 400x400 max thumbnail in WebP.
 */
export async function processImage(
  inputBuffer: Buffer,
): Promise<ProcessedImage> {
  // Auto-rotate based on EXIF orientation, then convert to WebP
  const originalBuffer = await sharp(inputBuffer)
    .rotate()
    .webp({ quality: 85 })
    .toBuffer();

  // Generate thumbnail: auto-rotate, max 400x400 with preserved aspect ratio
  const thumbnailBuffer = await sharp(inputBuffer)
    .rotate()
    .resize(400, 400, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 70 })
    .toBuffer();

  return {
    originalBuffer,
    thumbnailBuffer,
    contentType: "image/webp",
  };
}
