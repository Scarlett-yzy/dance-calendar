import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/upload";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "请提供截图文件" }, { status: 400 });
    }

    const result = await uploadFile(imageFile, "images");

    return NextResponse.json({ success: true, url: result.url, publicId: result.publicId });
  } catch (error) {
    console.error("截图保存失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "截图保存失败" },
      { status: 500 }
    );
  }
}
