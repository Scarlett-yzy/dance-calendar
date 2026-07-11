"use client";

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, ArrowLeft, Pause, Play } from "lucide-react";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, #fffdf9 0%, #fce9dc 25%, #f8d7d7 45%, #e8d4e8 60%, #d7d4ee 75%, #f8d7d7 90%, #fce9dc 100%)",
            backgroundSize: "250% 250%",
          }}
        >
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#8f8579" }} />
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
  const router = useRouter();

  const today = new Date();
  const [year, setYear] = useState(urlYear ? parseInt(urlYear) : today.getFullYear());
  const [month, setMonth] = useState(urlMonth ? parseInt(urlMonth) : today.getMonth());
  const [videos, setVideos] = useState<PhotoDay[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  useEffect(() => {
    window.addEventListener("focus", loadVideos);
    return () => window.removeEventListener("focus", loadVideos);
  }, [loadVideos]);

  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const handlePrev = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else { setMonth((m) => m - 1); }
  };

  const handleNext = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else { setMonth((m) => m + 1); }
  };

  const photoMap = useMemo(() => {
    const map = new Map<string, PhotoDay>();
    videos
      .filter((v) => v.date.getFullYear() === year && v.date.getMonth() === month)
      .forEach((v) => map.set(v.dateStr, v));
    return map;
  }, [videos, year, month]);

  const photoDays = useMemo(
    () => allDays.filter((d) => photoMap.has(format(d, "yyyy-MM-dd"))),
    [allDays, photoMap]
  );

  const monthLabel = format(new Date(year, month), "MMMM yyyy");

  // Build grid data
  const gridData = useMemo(() => {
    const cells: ({ type: "empty" } | { type: "plain"; day: number } | { type: "photo"; day: number; dateStr: string; photo: PhotoDay })[] = [];
    for (let i = 0; i < startDay; i++) {
      cells.push({ type: "empty" });
    }
    for (const date of allDays) {
      const dateStr = format(date, "yyyy-MM-dd");
      const photo = photoMap.get(dateStr);
      if (photo) {
        cells.push({ type: "photo" as const, day: date.getDate(), dateStr, photo });
      } else {
        cells.push({ type: "plain" as const, day: date.getDate() });
      }
    }
    return cells;
  }, [allDays, startDay, photoMap]);

  const photoCount = photoDays.length;

  return (
    <div
      className="min-h-screen relative overflow-hidden px-4 py-6"
      style={{
        background:
          "linear-gradient(145deg, #fcf8f5 0%, #fce9dc 20%, #f8d7d7 40%, #fffdf9 55%, #e8d4e8 70%, #d7d4ee 85%, #fcf8f5 100%)",
        backgroundSize: "200% 200%",
        animation: "flowBg 30s ease-in-out infinite",
      }}
    >
      {/* 色块 */}
      <div className="absolute pointer-events-none w-[45vw] h-[45vw] rounded-full" style={{ left: "5%", top: "10%", background: "#fce9dc", filter: "blur(100px)", opacity: 0.55, animation: "driftA 12s ease-in-out infinite" }} />
      <div className="absolute pointer-events-none w-[50vw] h-[50vw] rounded-full" style={{ left: "50%", top: "-5%", background: "#f8d7d7", filter: "blur(110px)", opacity: 0.55, animation: "driftB 14s ease-in-out infinite alternate" }} />
      <div className="absolute pointer-events-none w-[40vw] h-[40vw] rounded-full" style={{ left: "30%", top: "50%", background: "#fffdf9", filter: "blur(100px)", opacity: 0.5, animation: "driftC 13s ease-in-out infinite alternate-reverse" }} />
      <div className="absolute pointer-events-none w-[55vw] h-[55vw] rounded-full" style={{ left: "-10%", top: "30%", background: "#d7d4ee", filter: "blur(120px)", opacity: 0.45, animation: "driftD 16s ease-in-out infinite" }} />
      <div className="absolute pointer-events-none w-[35vw] h-[35vw] rounded-full" style={{ left: "60%", top: "55%", background: "#fce9dc", filter: "blur(90px)", opacity: 0.4, animation: "driftA 15s ease-in-out infinite alternate" }} />

      <div className="max-w-lg mx-auto relative z-10">
        {/* 导航 */}
        <div className="flex items-center justify-between mb-5">
          <Link href="/" className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: "#8f8579" }}>
            <ArrowLeft className="h-4 w-4" />
            时光轴
          </Link>
        </div>

        {/* 标题 + 装饰圆 */}
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-3xl md:text-4xl tracking-wide font-serif"
            style={{ fontFamily: "var(--font-cg), 'Playfair Display', 'Times New Roman', serif", fontWeight: 500, color: "#4a4540" }}
          >
            {monthLabel}
          </h1>
          <div className="w-11 h-11 rounded-full" style={{ background: "rgba(200, 185, 200, 0.3)", border: "1.5px solid rgba(255,255,255,0.6)", backdropFilter: "blur(4px)" }} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#8f8579" }} />
          </div>
        ) : (
          <>
            {photoCount > 0 ? (
              <>
                {/* ═══ 顶部自动轮播 ═══ */}
                <PhotoCarousel allDays={allDays} photoMap={photoMap} />

                {/* ═══ 星期行 ═══ */}
                <div className="flex items-center mb-4 px-1 mt-7">
                  {WEEKDAYS.map((day, i) => (
                    <div key={day} className="flex-1 flex items-center justify-center">
                      <span className="text-[11px] font-semibold tracking-[0.12em]" style={{ color: "#a09890" }}>
                        {day}
                      </span>
                      {i < WEEKDAYS.length - 1 && <div className="w-px h-2.5 mx-0.5 opacity-40" style={{ background: "#c5bdb5" }} />}
                    </div>
                  ))}
                </div>

                {/* ═══ 月份切换 ═══ */}
                <div className="flex items-center justify-center gap-6 mb-5">
                  <button onClick={handlePrev} className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-white/50 active:scale-95" style={{ color: "#8f8579" }}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium" style={{ color: "#8f8579" }}>
                    {format(new Date(year, month), "yyyy年M月", { locale: zhCN })}
                  </span>
                  <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-white/50 active:scale-95" style={{ color: "#8f8579" }}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* ═══ 日历网格（统一大小） ═══ */}
                <div className="grid grid-cols-7 gap-1.5">
                  {gridData.map((cell, i) => {
                    if (cell.type === "empty") {
                      return <div key={i} className="aspect-square" />;
                    }
                    if (cell.type === "plain") {
                      return (
                        <div
                          key={i}
                          className="aspect-square flex items-center justify-center rounded-lg transition-all duration-300 hover:bg-white/30"
                        >
                          <span className="text-sm font-light" style={{ color: "#c5bdb5" }}>
                            {cell.day}
                          </span>
                        </div>
                      );
                    }
                    // photo cell
                    return (
                      <Link
                        key={i}
                        href={`/day/${cell.dateStr}`}
                        className="group relative aspect-square rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                        style={{
                          background: cell.photo.thumbnailUrl ? undefined : "#ece8e0",
                          boxShadow: "0 2px 8px rgba(120,110,130,0.12)",
                        }}
                      >
                        {cell.photo.thumbnailUrl ? (
                          <img
                            src={cell.photo.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-lg">🩰</span>
                          </div>
                        )}
                        {/* overlay */}
                        <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.35) 0%, transparent 50%)" }} />
                        {/* day number */}
                        <div
                          className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-xs font-semibold text-white"
                          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
                        >
                          {cell.day}
                        </div>
                        {/* bottom dots */}
                        <div className="absolute bottom-1.5 right-1.5 text-[8px] tracking-[1.5px] text-white/70" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                          ●●●●
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* 统计 */}
                <div className="flex items-center justify-center mt-5 mb-8">
                  <span className="text-[11px] tracking-wide" style={{ color: "#b0a89a" }}>
                    本月 {photoCount} 次练习
                  </span>
                  <div className="flex items-center gap-1 ml-3">
                    {allDays.filter((d) => photoMap.has(format(d, "yyyy-MM-dd"))).slice(-5).map((d) => (
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
                <p className="text-sm" style={{ color: "#8f8579" }}>
                  本月还没有练习记录
                </p>
                <Link
                  href="/upload"
                  className="text-xs px-4 py-1.5 rounded-full transition-all hover:scale-105"
                  style={{ background: "rgba(200,185,200,0.2)", color: "#8a7b8a" }}
                >
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

/* ═══ 自动轮播组件 ═══ */

function PhotoCarousel({
  allDays,
  photoMap,
}: {
  allDays: Date[];
  photoMap: Map<string, PhotoDay>;
}) {
  const router = useRouter();
  const sortedPhotos = useMemo(
    () =>
      allDays
        .filter((d) => photoMap.has(format(d, "yyyy-MM-dd")))
        .map((d) => ({ date: d, dateStr: format(d, "yyyy-MM-dd"), photo: photoMap.get(format(d, "yyyy-MM-dd"))! })),
    [allDays, photoMap]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = sortedPhotos.length;

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 3500);
  }, [total]);

  useEffect(() => {
    if (total > 1 && !isPaused) startAutoPlay();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [total, isPaused, startAutoPlay]);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    if (!isPaused) startAutoPlay(); // reset timer
  };

  const goNext = () => goTo((currentIndex + 1) % total);
  const goPrev = () => goTo((currentIndex - 1 + total) % total);

  if (total === 0) return null;

  const current = sortedPhotos[currentIndex];

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        aspectRatio: "16/9",
        background: "#ece8e0",
        boxShadow: "0 4px 20px rgba(120,110,130,0.15)",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* image */}
      {current.photo.thumbnailUrl ? (
        <img
          src={current.photo.thumbnailUrl}
          alt={current.photo.title || ""}
          className="w-full h-full object-cover transition-all duration-700"
          style={{
            opacity: 1,
            animation: "none",
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-5xl">🩰</span>
        </div>
      )}

      {/* gradient overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 40%)" }} />

      {/* info overlay */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold text-white" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
            {current.date.getDate()}日
          </span>
          {current.photo.title && (
            <span className="text-xs text-white/80 truncate max-w-[140px]">{current.photo.title}</span>
          )}
        </div>
        <span className="text-[10px] text-white/50 font-mono">{currentIndex + 1}/{total}</span>
      </div>

      {/* nav arrows */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); goPrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-0 hover:opacity-100 bg-white/20 backdrop-blur-sm hover:bg-white/40"
            style={{ color: "white" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); goNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-0 hover:opacity-100 bg-white/20 backdrop-blur-sm hover:bg-white/40"
            style={{ color: "white" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* click to open day */}
      <Link
        href={`/day/${current.dateStr}`}
        className="absolute inset-0 z-10"
      />

      {/* progress dots */}
      {total > 1 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {sortedPhotos.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.preventDefault(); goTo(idx); }}
              className="transition-all duration-300 rounded-full"
              style={{
                width: idx === currentIndex ? 20 : 5,
                height: 5,
                background: idx === currentIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </div>
      )}

      {/* pause indicator */}
      {isPaused && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
          <Pause className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  );
}
