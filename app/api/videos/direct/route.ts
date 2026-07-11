import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      recordDate,
      videoUrl,
      videoPublicId,
      thumbnailUrl,
      referenceFileUrl,
      referencePublicId,
      referenceTitle,
    } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: "视频 URL 缺失" }, { status: 400 });
    }

    const recordDateObj = recordDate
      ? new Date(recordDate + "T00:00:00.000Z")
      : new Date();

    // 创建 Video 记录
    const video = await prisma.video.create({
      data: {
        title: title || "未命名视频",
        fileUrl: videoUrl,
        publicId: videoPublicId,
        thumbnailUrl: thumbnailUrl || null,
        recordDate: recordDateObj,
      },
    });

    // 查找或创建 DayEntry
    let entry = await prisma.dayEntry.findFirst({
      where: { date: recordDateObj },
    });

    if (!entry) {
      entry = await prisma.dayEntry.create({
        data: { date: recordDateObj },
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
        referenceFileUrl: referenceFileUrl || null,
        referencePublicId: referencePublicId || null,
        referenceTitle: referenceTitle || null,
        sortOrder: (lastSession?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json({ success: true, video });
  } catch (error) {
    console.error("保存视频记录失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存失败" },
      { status: 500 }
    );
  }
}
