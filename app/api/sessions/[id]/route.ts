import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/upload";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { referenceTitle, clearReference } = body;

    const updateData: Record<string, string | null> = {};
    if (clearReference) {
      updateData.referenceFileUrl = null;
      updateData.referencePublicId = null;
      updateData.referenceTitle = null;
    } else if (referenceTitle !== undefined) {
      updateData.referenceTitle = referenceTitle?.trim() || null;
    }

    const session = await prisma.session.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("更新失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: { video: true },
    });

    if (!session) {
      return NextResponse.json({ error: "未找到" }, { status: 404 });
    }

    await prisma.block.deleteMany({ where: { sessionId: id } });
    await prisma.session.delete({ where: { id } });

    // 删除 Cloudinary 上的视频文件
    if (session.video.publicId) {
      await deleteFile(session.video.publicId);
    }

    // 检查该视频是否还有别的 session
    const remaining = await prisma.session.count({
      where: { videoId: session.videoId },
    });
    if (remaining === 0) {
      await prisma.video.delete({ where: { id: session.videoId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除失败:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
