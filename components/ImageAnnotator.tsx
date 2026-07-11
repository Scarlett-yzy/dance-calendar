"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  MousePointer2, Circle, ArrowUpRight, Type,
  Undo2, Redo2, Download, X, Palette,
  Square, Eraser,
} from "lucide-react";

interface Props { imageUrl: string; onSave: (blob: Blob) => void; onClose: () => void; }

type Tool = "select" | "circle" | "rect" | "arrow" | "text" | "eraser";
const COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#ffffff","#000000","#737373"];

interface Annotation {
  id: string;
  tool: "circle" | "rect" | "arrow" | "text";
  color: string;
  x: number; y: number;
  w?: number; h?: number;    // rect
  endX?: number; endY?: number; // arrow
  radius?: number;            // circle
  text?: string;
}

export default function ImageAnnotator({ imageUrl, onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const annotsRef = useRef<Annotation[]>([]);
  const historyRef = useRef<string[]>([]);
  const hisIdxRef = useRef(-1);
  const drawingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ idx: number; ox: number; oy: number } | null>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [activeColor, setActiveColor] = useState("#ef4444");

  // ----- 重绘核心 -----
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // 画底图
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // 画标注
    for (const a of annotsRef.current) {
      ctx.strokeStyle = a.color;
      ctx.fillStyle = a.color;
      ctx.lineWidth = 3;
      if (a.tool === "circle") {
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius || 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = a.color + "20";
        ctx.fill();
      } else if (a.tool === "rect") {
        ctx.strokeRect(a.x, a.y, a.w || 60, a.h || 60);
        ctx.fillStyle = a.color + "20";
        ctx.fillRect(a.x, a.y, a.w || 60, a.h || 60);
      } else if (a.tool === "arrow") {
        const ex = a.endX ?? a.x + 60, ey = a.endY ?? a.y + 40;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(ex, ey); ctx.stroke();
        const angle = Math.atan2(ey - a.y, ex - a.x);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 14 * Math.cos(angle - 0.4), ey - 14 * Math.sin(angle - 0.4));
        ctx.lineTo(ex - 14 * Math.cos(angle + 0.4), ey - 14 * Math.sin(angle + 0.4));
        ctx.closePath(); ctx.fill();
      } else if (a.tool === "text") {
        ctx.font = "bold 20px sans-serif";
        ctx.fillText(a.text || "?", a.x, a.y);
      }
    }
  }, []);

  const saveSnapshot = useCallback(() => {
    historyRef.current.length = hisIdxRef.current + 1;
    historyRef.current.push(JSON.stringify(annotsRef.current));
    hisIdxRef.current = historyRef.current.length - 1;
  }, []);

  // ----- 加载图片 -----
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxW = Math.min(900, window.innerWidth - 80);
      const maxH = Math.min(650, window.innerHeight - 140);
      const sc = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
      canvas.width = Math.round(img.naturalWidth * sc);
      canvas.height = Math.round(img.naturalHeight * sc);
      canvas.style.width = canvas.width + "px";
      canvas.style.height = canvas.height + "px";
      setReady(true);
      redraw();
      saveSnapshot();
    };
    img.onerror = () => setError("图片加载失败: " + imageUrl);
  }, [imageUrl, redraw, saveSnapshot]);

  // redraw 在 annots 变化后
  useEffect(() => { if (ready) redraw(); }, [ready, redraw, activeTool]);

  // ----- 获取 canvas 内坐标 -----
  const pos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // ----- 鼠标按下 -----
  const onMouseDown = (e: React.MouseEvent) => {
    const p = pos(e);
    if (!p || !canvasRef.current) return;

    if (activeTool === "select") {
      // 找最近的标注拖拽
      for (let i = annotsRef.current.length - 1; i >= 0; i--) {
        const a = annotsRef.current[i];
        const dist = Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
        if (dist < 60) { dragRef.current = { idx: i, ox: p.x - a.x, oy: p.y - a.y }; return; }
      }
      dragRef.current = null;
      return;
    }

    if (activeTool === "eraser") {
      // 橡皮擦：删除最近的标注
      for (let i = annotsRef.current.length - 1; i >= 0; i--) {
        const a = annotsRef.current[i];
        const dist = Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
        if (dist < 60) {
          annotsRef.current.splice(i, 1);
          saveSnapshot();
          redraw();
          return;
        }
      }
      return;
    }

    if (activeTool === "text") {
      const txt = prompt("输入标注文字：", "问题区域");
      if (txt) {
        annotsRef.current.push({ id: Date.now() + "", tool: "text", color: activeColor, x: p.x, y: p.y, text: txt });
        saveSnapshot();
        redraw();
      }
      return;
    }

    // 绘图类工具：circle / rect / arrow
    drawingRef.current = true;
    startRef.current = { x: p.x, y: p.y };

    if (activeTool === "circle") {
      annotsRef.current.push({ id: Date.now() + "", tool: "circle", color: activeColor, x: p.x, y: p.y, radius: 0 });
    } else if (activeTool === "rect") {
      annotsRef.current.push({ id: Date.now() + "", tool: "rect", color: activeColor, x: p.x, y: p.y, w: 0, h: 0 });
    } else if (activeTool === "arrow") {
      annotsRef.current.push({ id: Date.now() + "", tool: "arrow", color: activeColor, x: p.x, y: p.y, endX: p.x, endY: p.y });
    }
  };

  // ----- 鼠标移动 -----
  const onMouseMove = (e: React.MouseEvent) => {
    if (activeTool === "select" && dragRef.current) {
      const p = pos(e);
      if (!p) return;
      const a = annotsRef.current[dragRef.current.idx];
      if (!a) return;
      a.x = p.x - dragRef.current.ox;
      a.y = p.y - dragRef.current.oy;
      redraw();
      return;
    }

    if (!drawingRef.current) return;
    const p = pos(e);
    if (!p) return;
    const last = annotsRef.current[annotsRef.current.length - 1];
    if (!last) return;

    const sx = startRef.current.x, sy = startRef.current.y;

    if (last.tool === "circle") {
      const dx = p.x - sx, dy = p.y - sy;
      last.radius = Math.max(5, Math.round(Math.sqrt(dx * dx + dy * dy)));
      last.x = sx; last.y = sy;
    } else if (last.tool === "rect") {
      last.x = Math.min(sx, p.x);
      last.y = Math.min(sy, p.y);
      last.w = Math.abs(p.x - sx);
      last.h = Math.abs(p.y - sy);
    } else if (last.tool === "arrow") {
      last.endX = p.x;
      last.endY = p.y;
    }
    redraw();
  };

  // ----- 鼠标松开 -----
  const onMouseUp = () => {
    if (drawingRef.current) {
      drawingRef.current = false;
      // 半径/尺寸为 0 则删除（点击没拖动的情况）
      const last = annotsRef.current[annotsRef.current.length - 1];
      if (last) {
        if ((last.tool === "circle" && (!last.radius || last.radius < 5)) ||
            (last.tool === "rect" && (!last.w || last.w < 5)) ||
            (last.tool === "arrow" && last.endX === last.x && last.endY === last.y)) {
          annotsRef.current.pop();
        }
      }
      saveSnapshot();
      redraw();
    }
    dragRef.current = null;
  };

  // ----- Delete 键 -----
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") &&
          !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        if (annotsRef.current.length > 0) {
          annotsRef.current.pop();
          saveSnapshot(); redraw();
        }
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [saveSnapshot, redraw]);

  const undo = () => {
    if (hisIdxRef.current > 0) {
      hisIdxRef.current--;
      annotsRef.current = JSON.parse(historyRef.current[hisIdxRef.current]);
      redraw();
    }
  };
  const redo = () => {
    if (hisIdxRef.current < historyRef.current.length - 1) {
      hisIdxRef.current++;
      annotsRef.current = JSON.parse(historyRef.current[hisIdxRef.current]);
      redraw();
    }
  };
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((b) => { if (b) onSave(b); }, "image/png");
  };

  if (error) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white rounded-xl p-8 max-w-md text-center">
        <p className="text-red-500 mb-2 font-medium">加载失败</p>
        <p className="text-xs text-zinc-500 mb-4 break-all">{error}</p>
        <button onClick={onClose} className="rounded-lg bg-zinc-900 px-4 py-2 text-white text-sm">关闭</button>
      </div>
    </div>
  );

  const btn = (t: Tool, icon: React.ReactNode, title: string) => (
    <button onClick={() => setActiveTool(t)}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${activeTool === t ? "bg-zinc-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-700"}`}
      title={title}>{icon}</button>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/85" style={{ isolation: "isolate" }}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-700 shrink-0">
        <div className="flex items-center gap-1">
          {btn("select", <MousePointer2 className="h-4 w-4" />, "选择/移动")}
          <div className="w-px h-6 bg-zinc-700 mx-1" />
          {btn("circle", <Circle className="h-4 w-4" />, "画圆")}
          {btn("rect", <Square className="h-4 w-4" />, "画矩形")}
          {btn("arrow", <ArrowUpRight className="h-4 w-4" />, "箭头")}
          {btn("text", <Type className="h-4 w-4" />, "文字标注")}
          <div className="w-px h-6 bg-zinc-700 mx-1" />
          {btn("eraser", <Eraser className="h-4 w-4" />, "橡皮擦")}
          <div className="w-px h-6 bg-zinc-700 mx-1" />
          <button onClick={undo} className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors" title="撤销"><Undo2 className="h-4 w-4" /></button>
          <button onClick={redo} className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors" title="重做"><Redo2 className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Palette className="h-3.5 w-3.5 text-zinc-500" />
            {COLORS.map(c => (
              <button key={c} onClick={() => setActiveColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${activeColor === c ? "border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="w-px h-6 bg-zinc-700" />
          <button onClick={onClose} className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"><X className="h-4 w-4" /> 取消</button>
          <button onClick={handleSave} className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 transition-colors"><Download className="h-4 w-4" /> 保存标注</button>
        </div>
      </div>

      {/* Canvas */}
      {!ready && <div className="flex-1 flex items-center justify-center bg-zinc-800 text-white text-lg">加载图片中...</div>}
      <div className="flex-1 flex items-start justify-center overflow-auto p-4 bg-zinc-800"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}>
        <canvas ref={canvasRef} className="rounded-lg shadow-2xl"
          style={{ cursor: activeTool === "select" || activeTool === "eraser" ? "default" : "crosshair" }} />
      </div>

      <div className="shrink-0 px-4 py-1.5 bg-zinc-900 border-t border-zinc-700 text-center">
        <p className="text-xs text-zinc-500">
          {activeTool === "select" ? "拖拽移动标注 · Delete 键删除最后一个" :
           activeTool === "eraser" ? "点击标注可删除" :
           "拖动鼠标绘制形状 · 点击产生文字标注"}
        </p>
      </div>
    </div>
  );
}
