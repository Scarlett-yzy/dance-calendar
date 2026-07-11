"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Check, ImagePlus, Trash2 } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import ComparePlayer from "@/components/ComparePlayer";
import BlockCard from "@/components/BlockCard";
import ImageAnnotator from "@/components/ImageAnnotator";
import SessionTitle from "@/components/SessionTitle";

interface BlockContent {
  text?: string;
  images?: { id: string; url: string }[];
}

interface BlockItem {
  id: string;
  type: string;
  sortOrder: number;
  content: BlockContent;
}

interface SessionData {
  id: string;
  sortOrder: number;
  video: {
    id: string;
    title: string;
    fileUrl: string;
    thumbnailUrl: string | null;
    recordDate: string;
  };
  referenceFileUrl?: string | null;
  referenceTitle?: string | null;
  blocks: BlockItem[];
}

export default function DayDetailPage() {
  const params = useParams();
  const date = params.date as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 加载数据
  useEffect(() => {
    setLoading(true);
    fetch(`/api/entries?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.entry) setEntryId(data.entry.id);
        setSessions(data.sessions || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date]);

  // 自动保存
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(), 2000);
  }, [sessions, entryId]);

  const doSave = async () => {
    if (!entryId || sessions.length === 0) return;
    setSaving(true);
    try {
      await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId,
          sessions: sessions.map((s) => ({
            id: s.id,
            blocks: s.blocks.map((b, i) => ({
              type: b.type,
              sortOrder: i,
              content: b.content,
            })),
          })),
        }),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("保存失败:", error);
    } finally {
      setSaving(false);
    }
  };

  // 截图 → 添加到对应 session
  const handleScreenshot = useCallback(async (blob: Blob, sessionIdx: number, source?: "main" | "ref") => {
    const formData = new FormData();
    formData.append("image", blob, "screenshot.png");

    try {
      const res = await fetch("/api/screenshots", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        const newImg = { id: crypto.randomUUID(), url: data.url };

        setSessions((prev) => {
          if (sessionIdx < 0 || sessionIdx >= prev.length) return prev;
          const updated = [...prev];
          const session = updated[sessionIdx];

          // 找最后一个 mixed 或 text 格子里放，没有就新建
          const targetBlock = session.blocks.findLast((b) => b.type === "mixed" || b.type === "text");
          if (targetBlock) {
            updated[sessionIdx] = {
              ...session,
              blocks: session.blocks.map((b) =>
                b.id === targetBlock.id
                  ? { ...b, type: "mixed", content: { ...b.content, images: [...(b.content.images || []), newImg], text: b.content.text || "" } }
                  : b
              ),
            };
          } else {
            updated[sessionIdx] = {
              ...session,
              blocks: [
                ...session.blocks,
                {
                  id: crypto.randomUUID(),
                  type: "mixed",
                  sortOrder: session.blocks.length,
                  content: { text: "", images: [newImg] },
                },
              ],
            };
          }
          return updated;
        });
      }
    } catch (error) {
      console.error("截图保存失败:", error);
    }
  }, []);

  // 删除确认对话框
  const [deleteConfirm, setDeleteConfirm] = useState<{ sessionId: string; title: string; mode: "full" | "ref" } | null>(null);

  // 删除视频（Session）
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    setDeleteConfirm({ sessionId, title: session.video.title, mode: "full" });
  }, [sessions]);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.mode === "full") {
        const res = await fetch(`/api/sessions/${deleteConfirm.sessionId}`, { method: "DELETE" });
        if (res.ok) {
          setSessions((prev) => prev.filter((s) => s.id !== deleteConfirm.sessionId));
        }
      } else {
        const res = await fetch(`/api/sessions/${deleteConfirm.sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clearReference: true }),
        });
        if (res.ok) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === deleteConfirm.sessionId ? { ...s, referenceFileUrl: null, referenceTitle: null } : s
            )
          );
        }
      }
    } catch (e) {
      console.error("删除失败:", e);
    }
    setDeleteConfirm(null);
  };

  // 删除参考视频（只清空参考字段，不删主视频和笔记）
  const handleDeleteRef = useCallback(async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    setDeleteConfirm({ sessionId, title: "参考视频", mode: "ref" });
  }, [sessions]);

  // BlockCard 回调（按 session）
  const updateBlockText = (sessionIdx: number, blockId: string, text: string) => {
    setSessions((prev) => {
      const updated = [...prev];
      updated[sessionIdx] = {
        ...updated[sessionIdx],
        blocks: updated[sessionIdx].blocks.map((b) =>
          b.id === blockId ? { ...b, content: { ...b.content, text } } : b
        ),
      };
      return updated;
    });
    scheduleSave();
  };

  const removeBlock = (sessionIdx: number, blockId: string) => {
    setSessions((prev) => {
      const updated = [...prev];
      updated[sessionIdx] = {
        ...updated[sessionIdx],
        blocks: updated[sessionIdx].blocks.filter((b) => b.id !== blockId),
      };
      return updated;
    });
    scheduleSave();
  };

  const addImageToBlock = (sessionIdx: number, blockId: string, imageUrl: string) => {
    setSessions((prev) => {
      const updated = [...prev];
      updated[sessionIdx] = {
        ...updated[sessionIdx],
        blocks: updated[sessionIdx].blocks.map((b) =>
          b.id === blockId
            ? {
                ...b,
                type: "mixed",
                content: {
                  ...b.content,
                  images: [...(b.content.images || []), { id: crypto.randomUUID(), url: imageUrl }],
                },
              }
            : b
        ),
      };
      return updated;
    });
    scheduleSave();
  };

  const removeImageFromBlock = (sessionIdx: number, blockId: string, imageId: string) => {
    setSessions((prev) => {
      const updated = [...prev];
      updated[sessionIdx] = {
        ...updated[sessionIdx],
        blocks: updated[sessionIdx].blocks.map((b) =>
          b.id === blockId
            ? {
                ...b,
                content: {
                  ...b.content,
                  images: (b.content.images || []).filter((img) => img.id !== imageId),
                },
              }
            : b
        ),
      };
      return updated;
    });
    scheduleSave();
  };

  const reorderImages = (sessionIdx: number, blockId: string, imageIds: string[]) => {
    setSessions((prev) => {
      const updated = [...prev];
      updated[sessionIdx] = {
        ...updated[sessionIdx],
        blocks: updated[sessionIdx].blocks.map((b) =>
          b.id === blockId
            ? {
                ...b,
                content: {
                  ...b.content,
                  images: imageIds.map((id) => (b.content.images || []).find((img) => img.id === id)!).filter(Boolean),
                },
              }
            : b
        ),
      };
      return updated;
    });
    scheduleSave();
  };

  const addBlock = (sessionIdx: number) => {
    setSessions((prev) => {
      const updated = [...prev];
      updated[sessionIdx] = {
        ...updated[sessionIdx],
        blocks: [
          ...updated[sessionIdx].blocks,
          { id: crypto.randomUUID(), type: "text", sortOrder: updated[sessionIdx].blocks.length, content: { text: "" } },
        ],
      };
      return updated;
    });
  };

  // 图片标注
  const [editingImage, setEditingImage] = useState<{
    sessionIdx: number;
    imageId: string;
    url: string;
  } | null>(null);

  const editImage = (sessionIdx: number, imageId: string, url: string) => {
    setEditingImage({ sessionIdx, imageId, url });
  };

  const handleAnnotatedSave = async (blob: Blob) => {
    if (!editingImage) return;
    const formData = new FormData();
    formData.append("image", blob, "annotated.png");
    try {
      const res = await fetch("/api/screenshots", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => {
          const updated = [...prev];
          updated[editingImage.sessionIdx] = {
            ...updated[editingImage.sessionIdx],
            blocks: updated[editingImage.sessionIdx].blocks.map((b) => ({
              ...b,
              content: {
                ...b.content,
                images: (b.content.images || []).map((img) =>
                  img.id === editingImage.imageId ? { ...img, url: data.url } : img
                ),
              },
            })),
          };
          return updated;
        });
      }
    } catch (error) {
      console.error("标注保存失败:", error);
    }
    setEditingImage(null);
    scheduleSave();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fcf8f5]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const totalVideos = sessions.length;

  return (
    <div className="min-h-screen relative bg-[#fcf8f5]">
      {/* pai.co 风格流动色块 */}
      <div className="fixed pointer-events-none w-[45vw] h-[45vw] rounded-full" style={{ left: "5%", top: "10%", background: "#fce9dc", filter: "blur(100px)", opacity: 0.5, animation: "driftA 18s ease-in-out infinite" }} />
      <div className="fixed pointer-events-none w-[50vw] h-[50vw] rounded-full" style={{ left: "50%", top: "-5%", background: "#f8d7d7", filter: "blur(110px)", opacity: 0.5, animation: "driftB 22s ease-in-out infinite alternate" }} />
      <div className="fixed pointer-events-none w-[40vw] h-[40vw] rounded-full" style={{ left: "30%", top: "50%", background: "#e8d4e8", filter: "blur(100px)", opacity: 0.45, animation: "driftC 20s ease-in-out infinite alternate-reverse" }} />
      <div className="fixed pointer-events-none w-[55vw] h-[55vw] rounded-full" style={{ left: "-10%", top: "30%", background: "#d7d4ee", filter: "blur(120px)", opacity: 0.4, animation: "driftD 25s ease-in-out infinite" }} />
      <div className="max-w-5xl mx-auto w-full px-4 py-6 relative z-10">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link
            href="/calendar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-zinc-800">{date}</h1>
            <p className="text-xs text-zinc-500">{totalVideos} 支舞蹈</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">
            {saving ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> 保存中...</span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1"><Check className="h-3 w-3" /> 已保存</span>
            ) : null}
          </span>
          <button onClick={doSave} disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:bg-zinc-300 transition-colors">
            保存所有
          </button>
        </div>
      </div>

      {/* 分 Session 展示 */}
      {sessions.length === 0 && (
        <div className="text-center py-16">
          <p className="mb-4" style={{ color: "#8a7b76" }}>该日期还没有舞蹈视频</p>
          <Link href={`/upload?date=${date}`}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: "linear-gradient(120deg, #8f8fae, #6f6f92)" }}>
            <Plus className="h-4 w-4" /> 上传视频
          </Link>
        </div>
      )}

      {sessions.map((session, sessionIdx) => (
        <div key={session.id}>
          {/* Session 分界线 */}
          {sessionIdx > 0 && (
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed" style={{ borderColor: "#d4c5bd" }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-xs" style={{ color: "#8a7b76", backgroundColor: "transparent" }}>
                  第 {sessionIdx + 1} 支舞蹈
                </span>
              </div>
            </div>
          )}

          {/* Session 标题 */}
          <div className="flex items-center justify-between gap-2">
            <SessionTitle
              sessionIdx={sessionIdx}
              videoId={session.video.id}
              initialTitle={session.video.title}
            />
          </div>

          {/* 左右两栏 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左：视频 */}
            <div className="space-y-3">
              {session.referenceFileUrl ? (
                <ComparePlayer
                  mainSrc={session.video.fileUrl}
                  mainTitle={session.video.title}
                  mainVideoId={session.video.id}
                  refSrc={session.referenceFileUrl}
                  refTitle={session.referenceTitle || "参考视频"}
                  sessionId={session.id}
                  onScreenshot={handleScreenshot}
                  onDelete={handleDeleteSession}
                  onDeleteRef={handleDeleteRef}
                  sessionIdx={sessionIdx}
                />
              ) : (
                <VideoPlayer src={session.video.fileUrl} sessionIdx={sessionIdx} sessionId={session.id} videoTitle={session.video.title} onScreenshot={handleScreenshot} onDelete={handleDeleteSession} />
              )}
              <p className="text-xs text-zinc-400 text-center">
                右键视频画面可截图，或点击控制栏的相机图标
              </p>
            </div>

            {/* 右：笔记 */}
            <div className="space-y-3">
              {session.blocks.length === 0 && (
                <div className="rounded-xl border border-dashed p-6 text-center" style={{ borderColor: "#d4c5bd", backgroundColor: "#faf8f5" }}>
                  <ImagePlus className="h-6 w-6 mx-auto mb-2" style={{ color: "#d4c5bd" }} />
                  <p className="text-sm" style={{ color: "#8a7b76" }}>截图或添加笔记</p>
                </div>
              )}

              {session.blocks.map((block) => (
                <BlockCard
                    key={block.id}
                    id={block.id}
                    text={block.content.text}
                    images={block.content.images}
                    onTextChange={(text) => updateBlockText(sessionIdx, block.id, text)}
                    onDelete={() => removeBlock(sessionIdx, block.id)}
                    onAddImage={(url) => addImageToBlock(sessionIdx, block.id, url)}
                    onRemoveImage={(imageId) => removeImageFromBlock(sessionIdx, block.id, imageId)}
                    onEditImage={(imageId, url) => editImage(sessionIdx, imageId, url)}
                    onReorderImages={(imageIds) => reorderImages(sessionIdx, block.id, imageIds)}
                  />
              ))}

              <button onClick={() => addBlock(sessionIdx)}
                className="w-full rounded-xl border-2 border-dashed py-3 text-sm flex items-center justify-center gap-1 transition-all hover:opacity-80 active:scale-[0.98] cursor-pointer" style={{ borderColor: "#d4c5bd", color: "#8a7b76", backgroundColor: "#faf8f5" }}>
                <Plus className="h-4 w-4" /> 添加笔记格子
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* 上传更多视频按钮 */}
      {sessions.length > 0 && (
        <div className="mt-8 text-center">
          <Link
            href={`/upload?date=${date}`}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed px-6 py-3 text-sm font-medium transition-colors" style={{ borderColor: "#d4c5bd", color: "#8a7b76" }}
          >
            <Plus className="h-4 w-4" /> 添加当天另一支舞蹈
          </Link>
        </div>
      )}

      {/* 图片标注编辑器 */}
      {editingImage && (
        <ImageAnnotator
          imageUrl={editingImage.url}
          onSave={handleAnnotatedSave}
          onClose={() => setEditingImage(null)}
        />
      )}

      {/* 删除确认对话框 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-warm-dark mb-2">确认删除？</h3>
            <p className="text-sm text-warm-muted mb-6">
              {deleteConfirm.mode === "ref"
                ? `将移除参考视频「${deleteConfirm.title}」，你的舞蹈视频和笔记不受影响`
                : `将永久删除「${deleteConfirm.title}」及其所有笔记和截图`
              }
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-xl bg-cream-dark px-5 py-2.5 text-sm font-medium text-warm-dark hover:bg-warm-muted/20 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
