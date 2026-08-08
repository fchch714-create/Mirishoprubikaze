/**
 * Client-side helper for uploading images and videos to Cloudinary via our API route.
 */
export interface UploadMediaResponse {
  success: boolean;
  url: string;
  public_id: string;
  format?: string;
  width?: number;
  height?: number;
  resource_type: string;
  bytes?: number;
}

/**
 * Converts a base64 Data URL to a File object.
 */
function dataURLtoFile(dataurl: string, filename = 'image.png'): File {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1] || '');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Compress an image File or Blob using HTML Canvas if it exceeds maxBytes or maxDimension.
 * Automatically handles large photos (5MB+) by optimizing resolution and format (JPEG/WebP)
 * to prevent 413 Payload Too Large server errors.
 */
async function compressImageIfNeeded(
  file: File | Blob,
  maxDimension = 1920,
  quality = 0.85
): Promise<File | Blob> {
  // Only process images that are larger than 1.5MB
  if (!file.type.startsWith('image/') || file.size < 1.5 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    // 8-second safety timeout so upload never hangs
    const timer = setTimeout(() => resolve(file), 8000);

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width <= 0 || height <= 0) return resolve(file);

      // Target max dimension based on file size
      let targetMax = maxDimension; // 1920
      if (file.size > 8 * 1024 * 1024) targetMax = 1400;
      else if (file.size > 3.5 * 1024 * 1024) targetMax = 1600;

      if (width > targetMax || height > targetMax) {
        if (width > height) {
          height = Math.round((height * targetMax) / width);
          width = targetMax;
        } else {
          width = Math.round((width * targetMax) / height);
          height = targetMax;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      // Fill white background in case PNG is converted to JPEG or has no alpha
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      // Check if image has alpha transparency
      let hasAlpha = false;
      if (file.type === 'image/png') {
        try {
          const sampleW = Math.min(width, 100);
          const sampleH = Math.min(height, 100);
          const imageData = ctx.getImageData(0, 0, sampleW, sampleH).data;
          for (let i = 3; i < imageData.length; i += 4) {
            if (imageData[i] < 255) {
              hasAlpha = true;
              break;
            }
          }
        } catch {
          // ignore
        }
      }

      // If no alpha or file is large (>2.5MB), use JPEG for high compression
      const outputType = (file.type === 'image/png' && hasAlpha && file.size < 3.5 * 1024 * 1024) 
        ? 'image/png' 
        : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);

          // If PNG is still > 2.5MB (lossless PNG bloat), force JPEG conversion
          if (outputType === 'image/png' && blob.size > 2.5 * 1024 * 1024) {
            canvas.toBlob(
              (jpegBlob) => {
                if (!jpegBlob || jpegBlob.size >= file.size) return resolve(file);
                const name = (file instanceof File ? file.name : 'compressed').replace(/\.[^/.]+$/, '') + '.jpg';
                resolve(new File([jpegBlob], name, { type: 'image/jpeg' }));
              },
              'image/jpeg',
              quality
            );
            return;
          }

          if (blob.size >= file.size) {
            return resolve(file);
          }

          const ext = outputType === 'image/png' ? '.png' : '.jpg';
          const name = (file instanceof File ? file.name : 'compressed').replace(/\.[^/.]+$/, '') + ext;
          resolve(new File([blob], name, { type: outputType }));
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

async function handleResponse(res: Response): Promise<UploadMediaResponse> {
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Fayl Cloudinary-yə yüklənə bilmədi.');
      }
      return data;
    } catch (err: any) {
      if (err.message && !err.message.includes('JSON') && !err.message.includes('Unexpected token')) {
        throw err;
      }
      // Fall through to text parsing
    }
  }

  // Non-JSON response (e.g. 413 Payload Too Large or HTML/Text error page)
  const text = await res.text().catch(() => '');
  if (res.status === 413 || text.includes('Request Entity Too Large') || text.includes('Payload Too Large')) {
    throw new Error('Fayl və ya şəkil ölçüsü çox böyükdür. Lütfən daha kiçik fayl seçin.');
  }

  throw new Error(text || `Server xətası baş verdi (Status: ${res.status}).`);
}

export async function uploadMediaClient(
  fileOrString: File | string,
  options: {
    folder?: string;
    resourceType?: 'image' | 'video' | 'auto';
  } = {}
): Promise<UploadMediaResponse> {
  const { folder = 'rubikshop_media', resourceType = 'auto' } = options;

  let fileToUpload: File | Blob | string = fileOrString;

  // Convert base64 Data URLs to File objects for binary streaming via FormData
  if (typeof fileToUpload === 'string' && fileToUpload.startsWith('data:')) {
    fileToUpload = dataURLtoFile(fileToUpload, 'uploaded_image.png');
  }

  const controller = new AbortController();
  const fetchTimeout = setTimeout(() => controller.abort(), 90000); // 90 second timeout

  try {
    if (fileToUpload instanceof File || fileToUpload instanceof Blob) {
      // Compress image if necessary (e.g. 5MB mobile photo)
      const processedFile = await compressImageIfNeeded(fileToUpload);

      const formData = new FormData();
      formData.append('file', processedFile, processedFile instanceof File ? processedFile.name : 'image.jpg');
      formData.append('folder', folder);
      formData.append('resource_type', resourceType);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      return await handleResponse(res);
    } else {
      // String is an external HTTP/HTTPS URL
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: fileToUpload,
          folder,
          resource_type: resourceType,
        }),
        signal: controller.signal,
      });

      return await handleResponse(res);
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Yükləmə vaxtı bitdi (Timeout). İnternet əlaqənizi yoxlayın.');
    }
    throw err;
  } finally {
    clearTimeout(fetchTimeout);
  }
}

