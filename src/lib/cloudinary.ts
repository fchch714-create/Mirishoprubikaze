import { v2 as cloudinary } from 'cloudinary';

let isConfigured = false;

export function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary konfiqurasiya xətası: Environment mühitində CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY və CLOUDINARY_API_SECRET təyin edilməlidir.'
    );
  }

  if (!isConfigured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    isConfigured = true;
  }

  return cloudinary;
}

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  format?: string;
  width?: number;
  height?: number;
  resource_type: string;
  bytes?: number;
}

export async function uploadMediaToCloudinary(
  fileInput: string | Buffer,
  options: {
    folder?: string;
    resourceType?: 'image' | 'video' | 'auto' | 'raw';
    publicId?: string;
  } = {}
): Promise<CloudinaryUploadResult> {
  const cloud = getCloudinary();
  const folder = options.folder || 'rubikshop_media';
  const resource_type = options.resourceType || 'auto';

  if (typeof fileInput === 'string') {
    const result = await cloud.uploader.upload(fileInput, {
      folder,
      resource_type,
      public_id: options.publicId,
    });
    return {
      url: result.secure_url || result.url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      resource_type: result.resource_type,
      bytes: result.bytes,
    };
  } else {
    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloud.uploader.upload_stream(
        {
          folder,
          resource_type,
          public_id: options.publicId,
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Cloudinary fayl yükləmə zamanı xəta baş verdi.'));
          }
          resolve({
            url: result.secure_url || result.url,
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            resource_type: result.resource_type,
            bytes: result.bytes,
          });
        }
      );
      uploadStream.end(fileInput);
    });
  }
}
