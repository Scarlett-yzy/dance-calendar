import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/entries?date=2026-07-11 — 获取某日的完整记录（含多视频 session）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json({ error: "请提供日期参数" }, { status: 400 });
    }

    const date = new Date(dateStr + "T00:00:00.000Z");

    const entry = await prisma.dayEntry.findFirst({
      where: { date },
      include: {
        sessions: {
          orderBy: { sortOrder: "asc" },
          include: {
            video: true,
            blocks: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ entry: null, sessions: [] });
    }

    return NextResponse.json({
      entry: { id: entry.id, date: entry.date.toISOString() },
      sessions: entry.sessions.map((s) => ({
        id: s.id,
        sortOrder: s.sortOrder,
        video: {
          id: s.video.id,
          title: s.video.title,
          fileUrl: s.video.fileUrl,
          thumbnailUrl: s.video.thumbnailUrl,
          recordDate: s.video.recordDate.toISOString(),
        },
        referenceFileUrl: s.referenceFileUrl,
        referenceTitle: s.referenceTitle,
        blocks: s.blocks.map((b) => ({
          id: b.id,
          type: b.type,
          sortOrder: b.sortOrder,
          content: JSON.parse(b.content),
        })),
      })),
    });
  } catch (error) {
    console.error("获取记录失败:", error);
    return NextResponse.json({ error: "获取记录失败" }, { status: 500 });
  }
}

// POST /api/entries — 保存某日的全部 session 和 block
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryId, sessions } = body;

    if (!entryId || !Array.isArray(sessions)) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    // 逐个 session 更新 block
    for (const session of sessions) {
      const { id: sessionId, blocks } = session;
      if (!sessionId || !Array.isArray(blocks)) continue;

      // 删除旧 blocks
      await prisma.block.deleteMany({ where: { sessionId } });

      // 写入新 blocks
      await Promise.all(
        blocks.map((block: { type: string; content: string; sortOrder: number }, i: number) =>
          prisma.block.create({
            data: {
              sessionId,
              type: block.type,
              sortOrder: block.sortOrder ?? i,
              content: typeof block.content === "string"
                ? block.content
                : JSON.stringify(block.content),
            },
          })
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("保存记录失败:", error);
    return NextResponse.json({ error: "保存记录失败" }, { status: 500 });
  }
}
