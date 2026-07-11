"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Camera,
  Download,
  Trash2,
} from "lucide-react";

interface VideoPlayerProps {
  src: string;
  sessionIdx: number;
  sessionId?: string;
  videoTitle?: string;
  onScreenshot?: (videoUrl: string, sessionIdx: number, currentTime: number) => void;
  onDelete?: (sessionId: string) => void;
}

export default function VideoPlayer({ src, sessionIdx, sessionId, videoTitle, onScreenshot, onDelete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清除隐藏定时器
  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  // 启动隐藏定时器（3 秒后隐藏）
  const startHideTimer = () => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // 鼠标进入播放器：显示控制栏 + 启动 3 秒消失计时
  const handleMouseEnter = () => {
    setShowControls(true);
    if (playing) {
      startHideTimer();
    } else {
      clearHideTimer();
    }
  };

  // 鼠标在播放器内移动：如果控制栏已隐藏则重新显示，但不动计时器
  const handleMouseMove = () => {
    setShowControls((prev) => {
      if (!prev) return true;
      return prev;
    });
  };

  // 鼠标停在控制栏上：取消计时，永久保持显示
  const handleControlsEnter = () => {
    setShowControls(true);
    clearHideTimer();
  };

  // 鼠标离开控制栏：重启 3 秒消失计时
  const handleControlsLeave = () => {
    if (playing) {
      startHideTimer();
    }
  };

  // 格式化时间
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // 播放/暂停
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  }, []);

  // 进度条更新
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  // 拖拽进度条
  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressRef.current || !videoRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = ratio * duration;
  };

  const handleProgressDrag = (e: React.MouseEvent) => {
    if (e.buttons === 1) handleProgressClick(e);
  };

  // 静音切换
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  // 音量控制
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
      setMuted(v === 0);
    }
  };

  // 全屏
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // 右键菜单：截图
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!videoRef.current || !duration) return;

    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const captureFrame = () => {
    if (!videoRef.current || !onScreenshot) return;
    onScreenshot(src, sessionIdx, videoRef.current.currentTime);
    setContextMenu(null);
  };

  // 点击空白关闭右键菜单
  useEffect(() => {
    const close = () => setContextMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      if (e.code === "KeyM") { toggleMute(); }
      if (e.code === "KeyF") { toggleFullscreen(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [togglePlay]);

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden group select-none"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setShowControls(false); clearHideTimer(); }}
    >
      {/* 视频 */}
      <video
        ref={videoRef}
        src={src}
        className="w-full aspect-video cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setPlaying(false)}
        onContextMenu={handleContextMenu}
        playsInline
        crossOrigin="anonymous"
      />

      {/* 播放/暂停大按钮（暂停时显示） */}
      {!playing && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Play className="h-8 w-8 text-white ml-1" />
          </div>
        </div>
      )}

      {/* 控制栏 */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent
          px-4 pt-8 pb-3 transition-opacity duration-300
          ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onMouseEnter={handleControlsEnter}
        onMouseLeave={handleControlsLeave}
      >
        {/* 进度条 */}
        <div
          ref={progressRef}
          className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group/progress"
          onMouseDown={handleProgressClick}
          onMouseMove={handleProgressDrag}
        >
          <div
            className="h-full bg-white rounded-full relative"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* 按钮行 */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            {/* 播放/暂停 */}
            <button onClick={togglePlay} className="hover:text-zinc-300 transition-colors">
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>

            {/* 时间 */}
            <span className="text-xs tabular-nums text-white/80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* 音量 */}
            <div
              className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button onClick={toggleMute} className="hover:text-zinc-300 transition-colors">
                {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              {showVolumeSlider && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="ml-2 w-20 h-1 accent-white"
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 截图按钮 */}
            <button
              onClick={() => {
                if (!videoRef.current || !onScreenshot) return;
                onScreenshot(src, sessionIdx, videoRef.current.currentTime);
              }}
              className="hover:text-zinc-300 transition-colors"
              title="截图当前帧"
            >
              <Camera className="h-4 w-4" />
            </button>

            {/* 下载视频 */}
            <a
              href={src}
              download={videoTitle ? `${videoTitle}.mp4` : "dance-video.mp4"}
              className="hover:text-zinc-300 transition-colors"
              title="下载视频"
            >
              <Download className="h-4 w-4" />
            </a>

            {/* 删除视频 */}
            {onDelete && sessionId && (
              <button
                onClick={() => onDelete(sessionId)}
                className="hover:text-red-400 transition-colors"
                title="删除此视频"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            {/* 全屏 */}
            <button onClick={toggleFullscreen} className="hover:text-zinc-300 transition-colors">
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={captureFrame}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <Camera className="h-4 w-4" />
            截图当前帧
          </button>
        </div>
      )}
    </div>
  );
}
