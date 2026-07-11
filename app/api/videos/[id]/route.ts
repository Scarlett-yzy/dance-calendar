import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json({ error: "视频未找到" }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error("获取视频失败:", error);
    return NextResponse.json({ error: "获取视频失败" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "请输入有效标题" }, { status: 400 });
    }

    const video = await prisma.video.update({
      where: { id },
      data: { title: title.trim() },
    });

    return NextResponse.json({ success: true, video });
  } catch (error) {
    console.error("更新标题失败:", error);
    return NextResponse.json({ error: "更新标题失败" }, { status: 500 });
  }
}
