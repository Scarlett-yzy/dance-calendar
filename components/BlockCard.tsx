"use client";

import { useState, useRef, useCallback } from "react";
import { ImagePlus, X, Loader2, PencilLine, Maximize2, GripVertical } from "lucide-react";

interface BlockImage {
  id: string;
  url: string;
  source?: "main" | "ref";
}

interface BlockCardProps {
  id: string;
  text?: string;
  images?: BlockImage[];
  onTextChange: (text: string) => void;
  onDelete: () => void;
  onAddImage: (url: string) => void;
  onRemoveImage: (imageId: string) => void;
  onEditImage?: (imageId: string, url: string) => void;
  onReorderImages?: (imageIds: string[]) => void;
}

export default function BlockCard({
  id,
  text = "",
  images = [],
  onTextChange,
  onDelete,
  onAddImage,
  onRemoveImage,
  onEditImage,
  onReorderImages,
}: BlockCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // 拖拽排序
  const dragIdxRef = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData("text/plain", String(idx));
    e.dataTransfer.effectAllowed = "move";
    dragIdxRef.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  };

  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    const fromIdx = parseInt(e.dataTransfer.getData("text/plain"));
    if (isNaN(fromIdx) || fromIdx === dropIdx || !onReorderImages) return;
    const reordered = [...images];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    onReorderImages(reordered.map((img) => img.id));
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    dragIdxRef.current = null;
    setDragOverIdx(null);
  };

  // 上传图片
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/screenshots", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) onAddImage(data.url);
    } catch (error) {
      console.error("图片上传失败:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border backdrop-blur-sm overflow-hidden group" style={{ borderColor: "#d4c5bd", backgroundColor: "#faf8f5" }}>
        {/* 图片列表 — 对比模式 / 普通网格 */}
        {images.length > 0 && (
          <div className="p-2">
            {(() => {
              const hasSource = images.some((img) => img.source);
              if (!hasSource) {
                return (
                  <div className={`grid gap-1 ${
                    images.length === 1 ? "grid-cols-1" : "grid-cols-2"
                  }`}>
                    {images.map((img, idx) => (
                      <div key={img.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`relative rounded-lg overflow-hidden group/img cursor-grab active:cursor-grabbing ${dragOverIdx === idx ? "ring-2 ring-zinc-400" : ""}`}
                      >
                        <img src={img.url} alt="笔记图片"
                          className="w-full object-contain max-h-36 hover:opacity-90 transition-opacity"
                          onClick={() => setPreviewUrl(img.url)}
                        />
                        <div className="absolute top-1 left-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black/40 text-white cursor-grab"><GripVertical className="h-3.5 w-3.5" /></span>
                        </div>
                        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity">
                          {onEditImage && (<button onClick={(e) => { e.stopPropagation(); onEditImage(img.id, img.url); }}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-white/80 backdrop-blur text-zinc-600 hover:bg-white" title="编辑标注"><PencilLine className="h-3 w-3" /></button>)}
                          <button onClick={(e) => { e.stopPropagation(); onRemoveImage(img.id); }}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-white/80 backdrop-blur text-red-500 hover:bg-white" title="删除图片"><X className="h-3 w-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              const refImgs = images.filter((i) => i.source === "ref");
              const mainImgs = images.filter((i) => i.source === "main");
              const maxPairs = Math.max(refImgs.length, mainImgs.length);

              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-center font-medium" style={{ color: "#8c887e" }}>
                    <div className="py-1 rounded" style={{ background: "#f0ece6" }}>📖 参考视频</div>
                    <div className="py-1 rounded" style={{ background: "#f0ece6" }}>🩰 练习视频</div>
                  </div>
                  {Array.from({ length: maxPairs }).map((_, pairIdx) => (
                    <div key={pairIdx} className="grid grid-cols-2 gap-1">
                      {[refImgs[pairIdx], mainImgs[pairIdx]].map((img, colIdx) => (
                        <div key={colIdx} className="relative rounded-lg overflow-hidden group/img"
                          style={img ? {} : { background: "#f5f2ec", minHeight: 80 }}
                        >
                          {img ? (
                            <>
                              <img src={img.url} alt={colIdx === 0 ? "参考截图" : "练习截图"}
                                className="w-full object-contain max-h-36 hover:opacity-90 transition-opacity cursor-pointer"
                                onClick={() => setPreviewUrl(img.url)}
                              />
                              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                {onEditImage && (
                                  <button onClick={(e) => { e.stopPropagation(); onEditImage(img.id, img.url); }}
                                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white/80 backdrop-blur text-zinc-600 hover:bg-white" title="编辑标注"><PencilLine className="h-3 w-3" /></button>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); onRemoveImage(img.id); }}
                                  className="flex h-6 w-6 items-center justify-center rounded-md bg-white/80 backdrop-blur text-red-500 hover:bg-white" title="删除"><X className="h-3 w-3" /></button>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-full text-xs" style={{ color: "#c5bdb5" }}>—</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}

            {!images.some((i) => i.source) && (
              <p className="text-[10px] text-zinc-300 mt-1 text-center">
                拖拽图片可重新排列 · 点击放大
              </p>
            )}
          </div>
        )}

        {/* 文字输入 */}
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="写下你的练习笔记… 比如哪里跳得好、哪里需要改进"
          className="w-full px-3 py-2.5 text-sm resize-none focus:outline-none min-h-[50px] bg-transparent"
          rows={Math.max(2, text.split("\n").length)}
        />

        {/* 底部工具栏 */}
        <div className="flex items-center justify-between px-2 pb-1.5">
          <div className="flex items-center gap-1">
            <button onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              {uploading ? "上传中..." : "图片"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ""; }} />
          </div>
          <button onClick={onDelete}
            className="flex h-7 items-center rounded-md px-2 text-xs text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            删除
          </button>
        </div>
      </div>

      {/* 大图预览 */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 cursor-zoom-out"
          onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} alt="大图预览" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" />
          <button onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <p className="absolute bottom-4 text-xs text-zinc-500">点击任意位置关闭</p>
        </div>
      )}
    </>
  );
}
