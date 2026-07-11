import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, currentTime } = await request.json();
    if (!videoUrl) {
      return NextResponse.json({ error: "videoUrl 参数缺失" }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      return NextResponse.json({ error: "Cloudinary 配置缺失" }, { status: 500 });
    }

    // 从 videoUrl 提取 publicId（URL 中 /upload/ 后面的部分，去掉版本号）
    // URL 格式: https://res.cloudinary.com/CLOUD_NAME/video/upload/v1234/folder/file.mp4
    const uploadIndex = videoUrl.indexOf("/upload/");
    if (uploadIndex === -1) {
      return NextResponse.json({ error: "无法解析视频 URL" }, { status: 400 });
    }

    const afterUpload = videoUrl.substring(uploadIndex + 8);
    // 去掉版本号（/v123456/）得到 publicId
    const publicIdMatch = afterUpload.match(/\/v\d+\/(.+)/);
    const publicId = publicIdMatch ? publicIdMatch[1].replace(/\.[^.]+$/, "") : afterUpload.replace(/\.[^.]+$/, "");

    // 构建帧截图 URL: so_X.XX = 在 X.XX 秒处提取帧
    const seconds = Math.max(0, (currentTime || 0));
    const frameUrl = `https://res.cloudinary.com/${cloudName}/video/upload/so_${seconds.toFixed(1)}/${publicId}.jpg`;

    return NextResponse.json({ success: true, url: frameUrl });
  } catch (error) {
    console.error("截图生成失败:", error);
    return NextResponse.json({ error: "截图生成失败" }, { status: 500 });
  }
}
