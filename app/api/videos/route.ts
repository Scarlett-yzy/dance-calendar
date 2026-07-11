import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/upload";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const videoFile = formData.get("video") as File | null;
    const thumbnailFile = formData.get("thumbnail") as File | null;
    const title = formData.get("title") as string | null;
    const recordDateStr = formData.get("recordDate") as string | null;

    const refFile = formData.get("referenceVideo") as File | null;
    const refTitle = formData.get("referenceTitle") as string | null;

    if (!videoFile) {
      return NextResponse.json({ error: "请选择视频文件" }, { status: 400 });
    }

    // 上传视频到 Cloudinary
    const { url: videoUrl, publicId: videoPublicId } = await uploadFile(videoFile, "videos");

    // 上传缩略图
    let thumbnailUrl: string | null = null;
    if (thumbnailFile) {
      const result = await uploadFile(thumbnailFile, "thumbnails");
      thumbnailUrl = result.url;
    }

    // 上传参考视频
    let referenceFileUrl: string | null = null;
    let referencePublicId: string | null = null;
    if (refFile) {
      const result = await uploadFile(refFile, "videos");
      referenceFileUrl = result.url;
      referencePublicId = result.publicId;
    }

    const recordDate = recordDateStr
      ? new Date(recordDateStr + "T00:00:00.000Z")
      : new Date();

    // 创建 Video 记录
    const video = await prisma.video.create({
      data: {
        title: title || videoFile.name.replace(/\.[^/.]+$/, ""),
        fileUrl: videoUrl,
        publicId: videoPublicId,
        thumbnailUrl,
        recordDate,
      },
    });

    // 查找或创建 DayEntry
    let entry = await prisma.dayEntry.findFirst({
      where: { date: recordDate },
    });

    if (!entry) {
      entry = await prisma.dayEntry.create({
        data: { date: recordDate },
      });
    }

    const lastSession = await prisma.session.findFirst({
      where: { dayEntryId: entry.id },
      orderBy: { sortOrder: "desc" },
    });

    // 创建 Session
    await prisma.session.create({
      data: {
        dayEntryId: entry.id,
        videoId: video.id,
        referenceFileUrl,
        referencePublicId,
        referenceTitle: refTitle || (refFile ? refFile.name.replace(/\.[^/.]+$/, "") : null),
        sortOrder: (lastSession?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json({ success: true, video });
  } catch (error) {
    console.error("上传失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传失败" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const videos = await prisma.video.findMany({
      where: {
        sessions: { some: {} },
      },
      orderBy: { recordDate: "desc" },
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("获取视频列表失败:", error);
    return NextResponse.json(
      { error: "获取视频列表失败" },
      { status: 500 }
    );
  }
}
