"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause, Maximize, Camera, Download, Link, Link2Off, PencilLine, Check, X, Trash2 } from "lucide-react";

interface ComparePlayerProps {
  mainSrc: string;
  mainTitle: string;
  mainVideoId: string;
  refSrc: string;
  refTitle: string;
  sessionId: string;
  onScreenshot?: (blob: Blob, sessionIdx: number, source: "main" | "ref") => void;
  onDelete?: (sessionId: string) => void;
  onDeleteRef?: (sessionId: string) => void;
  sessionIdx: number;
}

export default function ComparePlayer({
  mainSrc, mainTitle, mainVideoId, refSrc, refTitle, sessionId,
  onScreenshot, onDelete, onDeleteRef, sessionIdx,
}: ComparePlayerProps) {
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const refVideoRef = useRef<HTMLVideoElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const refContainerRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [synced, setSynced] = useState(true);
  const [mainTime, setMainTime] = useState(0);
  const [refTime, setRefTime] = useState(0);
  const [mainDuration, setMainDuration] = useState(0);
  const [refDuration, setRefDuration] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; target: "main" | "ref" } | null>(null);

  const [editingRefTitle, setEditingRefTitle] = useState(false);
  const [editingMainTitle, setEditingMainTitle] = useState(false);
  const [refTitleDraft, setRefTitleDraft] = useState(refTitle);
  const [mainTitleDraft, setMainTitleDraft] = useState(mainTitle);
  const refInputRef = useRef<HTMLInputElement>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingRefTitle && refInputRef.current) { refInputRef.current.focus(); refInputRef.current.select(); }
  }, [editingRefTitle]);
  useEffect(() => {
    if (editingMainTitle && mainInputRef.current) { mainInputRef.current.focus(); mainInputRef.current.select(); }
  }, [editingMainTitle]);

  const saveRefTitle = async () => {
    const t = refTitleDraft.trim();
    if (!t || t === refTitle) { setRefTitleDraft(refTitle); setEditingRefTitle(false); return; }
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceTitle: t }),
      });
    } catch (e) { console.error(e); }
    setEditingRefTitle(false);
  };

  const saveMainTitle = async () => {
    const t = mainTitleDraft.trim();
    if (!t || t === mainTitle) { setMainTitleDraft(mainTitle); setEditingMainTitle(false); return; }
    try {
      await fetch(`/api/videos/${mainVideoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t }),
      });
    } catch (e) { console.error(e); }
    setEditingMainTitle(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const togglePlay = useCallback(() => {
    const mv = mainVideoRef.current;
    const rv = refVideoRef.current;
    if (!mv || !rv) return;
    if (mv.paused) { mv.play(); rv.play(); setPlaying(true); }
    else { mv.pause(); rv.pause(); setPlaying(false); }
  }, []);

  const syncToMain = () => {
    if (!synced || !refVideoRef.current || !mainVideoRef.current) return;
    if (Math.abs(refVideoRef.current.currentTime - mainVideoRef.current.currentTime) > 0.5) {
      refVideoRef.current.currentTime = mainVideoRef.current.currentTime;
    }
  };
  const syncToRef = () => {
    if (!synced || !mainVideoRef.current || !refVideoRef.current) return;
    if (Math.abs(mainVideoRef.current.currentTime - refVideoRef.current.currentTime) > 0.5) {
      mainVideoRef.current.currentTime = refVideoRef.current.currentTime;
    }
  };

  const handleSeek = (video: HTMLVideoElement | null, duration: number, e: React.MouseEvent) => {
    const bar = e.currentTarget as HTMLDivElement;
    if (!video || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * duration;
    if (synced) {
      const other = video === mainVideoRef.current ? refVideoRef.current : mainVideoRef.current;
      if (other) other.currentTime = video.currentTime;
    }
  };

  const capture = (which: "main" | "ref") => {
    const video = which === "main" ? mainVideoRef.current : refVideoRef.current;
    if (!video || !onScreenshot) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => { if (blob) onScreenshot(blob, sessionIdx, which); }, "image/png");
  };

  const handleContextMenu = (e: React.MouseEvent, target: "main" | "ref") => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, target });
  };
  useEffect(() => { const close = () => setContextMenu(null); document.addEventListener("click", close); return () => document.removeEventListener("click", close); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) { e.preventDefault(); togglePlay(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [togglePlay]);

  const renderVideo = (which: "main" | "ref") => {
    const isMain = which === "main";
    const videoRef = isMain ? mainVideoRef : refVideoRef;
    const containerRef = isMain ? mainContainerRef : refContainerRef;
    const icon = isMain ? "💃" : "📺";
    const currentTime = isMain ? mainTime : refTime;
    const duration = isMain ? mainDuration : refDuration;
    const setTime = isMain ? setMainTime : setRefTime;
    const setDuration = isMain ? setMainDuration : setRefDuration;

    return (
      <div className="space-y-1">
        {/* 标题 */}
        <div className="flex items-center gap-1.5 group/title">
          <span className="text-xs font-medium shrink-0">{icon}</span>
          {editingRefTitle || editingMainTitle ? (
            <div className="flex items-center gap-0.5 flex-1">
              <input ref={isMain ? mainInputRef : refInputRef} type="text"
                value={isMain ? mainTitleDraft : refTitleDraft}
                onChange={(e) => isMain ? setMainTitleDraft(e.target.value) : setRefTitleDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { isMain ? saveMainTitle() : saveRefTitle(); } if (e.key === "Escape") { if (isMain) { setMainTitleDraft(mainTitle); setEditingMainTitle(false); } else { setRefTitleDraft(refTitle); setEditingRefTitle(false); } } }}
                onBlur={isMain ? saveMainTitle : saveRefTitle}
                className="flex-1 rounded border border-zinc-300 px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400" />
              <button onClick={isMain ? saveMainTitle : saveRefTitle} className="flex h-5 w-5 items-center justify-center rounded text-green-600 hover:bg-green-50"><Check className="h-3 w-3" /></button>
              <button onClick={() => { if (isMain) { setMainTitleDraft(mainTitle); setEditingMainTitle(false); } else { setRefTitleDraft(refTitle); setEditingRefTitle(false); } }} className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:text-red-500"><X className="h-3 w-3" /></button>
            </div>
          ) : (
            <>
              <span className="text-xs font-medium text-zinc-500 truncate">{isMain ? mainTitle : refTitle}</span>
              <button onClick={() => isMain ? setEditingMainTitle(true) : setEditingRefTitle(true)} className="opacity-0 group-hover/title:opacity-100 flex h-4 w-4 items-center justify-center rounded text-zinc-400 hover:text-zinc-600 transition-all"><PencilLine className="h-3 w-3" /></button>
            </>
          )}
        </div>

        <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden group">
          <video ref={videoRef} src={isMain ? mainSrc : refSrc}
            className="w-full aspect-video cursor-pointer"
            onClick={togglePlay}
            onTimeUpdate={() => { setTime(videoRef.current?.currentTime || 0); isMain ? syncToRef() : syncToMain(); }}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onEnded={() => setPlaying(false)}
            onContextMenu={(e) => handleContextMenu(e, which)}
            onDoubleClick={() => { if (containerRef.current) { if (!document.fullscreenElement) containerRef.current.requestFullscreen(); else document.exitFullscreen(); } }}
            playsInline />

          {!playing && (
            <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Play className="h-6 w-6 text-white ml-0.5" />
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-2 group/progress"
              onClick={(e) => handleSeek(videoRef.current, duration, e)}>
              <div className="h-full bg-white rounded-full relative"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <button onClick={togglePlay} className="hover:text-zinc-300 transition-colors">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
                <span className="text-xs tabular-nums text-white/70">{formatTime(currentTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => capture(which)} className="hover:text-zinc-300 transition-colors" title="截图当前帧"><Camera className="h-3.5 w-3.5" /></button>
                <a href={isMain ? mainSrc : refSrc} download={isMain ? `${mainTitle}.mp4` : `${refTitle}.mp4`} className="hover:text-zinc-300 transition-colors" title="下载视频"><Download className="h-3.5 w-3.5" /></a>
                <button
                  onClick={() => isMain ? onDelete?.(sessionId) : onDeleteRef?.(sessionId)}
                  className="hover:text-red-400 transition-colors" title="删除此视频">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { if (containerRef.current) { if (!document.fullscreenElement) containerRef.current.requestFullscreen(); else document.exitFullscreen(); } }} className="hover:text-zinc-300 transition-colors" title="全屏"><Maximize className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => setSynced(!synced)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${synced ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>
          {synced ? <><Link className="h-3 w-3" /> 进度已同步</> : <><Link2Off className="h-3 w-3" /> 同步已断开</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {renderVideo("ref")}
        {renderVideo("main")}
      </div>

      <p className="text-xs text-zinc-400 text-center">
        空格键同时播放/暂停 · 鼠标悬停显示控制栏 · 右键截图
      </p>

      {contextMenu && (
        <div className="fixed z-50 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button onClick={() => { capture(contextMenu!.target); setContextMenu(null); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 transition-colors">
            <Camera className="h-4 w-4" /> 截图当前帧
          </button>
        </div>
      )}
    </div>
  );
}
