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
  // Convert original to WebP for consistency and smaller size
  const originalBuffer = await sharp(inputBuffer)
    .webp({ quality: 85 })
    .toBuffer();

  // Generate thumbnail: max 400x400 with preserved aspect ratio
  const thumbnailBuffer = await sharp(inputBuffer)
    .resize(400, 400, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();

  return {
    originalBuffer,
    thumbnailBuffer,
    contentType: "image/webp",
  };
}
