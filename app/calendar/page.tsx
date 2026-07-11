"use client";

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Pause } from "lucide-react";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #fffdf9 0%, #fce9dc 25%, #f8d7d7 45%, #e8d4e8 60%, #d7d4ee 75%, #f8d7d7 90%, #fce9dc 100%)", backgroundSize: "250% 250%" }}
        >
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#8c887e" }} />
        </div>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}

interface PhotoDay {
  date: Date;
  dateStr: string;
  thumbnailUrl: string | null;
  title?: string;
}

function CalendarContent() {
  const searchParams = useSearchParams();
  const urlYear = searchParams.get("year");
  const urlMonth = searchParams.get("month");

  const today = new Date();
  const [year, setYear] = useState(urlYear ? parseInt(urlYear) : today.getFullYear());
  const [month, setMonth] = useState(urlMonth ? parseInt(urlMonth) : today.getMonth());
  const [videos, setVideos] = useState<PhotoDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const loadVideos = useCallback(() => {
    setLoading(true);
    fetch("/api/videos")
      .then((res) => res.json())
      .then((data) => {
        if (data.videos) {
          setVideos(
            data.videos.map((v: { recordDate: string; thumbnailUrl: string | null; title?: string }) => ({
              date: new Date(v.recordDate),
              dateStr: v.recordDate.split("T")[0],
              thumbnailUrl: v.thumbnailUrl,
              title: v.title,
            }))
          );
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadVideos(); }, [loadVideos]);
  useEffect(() => { window.addEventListener("focus", loadVideos); return () => window.removeEventListener("focus", loadVideos); }, [loadVideos]);

  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const handlePrev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const handleNext = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const photoMap = useMemo(() => {
    const map = new Map<string, PhotoDay>();
    videos.filter(v => v.date.getFullYear() === year && v.date.getMonth() === month)
      .forEach(v => map.set(v.dateStr, v));
    return map;
  }, [videos, year, month]);

  const photoDays = useMemo(() =>
    allDays.filter(d => photoMap.has(format(d, "yyyy-MM-dd"))), [allDays, photoMap]);

  const photoCount = photoDays.length;
  const monthName = format(new Date(year, month), "MMMM");
  const monthYear = format(new Date(year, month), "yyyy");

  // 照片色板（对应参考 HTML 的 ph-1 ~ ph-15）
  const palette = [
    "#5b4636", "#8a4a3f", "#6b5a45", "#7f8f8a", "#9aa39c",
    "#3f3a32", "#c9903e", "#4a5a4f", "#c9702f", "#8b6d4f",
    "#a06b8f", "#3d2f2a", "#5e4a3a", "#3a3f52", "#6d4c3d",
  ];

  return (
    <div
      className="min-h-screen relative overflow-hidden px-4 py-8"
      style={{
        background: "linear-gradient(145deg, #fcf8f5 0%, #fce9dc 20%, #f8d7d7 40%, #fffdf9 55%, #e8d4e8 70%, #d7d4ee 85%, #fcf8f5 100%)",
        backgroundSize: "200% 200%",
        animation: "flowBg 30s ease-in-out infinite",
      }}
    >
      {/* 色块 */}
      <div className="absolute pointer-events-none w-[45vw] h-[45vw] rounded-full" style={{ left: "5%", top: "10%", background: "#fce9dc", filter: "blur(100px)", opacity: 0.55, animation: "driftA 12s ease-in-out infinite" }} />
      <div className="absolute pointer-events-none w-[50vw] h-[50vw] rounded-full" style={{ left: "50%", top: "-5%", background: "#f8d7d7", filter: "blur(110px)", opacity: 0.55, animation: "driftB 14s ease-in-out infinite alternate" }} />
      <div className="absolute pointer-events-none w-[40vw] h-[40vw] rounded-full" style={{ left: "30%", top: "50%", background: "#fffdf9", filter: "blur(100px)", opacity: 0.5, animation: "driftC 13s ease-in-out infinite alternate-reverse" }} />
      <div className="absolute pointer-events-none w-[55vw] h-[55vw] rounded-full" style={{ left: "-10%", top: "30%", background: "#d7d4ee", filter: "blur(120px)", opacity: 0.45, animation: "driftD 16s ease-in-out infinite" }} />

      <div className="max-w-[920px] mx-auto relative z-10">
        {/* ═══ 顶部导航（时光轴） ═══ */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: "#8c887e" }}>
            ← 时光轴
          </Link>
          <Link href={`/upload?date=${format(new Date(year, month), "yyyy-MM")}`} className="text-sm transition-colors hover:opacity-70" style={{ color: "#8c887e" }}>
            上传
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#8c887e" }} />
          </div>
        ) : (
          <>
            {/* ═══ 标题（参考 HTML header） ═══ */}
            <div className="flex items-baseline justify-between pb-7 mb-5" style={{ borderBottom: "1px solid #d9d4c8" }}>
              <div className="flex items-baseline gap-2.5">
                <h1 className="text-[52px] max-md:text-[36px] leading-none m-0 tracking-[0.12em]"
                  style={{ fontFamily: "'Cormorant Garamond', 'Times New Roman', serif", fontWeight: 500, color: "#2b2823" }}>
                  {monthName}
                </h1>
                <span className="text-lg max-md:text-base italic pl-2.5" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#8c887e", borderLeft: "1px solid #d9d4c8" }}>
                  {monthYear}
                </span>
              </div>
              <div className="w-[34px] h-[34px] rounded-full shrink-0"
                style={{
                  background: "radial-gradient(circle at 35% 30%, #ffffff, #cfd6e0 70%)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              />
            </div>

            {photoCount > 0 ? (
              <>
                {/* ═══ 顶部自动轮播 ═══ */}
                <PhotoCarousel allDays={allDays} photoMap={photoMap} palette={palette} />

                {/* ═══ 月份切换 ═══ */}
                <div className="flex items-center justify-center gap-5 my-5">
                  <button onClick={handlePrev} className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:bg-white/40" style={{ color: "#8c887e" }}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm tracking-wider" style={{ color: "#8c887e" }}>
                    {format(new Date(year, month), "yyyy / M")}
                  </span>
                  <button onClick={handleNext} className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:bg-white/40" style={{ color: "#8c887e" }}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* ═══ 星期行（纯文字对齐参考 HTML） ═══ */}
                <div className="grid grid-cols-7 px-1.5 pb-3.5 text-[11px] max-md:text-[9px] tracking-[0.15em] font-medium" style={{ color: "#8c887e" }}>
                  {WEEKDAYS.map(d => <span key={d} className="text-center">{d}</span>)}
                </div>

                {/* ═══ 日历网格（固定行高 118px / 78px mobile） ═══ */}
                <div className="grid grid-cols-7 gap-1.5 px-1.5 calendar-grid">
                  <CalendarGrid
                    allDays={allDays}
                    startDay={startDay}
                    photoMap={photoMap}
                    palette={palette}
                    hoveredDay={hoveredDay}
                    setHoveredDay={setHoveredDay}
                  />
                </div>

                {/* 统计 */}
                <div className="flex justify-center items-center gap-2 mt-5 mb-8">
                  <span className="text-[11px] tracking-wide" style={{ color: "#b0a89a" }}>
                    本月 {photoCount} 次练习
                  </span>
                  <div className="flex items-center gap-1">
                    {allDays.filter(d => photoMap.has(format(d, "yyyy-MM-dd"))).slice(-5).map(d => (
                      <div key={format(d, "yyyy-MM-dd")} className="w-1.5 h-1.5 rounded-full" style={{ background: "#c5b0c5" }} />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl" style={{ background: "rgba(200,185,200,0.2)" }}>
                  📸
                </div>
                <p className="text-sm" style={{ color: "#8c887e" }}>本月还没有练习记录</p>
                <Link href="/upload" className="text-xs px-4 py-1.5 rounded-full transition-all hover:scale-105" style={{ background: "rgba(200,185,200,0.2)", color: "#8a7b8a" }}>
                  上传第一个视频
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══ 自动轮播 ═══ */

function PhotoCarousel({
  allDays, photoMap, palette,
}: {
  allDays: Date[]; photoMap: Map<string, PhotoDay>; palette: string[];
}) {
  const sortedPhotos = useMemo(() =>
    allDays.filter(d => photoMap.has(format(d, "yyyy-MM-dd")))
      .map(d => ({ date: d, dateStr: format(d, "yyyy-MM-dd"), photo: photoMap.get(format(d, "yyyy-MM-dd"))! })),
    [allDays, photoMap]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = sortedPhotos.length;

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setCurrentIndex(prev => (prev + 1) % total), 3500);
  }, [total]);

  useEffect(() => {
    if (total > 1 && !isPaused) startAutoPlay();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [total, isPaused, startAutoPlay]);

  const goTo = (i: number) => { setCurrentIndex(i); if (!isPaused) startAutoPlay(); };
  if (total === 0) return null;

  const current = sortedPhotos[currentIndex];
  const paletteColor = palette[currentIndex % palette.length];

  return (
    <Link href={`/day/${current.dateStr}`}
      className="relative block rounded-lg overflow-hidden"
      style={{
        aspectRatio: "16/9",
        background: paletteColor,
        boxShadow: "0 10px 24px -12px rgba(43,40,35,0.35)",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {current.photo.thumbnailUrl ? (
        <img src={current.photo.thumbnailUrl} alt="" className="w-full h-full object-cover" />
      ) : null}

      {/* 渐变叠加层 */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.55) 100%)" }}
      />

      {/* 日期和标题 */}
      <div className="absolute bottom-3 left-4 flex items-center gap-3">
        <span className="text-lg font-semibold text-white"
          style={{ fontFamily: "'Cormorant Garamond', serif", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
          {current.date.getDate()}
        </span>
        {current.photo.title && (
          <span className="text-sm text-white/80">{current.photo.title}</span>
        )}
      </div>

      {/* 右上角指示器 */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <div className="flex items-center gap-1">
          {sortedPhotos.map((_, idx) => (
            <button key={idx} onClick={(e) => { e.preventDefault(); goTo(idx); }}
              className="rounded-full transition-all duration-300"
              style={{
                width: idx === currentIndex ? 20 : 5, height: 5,
                background: idx === currentIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </div>
        {isPaused && <Pause className="h-3 w-3 text-white/60" />}
      </div>

      {/* 计数 */}
      <span className="absolute top-3 left-3 text-[10px] text-white/50 font-mono">
        {currentIndex + 1}/{total}
      </span>
    </Link>
  );
}

/* ═══ 日历网格（完全对照参考 HTML） ═══ */

function CalendarGrid({
  allDays, startDay, photoMap, palette, hoveredDay, setHoveredDay,
}: {
  allDays: Date[];
  startDay: number;
  photoMap: Map<string, PhotoDay>;
  palette: string[];
  hoveredDay: string | null;
  setHoveredDay: (d: string | null) => void;
}) {
  // 按 weeks 分组
  const weeks: { day: number | null; date: Date | null; hasPhoto: boolean; photo?: PhotoDay; paletteIdx?: number }[][] = [];

  let currentWeek: any[] = [];
  for (let i = 0; i < startDay; i++) {
    currentWeek.push({ day: null, date: null, hasPhoto: false });
  }

  let paletteIdx = 0;
  for (const date of allDays) {
    const dateStr = format(date, "yyyy-MM-dd");
    const photo = photoMap.get(dateStr);
    const cell = { day: date.getDate(), date, hasPhoto: !!photo, photo };
    if (photo) { cell.paletteIdx = paletteIdx++ % palette.length; }
    currentWeek.push(cell);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) { currentWeek.push({ day: null, date: null, hasPhoto: false }); }
    weeks.push(currentWeek);
  }

  return (
    <>
      {weeks.map((week, wi) =>
        week.map((cell, ci) => {
          const key = `${wi}-${ci}`;
          if (!cell.day) return <div key={key} className="invisible" />;

          const dateStr = cell.date ? format(cell.date, "yyyy-MM-dd") : "";
          const isHovered = hoveredDay === dateStr;

          if (!cell.hasPhoto) {
            return (
              <div key={key}
                className="relative rounded-[4px] flex items-start justify-start p-2 transition-all duration-300"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "18px",
                  color: "#8c887e",
                  background: isHovered ? "rgba(255,255,255,0.15)" : "transparent",
                }}
                onMouseEnter={() => setHoveredDay(dateStr)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {cell.day}
              </div>
            );
          }

          // photo cell — 完全对照参考 HTML
          const bgColor = palette[cell.paletteIdx ?? 0];

          return (
            <Link key={key} href={`/day/${dateStr}`}
              className="relative rounded-[6px] overflow-hidden text-white flex flex-col justify-between p-2.5 isolate transition-all duration-300 hover:scale-[1.02] hover:z-10"
              style={{
                background: cell.photo?.thumbnailUrl ? `url(${cell.photo.thumbnailUrl}) center/cover` : bgColor,
                boxShadow: "0 10px 24px -12px rgba(43,40,35,0.35)",
              }}
              onMouseEnter={() => setHoveredDay(dateStr)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {/* 渐变叠加层 */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.55) 100%)" }}
              />

              {/* 右上角装饰点 */}
              <span className="absolute top-2.5 right-2.5 text-[9px] tracking-[1px] opacity-85 z-10">
                ●●●●
              </span>

              {/* 日期 — 左上 */}
              <span className="text-xl font-semibold z-10"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {cell.day}
              </span>

              {/* 竖向文字说明 — 右下，纵向书写 */}
              {cell.photo?.title && (
                <span className="self-end z-10 text-[11px] tracking-wide font-light"
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                    opacity: 0.95,
                  }}>
                  {cell.photo.title}
                </span>
              )}
              {!cell.photo?.title && (
                <span className="self-end z-10 text-[11px] tracking-wide"
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                    opacity: 0.7,
                  }}>
                  🩰
                </span>
              )}
            </Link>
          );
        })
      )}
    </>
  );
}
