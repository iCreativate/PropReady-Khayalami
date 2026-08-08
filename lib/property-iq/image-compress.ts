/**
 * Compress property photos for Property Companion™ storage.
 * Resizes to a max edge and encodes as JPEG to keep local/IDB payloads small.
 */

export const PROPERTY_IMAGE_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp';
/** Max upload size before compression (source file). */
export const PROPERTY_IMAGE_SOURCE_MAX_BYTES = 12 * 1024 * 1024;
/** Target max encoded size after compression. */
export const PROPERTY_IMAGE_COMPRESSED_MAX_BYTES = 450 * 1024;

export type PropertyImageCompressOptions = {
    /** Longest edge in px (default 1600). */
    maxEdge?: number;
    /** JPEG quality 0–1 (default 0.72). */
    quality?: number;
    /** Soft cap on output bytes; quality steps down until met (default ~450KB). */
    maxBytes?: number;
};

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            if (!result.startsWith('data:image/')) {
                reject(new Error('Could not read that image.'));
                return;
            }
            resolve(result);
        };
        reader.onerror = () => reject(new Error('Could not read that image.'));
        reader.readAsDataURL(file);
    });
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Could not decode that image.'));
        img.src = src;
    });
}

function canvasToJpegDataUrl(canvas: HTMLCanvasElement, quality: number): string {
    return canvas.toDataURL('image/jpeg', quality);
}

function dataUrlByteLength(dataUrl: string): number {
    const comma = dataUrl.indexOf(',');
    if (comma < 0) return dataUrl.length;
    const b64 = dataUrl.slice(comma + 1);
    return Math.floor((b64.length * 3) / 4);
}

/**
 * Compress a property photo to a JPEG data URL.
 * Applies a max edge resize and steps quality down until under maxBytes.
 */
export async function compressPropertyImage(
    file: File,
    options: PropertyImageCompressOptions = {}
): Promise<string> {
    const maxEdge = options.maxEdge ?? 1600;
    const maxBytes = options.maxBytes ?? PROPERTY_IMAGE_COMPRESSED_MAX_BYTES;
    let quality = options.quality ?? 0.72;

    const type = file.type.toLowerCase();
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(type)) {
        throw new Error('Use a JPG, PNG or WebP image.');
    }
    if (file.size > PROPERTY_IMAGE_SOURCE_MAX_BYTES) {
        throw new Error('Image must be 12 MB or smaller before compression.');
    }

    const raw = await readFileAsDataUrl(file);
    const img = await loadImage(raw);
    const scale = Math.min(1, maxEdge / Math.max(img.width || 1, img.height || 1));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not compress that image.');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    let dataUrl = canvasToJpegDataUrl(canvas, quality);
    let bytes = dataUrlByteLength(dataUrl);

    // Step quality down if still too large
    while (bytes > maxBytes && quality > 0.42) {
        quality = Math.round((quality - 0.08) * 100) / 100;
        dataUrl = canvasToJpegDataUrl(canvas, quality);
        bytes = dataUrlByteLength(dataUrl);
    }

    // Last resort: shrink canvas further
    if (bytes > maxBytes) {
        const shrink = Math.sqrt(maxBytes / bytes);
        const w2 = Math.max(1, Math.round(width * Math.min(1, shrink)));
        const h2 = Math.max(1, Math.round(height * Math.min(1, shrink)));
        canvas.width = w2;
        canvas.height = h2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w2, h2);
        ctx.drawImage(img, 0, 0, w2, h2);
        dataUrl = canvasToJpegDataUrl(canvas, 0.65);
    }

    return dataUrl;
}

/** Human label for compression settings shown in the UI. */
export function propertyImageCompressLabel(): string {
    return 'Compressed to ~JPEG 72% · max 1600px';
}
