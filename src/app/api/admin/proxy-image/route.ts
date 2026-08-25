import { NextRequest, NextResponse } from "next/server";

/**
 * Validates whether a target URL is a safe, public web address (SSRF Protection)
 */
function isSafeUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    
    // Only allow http: and https: protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost, internal hostnames, and GCP/AWS metadata endpoints
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      'metadata.google.internal',
      '169.254.169.254', // Cloud metadata service IP
      'instance-data',
    ];

    if (blockedHosts.includes(hostname)) {
      return false;
    }

    // Block private RFC 1918 and link-local IPv4 ranges
    if (
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      hostname.startsWith('127.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json({ error: "url parametri tələb olunur" }, { status: 400 });
    }

    if (!isSafeUrl(imageUrl)) {
      return NextResponse.json(
        { error: "Təhlükəsizlik xətası: Yalnız ictimai və etibarlı şəkil linklərinə icazə verilir (SSRF bloklandı)." },
        { status: 403 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Mənbə şəkil yüklənə bilmədi: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Sorğu edilən fayl şəkil formatında deyil." },
        { status: 400 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    // Limit proxy payload size to 15MB
    if (arrayBuffer.byteLength > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Şəkil faylı çox böyükdür (maks 15MB)." },
        { status: 413 }
      );
    }

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Proxy yükləmə xətası" },
      { status: 500 }
    );
  }
}

