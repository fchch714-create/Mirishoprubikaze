import { NextRequest, NextResponse } from 'next/server';
import { uploadMediaToCloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let fileToUpload: string | Buffer;
    let folder = 'rubikshop_media';
    let resourceType: 'image' | 'video' | 'auto' | 'raw' = 'auto';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const customFolder = formData.get('folder') as string | null;
      const customResourceType = formData.get('resource_type') as string | null;

      if (!file) {
        return NextResponse.json(
          { error: 'Yüklənəcək fayl seçilməyib.' },
          { status: 400 }
        );
      }

      if (customFolder) folder = customFolder;
      if (customResourceType && ['image', 'video', 'auto', 'raw'].includes(customResourceType)) {
        resourceType = customResourceType as any;
      } else if (file.type.startsWith('video/')) {
        resourceType = 'video';
      } else if (file.type.startsWith('image/')) {
        resourceType = 'image';
      }

      const arrayBuffer = await file.arrayBuffer();
      fileToUpload = Buffer.from(arrayBuffer);
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      const { file, folder: customFolder, resource_type: customResourceType } = body;

      if (!file || typeof file !== 'string') {
        return NextResponse.json(
          { error: 'Fayl (Base64 və ya URL) daxil edilməlidir.' },
          { status: 400 }
        );
      }

      fileToUpload = file;
      if (customFolder) folder = customFolder;
      if (customResourceType && ['image', 'video', 'auto', 'raw'].includes(customResourceType)) {
        resourceType = customResourceType as any;
      }
    } else {
      return NextResponse.json(
        { error: 'Dəstəklənməyən Content-Type.' },
        { status: 400 }
      );
    }

    const result = await uploadMediaToCloudinary(fileToUpload, {
      folder,
      resourceType,
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      resource_type: result.resource_type,
      bytes: result.bytes,
    });
  } catch (err: any) {
    console.error('Cloudinary API upload error:', err);
    return NextResponse.json(
      {
        error: err?.message || 'Fayl Cloudinary-yə yüklənərkən xəta baş verdi.',
      },
      { status: 500 }
    );
  }
}
