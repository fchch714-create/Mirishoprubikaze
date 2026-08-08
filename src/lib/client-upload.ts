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
 */
async function compressImageIfNeeded(
  file: File | Blob,
  maxDimension = 2048,
  quality = 0.88
): Promise<File | Blob> {
  // Only process images (skip videos / raw files / small images < 2MB)
  if (!file.type.startsWith('image/') || file.size < 2 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width <= maxDimension && height <= maxDimension && file.size < 3 * 1024 * 1024) {
        return resolve(file);
      }

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      ctx.drawImage(img, 0, 0, width, height);

      // Preserve PNG transparency if mime type is image/png
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const name = file instanceof File ? file.name : 'compressed.jpg';
          resolve(new File([blob], name, { type: outputType }));
        },
        outputType,
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
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
    throw new Error('Fayl və ya şəkil ölçüsü çox böyükdür. Şəkil avtomatik optimallaşdırılsa da server tərəfindən həddi aşır. Lütfən daha kiçik fayl seçin.');
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

  if (fileToUpload instanceof File || fileToUpload instanceof Blob) {
    // Compress image if necessary
    const processedFile = await compressImageIfNeeded(fileToUpload);

    const formData = new FormData();
    formData.append('file', processedFile, processedFile instanceof File ? processedFile.name : 'image.jpg');
    formData.append('folder', folder);
    formData.append('resource_type', resourceType);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
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
    });

    return await handleResponse(res);
  }
}

