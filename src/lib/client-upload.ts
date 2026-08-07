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

export async function uploadMediaClient(
  fileOrString: File | string,
  options: {
    folder?: string;
    resourceType?: 'image' | 'video' | 'auto';
  } = {}
): Promise<UploadMediaResponse> {
  const { folder = 'rubikshop_media', resourceType = 'auto' } = options;

  if (typeof fileOrString === 'string') {
    // Base64 or external URL string
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: fileOrString,
        folder,
        resource_type: resourceType,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Fayl Cloudinary-yə yüklənə bilmədi.');
    }
    return data;
  } else {
    // File object from file input
    const formData = new FormData();
    formData.append('file', fileOrString);
    formData.append('folder', folder);
    formData.append('resource_type', resourceType);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Fayl Cloudinary-yə yüklənə bilmədi.');
    }
    return data;
  }
}
