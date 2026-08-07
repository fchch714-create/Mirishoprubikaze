/**
 * Client-side Neural AI Background Removal Engine using @imgly/background-removal.
 * Dynamically imported on the client side to avoid Next.js SSR build bundling issues with ONNX WASM.
 */
export async function removeBackgroundClient(
  imageUrl: string | Blob | File,
  _tolerance: number = 30
): Promise<string> {
  try {
    if (typeof window === "undefined") {
      throw new Error("Fon silmə yalnız brauzerdə dəstəklənir.");
    }

    let inputBlob: Blob;

    if (imageUrl instanceof Blob) {
      inputBlob = imageUrl;
    } else if (typeof imageUrl === "string" && imageUrl.startsWith("data:")) {
      // Base64 Data URL -> convert to Blob
      const res = await fetch(imageUrl);
      inputBlob = await res.blob();
    } else if (typeof imageUrl === "string" && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))) {
      // Remote URL -> Proxy -> Blob
      const proxyUrl = `/api/admin/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      const res = await fetch(proxyUrl);
      
      if (!res.ok) {
        throw new Error("Mənbə sayt şəkli təqdim etmədi və ya girişi blokladı. Şəkli kompyuterinizə endirib birbaşa yükləməyinizi tövsiyə edirik.");
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html") || contentType.includes("application/json")) {
        throw new Error("Daxil etdiyiniz keçid düzgün şəkil faylı deyil (HTML/Veb səhifədir). Şəklin özünün düzgün keçidini daxil edin və ya faylı kompyuterinizdən yükləyin.");
      }

      inputBlob = await res.blob();
    } else if (typeof imageUrl === "string" && imageUrl.startsWith("blob:")) {
      const res = await fetch(imageUrl);
      inputBlob = await res.blob();
    } else {
      throw new Error("Düzgün şəkil faylı və ya şəkil URL-i seçilməyib.");
    }

    // Dynamic client-side import of @imgly/background-removal
    const { removeBackground } = await import("@imgly/background-removal");

    const blob = await removeBackground(inputBlob, {
      progress: (key: string, current: number, total: number) => {
        if (total > 0) {
          console.log(`[AI Model] ${key}: ${Math.round((current / total) * 100)}%`);
        }
      },
    });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Şəkil konvertasiyası alınmadı."));
        }
      };
      reader.onerror = () => reject(new Error("Şəkil oxunarkən xəta baş verdi."));
      reader.readAsDataURL(blob);
    });
  } catch (err: any) {
    console.error("Client background removal error:", err);
    let message = err?.message || "AI Fon Silmə zamanı xəta baş verdi.";
    if (message.includes("Invalid format") || message.includes("text/html")) {
      message = "Şəkil formatı düzgün deyil və ya veb səhifə linkidir. Lütfən birbaşa JPG/PNG şəklinin özünü yükləyin.";
    }
    throw new Error(message);
  }
}

