import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "Şəkil URL-i (imageUrl) daxil edilməlidir." },
        { status: 400 }
      );
    }

    // Direct transition to client-side @imgly/background-removal AI engine
    return NextResponse.json(
      {
        message: "Brauzer daxili AI modula (@imgly/background-removal) keçid edilir...",
        use_fallback: true,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || "Gözlənilməz xəta.",
        use_fallback: true,
      },
      { status: 200 }
    );
  }
}
