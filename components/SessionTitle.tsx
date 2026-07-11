"use client";

import { useState, useRef, useEffect } from "react";
import { PencilLine, Check, X, Smile, ChevronDown } from "lucide-react";

interface SessionTitleProps {
  sessionIdx: number;
  videoId: string;
  initialTitle: string;
}

// ★ 字体大全
const FONTS = [
  { label: "极粗黑体", value: "f-black", family: "", weight: "900" },
  { label: "粗圆体", value: "f-noto", family: "var(--font-noto)", weight: "900" },
  { label: "宋体粗", value: "f-nss", family: "var(--font-nss)", weight: "700" },
  { label: "块乐体", value: "f-zk", family: "var(--font-zk)", weight: "400" },
  { label: "手写体", value: "f-msz", family: "var(--font-msz)", weight: "400" },
];

// ★ Emoji 大全 — 分门别类
const EMOJI_CATEGORIES = [
  {
    name: "🎉 庆祝",
    items: ["🎉","✨","🎊","🌟","⭐","🏆","🥇","🎯","🎪","🎠","💫","🎈","🎁","🎀","🎃"],
  },
  {
    name: "🔥 舞蹈",
    items: ["💃","🕺","🩰","🎵","🎶","🎤","🎧","🎼","🥁","🪘","🎸","🎹","🎬","📸","🎥"],
  },
  {
    name: "💪 加油",
    items: ["💪","🔥","⚡","💥","💯","✅","❤️","💖","💗","💙","💜","🧡","💛","💚","🤍"],
  },
  {
    name: "🌸 日常",
    items: ["🌸","🌺","🌻","🌷","🌹","🍀","🌈","☀️","🌙","⭐","⛅","❄️","🌊","🔥","🍃"],
  },
  {
    name: "🍉 食物",
    items: ["🍉","🍎","🍊","🍋","🍌","🍇","🍓","🫐","🍑","🍒","🥝","🍕","🍔","🌮","🍦"],
  },
  {
    name: "😊 表情",
    items: ["😊","😂","🥰","😍","🤩","😎","🤗","😭","😤","🥺","😴","🤔","🙄","😱","🥳"],
  },
  {
    name: "🎮 其他",
    items: ["🔥","💎","👑","🎲","♟️","🧩","🎭","🎨","🪄","🔮","💡","🔔","📌","🎯","🧸"],
  },
];

export default function SessionTitle({ sessionIdx, videoId, initialTitle }: SessionTitleProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [showFonts, setShowFonts] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [fontFamily, setFontFamily] = useState(FONTS[0]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fontRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) setShowFonts(false);
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmojis(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const saveTitle = async (newTitle: string) => {
    if (newTitle.trim() === "" || newTitle === initialTitle) {
      setTitle(initialTitle);
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await fetch(`/api/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
    } catch (error) {
      console.error("更新标题失败:", error);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setTitle((prev) => prev + emoji);
    setShowEmojis(false);
  };

  return (
    <div className="flex items-center gap-2 mb-4 group">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600 shrink-0">
        {sessionIdx + 1}
      </span>

      {editing ? (
        <div className="flex items-center gap-1.5 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle(title);
              if (e.key === "Escape") { setTitle(initialTitle); setEditing(false); }
            }}
            className="flex-1 rounded-lg border-2 border-zinc-300 px-3 py-1.5 text-base focus:outline-none focus:border-zinc-500"
            style={{ fontFamily: fontFamily.family || "inherit", fontWeight: fontFamily.weight }}
            disabled={saving}
          />

          {/* Emoji 按钮 */}
          <div ref={emojiRef} className="relative">
            <button onClick={() => setShowEmojis(!showEmojis)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              title="添加 Emoji">
              <Smile className="h-4 w-4" />
            </button>
            {showEmojis && (
              <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-zinc-200 p-3 w-80 max-h-80 overflow-y-auto">
                {EMOJI_CATEGORIES.map((cat) => (
                  <div key={cat.name} className="mb-2 last:mb-0">
                    <p className="text-[10px] text-zinc-400 mb-1 font-medium">{cat.name}</p>
                    <div className="grid grid-cols-8 gap-0.5">
                      {cat.items.map((emoji) => (
                        <button key={emoji} onClick={() => addEmoji(emoji)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100 text-lg transition-colors">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 字体选择 */}
          <div ref={fontRef} className="relative">
            <button onClick={() => setShowFonts(!showFonts)}
              className="flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors whitespace-nowrap">
              {fontFamily.label} <ChevronDown className="h-3 w-3" />
            </button>
            {showFonts && (
              <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-zinc-200 py-1 min-w-[150px]">
                {FONTS.map((f) => (
                  <button key={f.value} onClick={() => { setFontFamily(f); setShowFonts(false); }}
                    className={`w-full text-left px-3 py-2 text-base hover:bg-zinc-50 transition-colors ${
                      fontFamily.value === f.value ? "bg-zinc-100 text-zinc-900" : "text-zinc-600"
                    }`}
                    style={{ fontFamily: f.family || "inherit", fontWeight: f.weight }}>
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => saveTitle(title)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-green-600 hover:bg-green-50 transition-colors">
            <Check className="h-4 w-4" />
          </button>
          <button onClick={() => { setTitle(initialTitle); setEditing(false); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-xl tracking-tight text-zinc-800 truncate"
            style={{ fontFamily: fontFamily.family || "inherit", fontWeight: fontFamily.weight }}>
            {title}
          </h2>
          <button onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all"
            title="修改视频名称">
            <PencilLine className="h-4 w-4" />
          </button>
          <span className="text-[10px] text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
            {fontFamily.label}
          </span>
        </>
      )}
    </div>
  );
}
