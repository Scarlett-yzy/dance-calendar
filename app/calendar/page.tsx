"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subDays,
  addDays,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, ArrowLeft } from "lucide-react";

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
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  // Build photo map for current month
  const photoMap = useMemo(() => {
    const map = new Map<string, PhotoDay>();
    videos
      .filter((v) => {
        const d = v.date;
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .forEach((v) => map.set(v.dateStr, v));
    return map;
  }, [videos, year, month]);

  const monthLabel = format(new Date(year, month), "MMMM yyyy");
  const photoDays = useMemo(
    () => allDays.filter((d) => photoMap.has(format(d, "yyyy-MM-dd"))),
    [allDays, photoMap]
  );

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
      {/* Floating color blobs */}
      <div
        className="absolute pointer-events-none w-[45vw] h-[45vw] rounded-full"
        style={{
          left: "5%",
          top: "10%",
          background: "#fce9dc",
          filter: "blur(100px)",
          opacity: 0.55,
          animation: "driftA 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute pointer-events-none w-[50vw] h-[50vw] rounded-full"
        style={{
          left: "50%",
          top: "-5%",
          background: "#f8d7d7",
          filter: "blur(110px)",
          opacity: 0.55,
          animation: "driftB 14s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute pointer-events-none w-[40vw] h-[40vw] rounded-full"
        style={{
          left: "30%",
          top: "50%",
          background: "#fffdf9",
          filter: "blur(100px)",
          opacity: 0.5,
          animation: "driftC 13s ease-in-out infinite alternate-reverse",
        }}
      />
      <div
        className="absolute pointer-events-none w-[55vw] h-[55vw] rounded-full"
        style={{
          left: "-10%",
          top: "30%",
          background: "#d7d4ee",
          filter: "blur(120px)",
          opacity: 0.45,
          animation: "driftD 16s ease-in-out infinite",
        }}
      />
      <div
        className="absolute pointer-events-none w-[35vw] h-[35vw] rounded-full"
        style={{
          left: "60%",
          top: "55%",
          background: "#fce9dc",
          filter: "blur(90px)",
          opacity: 0.4,
          animation: "driftA 15s ease-in-out infinite alternate",
        }}
      />

      <div className="max-w-lg mx-auto relative z-10">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: "#8f8579" }}
          >
            <ArrowLeft className="h-4 w-4" />
            时光轴
          </Link>
        </div>

        {/* 标题 + 装饰圆 */}
        <div className="flex items-center justify-between mb-7">
          <h1
            className="text-3xl md:text-4xl tracking-wide font-serif"
            style={{
              fontFamily: "var(--font-cg), 'Playfair Display', 'Times New Roman', serif",
              fontWeight: 500,
              color: "#4a4540",
            }}
          >
            {monthLabel}
          </h1>
          <div
            className="w-11 h-11 rounded-full"
            style={{
              background: "rgba(200, 185, 200, 0.3)",
              border: "1.5px solid rgba(255,255,255,0.6)",
              backdropFilter: "blur(4px)",
            }}
          />
        </div>

        {/* 星期 */}
        <div className="flex items-center mb-6 px-1">
          {WEEKDAYS.map((day, i) => (
            <div key={day} className="flex-1 flex items-center justify-center gap-0">
              <span
                className="text-[11px] font-semibold tracking-[0.12em]"
                style={{ color: "#a09890" }}
              >
                {day}
              </span>
              {i < WEEKDAYS.length - 1 && (
                <div className="w-px h-2.5 mx-0.5 opacity-40" style={{ background: "#c5bdb5" }} />
              )}
            </div>
          ))}
        </div>

        {/* 月份切换 */}
        <div className="flex items-center justify-center gap-6 mb-7">
          <button
            onClick={handlePrev}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-white/50 active:scale-95"
            style={{ color: "#8f8579" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium" style={{ color: "#8f8579" }}>
            {format(new Date(year, month), "yyyy年M月", { locale: zhCN })}
          </span>
          <button
            onClick={handleNext}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-white/50 active:scale-95"
            style={{ color: "#8f8579" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* 照片墙 / 日历内容 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#8f8579" }} />
          </div>
        ) : (
          <>
            {photoDays.length > 0 ? (
              <PhotoWall
                year={year}
                month={month}
                allDays={allDays}
                startDay={startDay}
                photoMap={photoMap}
                hoveredDay={hoveredDay}
                setHoveredDay={setHoveredDay}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                  style={{ background: "rgba(200,185,200,0.2)" }}
                >
                  📸
                </div>
                <p className="text-sm" style={{ color: "#8f8579" }}>
                  本月还没有练习记录
                </p>
                <Link
                  href="/upload"
                  className="text-xs px-4 py-1.5 rounded-full transition-all hover:scale-105"
                  style={{
                    background: "rgba(200,185,200,0.2)",
                    color: "#8a7b8a",
                  }}
                >
                  上传第一个视频
                </Link>
              </div>
            )}
          </>
        )}

        {/* 底部胶囊 */}
        <div className="flex justify-center my-10">
          <div
            className="px-8 py-2.5 rounded-full text-xs tracking-widest transition-all hover:scale-105"
            style={{
              background: "rgba(180, 170, 190, 0.2)",
              border: "1px solid rgba(255,255,255,0.5)",
              color: "#8a7b8a",
              backdropFilter: "blur(8px)",
            }}
          >
            除了收藏
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 照片墙组件 ─── */

interface PhotoWallProps {
  year: number;
  month: number;
  allDays: Date[];
  startDay: number;
  photoMap: Map<string, PhotoDay>;
  hoveredDay: string | null;
  setHoveredDay: (d: string | null) => void;
}

function PhotoWall({
  year,
  month,
  allDays,
  startDay,
  photoMap,
  hoveredDay,
  setHoveredDay,
}: PhotoWallProps) {
  const router = useRouter();

  // Build grid: first fill empty cells, then photo cells
  // Strategy: use a 7-column grid, but photo cells can span 1, 2 or 3 cols
  // for a staggered wall effect

  const dayNumbers = allDays.map((d) => d.getDate());
  const photoCount = allDays.filter((d) => photoMap.has(format(d, "yyyy-MM-dd"))).length;

  // Build weeks array with metadata
  const weeks: { day: number | null; date: Date | null; hasPhoto: boolean; photo?: PhotoDay }[][] =
    [];

  // Fill leading empty cells
  let currentWeek: {
    day: number | null;
    date: Date | null;
    hasPhoto: boolean;
    photo?: PhotoDay;
  }[] = [];
  for (let i = 0; i < startDay; i++) {
    currentWeek.push({ day: null, date: null, hasPhoto: false });
  }

  for (const date of allDays) {
    const dateStr = format(date, "yyyy-MM-dd");
    const photo = photoMap.get(dateStr);
    currentWeek.push({
      day: date.getDate(),
      date,
      hasPhoto: !!photo,
      photo,
    });
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Pad last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ day: null, date: null, hasPhoto: false });
    }
    weeks.push(currentWeek);
  }

  // If no photos at all (shouldn't reach here but safety)
  if (photoCount === 0) return null;

  // ── Featured hero photo (first photo of the month) ──
  const firstPhotoDay = allDays.find((d) =>
    photoMap.has(format(d, "yyyy-MM-dd"))
  );
  const firstPhoto = firstPhotoDay
    ? photoMap.get(format(firstPhotoDay, "yyyy-MM-dd"))
    : null;

  // ── Staggered grid builder ──
  // We'll render each week as a row where photo cells can have different sizes
  // This creates the "交错" (staggered) photo wall effect

  return (
    <div className="space-y-5">
      {/* Hero photo - first photo of month, displayed prominently */}
      {firstPhoto && firstPhotoDay && (
        <Link
          href={`/day/${format(firstPhotoDay, "yyyy-MM-dd")}`}
          className="group relative block rounded-2xl overflow-hidden
            hover:shadow-lg transition-all duration-500"
          style={{
            aspectRatio: "16/9",
            background: "#f0ece6",
          }}
          onMouseEnter={() => setHoveredDay(format(firstPhotoDay, "yyyy-MM-dd"))}
          onMouseLeave={() => setHoveredDay(null)}
        >
          {firstPhoto.thumbnailUrl ? (
            <img
              src={firstPhoto.thumbnailUrl}
              alt={firstPhoto.title || ""}
              className="w-full h-full object-cover transition-all duration-700
                group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl" style={{ color: "#c5bdb5" }}>
                🎬
              </span>
            </div>
          )}
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 40%, transparent 60%)",
            }}
          />
          {/* Date + title */}
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
              >
                {firstPhotoDay.getDate()}日
              </span>
              {firstPhoto.title && (
                <span className="text-xs text-white/80 truncate">{firstPhoto.title}</span>
              )}
            </div>
          </div>
          {/* Tag */}
          <div
            className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] text-white/80"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
          >
            🩰 精选
          </div>
        </Link>
      )}

      {/* Photo grid - Staggered wall layout */}
      <div className="grid grid-cols-7 gap-2">
        {weeks.map((week, wi) => {
          // Determine which cells get staggered spans
          const photoIndices = week
            .map((c, idx) => (c.hasPhoto ? idx : -1))
            .filter((i) => i >= 0);

          return week.map((cell, ci) => {
            const key = `${wi}-${ci}`;

            if (!cell.day) {
              return <div key={key} />;
            }

            const dateStr = cell.date ? format(cell.date, "yyyy-MM-dd") : "";
            const isHovered = hoveredDay === dateStr;

            if (!cell.hasPhoto) {
              // Empty day - subtle date number
              return (
                <div
                  key={key}
                  className="flex items-center justify-center aspect-square transition-all duration-300"
                  style={{ opacity: isHovered ? 0.6 : 0.45 }}
                >
                  <span className="text-xs font-light" style={{ color: "#c5bdb5" }}>
                    {cell.day}
                  </span>
                </div>
              );
            }

            // Photo cell: staggered sizes for wall effect
            // Use modular arithmetic to vary sizes: some span 2 cols, some 1 col
            const isStaggered =
              cell.hasPhoto && cell.day !== null && cell.day % 3 === 0 && cell.day <= 21;

            return (
              <Link
                key={key}
                href={`/day/${dateStr}`}
                className={`group relative rounded-xl overflow-hidden transition-all duration-400
                  hover:z-10 cursor-pointer
                  ${isStaggered ? "col-span-2" : "col-span-1"}
                  ${isStaggered ? "row-span-2" : ""}
                  ${isStaggered ? "" : "aspect-square"}`}
                style={{
                  background: cell.photo?.thumbnailUrl
                    ? undefined
                    : "#f0ece6",
                  boxShadow: isHovered
                    ? "0 8px 24px rgba(120,110,130,0.25)"
                    : "0 2px 8px rgba(120,110,130,0.1)",
                  transform: isHovered ? "scale(1.03)" : "scale(1)",
                }}
                onMouseEnter={() => setHoveredDay(dateStr)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {cell.photo?.thumbnailUrl ? (
                  <img
                    src={cell.photo.thumbnailUrl}
                    alt={cell.photo?.title || ""}
                    className={`w-full h-full object-cover transition-all duration-700
                      ${isHovered ? "scale-105" : "scale-100"}`}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: "#f0ece6" }}
                  >
                    <span className="text-sm" style={{ color: "#c5bdb5" }}>
                      🩰
                    </span>
                  </div>
                )}

                {/* Dark overlay on hover */}
                {isHovered && (
                  <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 50%)",
                    }}
                  />
                )}

                {/* Date badge - top left */}
                <div
                  className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-white
                    transition-all duration-300"
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    backdropFilter: "blur(4px)",
                    opacity: isHovered ? 1 : 0.85,
                  }}
                >
                  {cell.day}
                </div>

                {/* Tag - bottom left (only on normal cells) */}
                {!isStaggered && (
                  <div
                    className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[8px] text-white/70
                      transition-all duration-300"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      backdropFilter: "blur(4px)",
                      opacity: isHovered ? 1 : 0.7,
                    }}
                  >
                    🩰
                  </div>
                )}

                {/* Title on staggered/featured cells */}
                {isStaggered && cell.photo?.title && (
                  <div
                    className="absolute bottom-2 left-2 right-2 transition-all duration-300"
                    style={{ opacity: isHovered ? 1 : 0.8 }}
                  >
                    <span
                      className="text-[10px] text-white/90 line-clamp-1"
                      style={{
                        textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }}
                    >
                      {cell.photo.title}
                    </span>
                  </div>
                )}
              </Link>
            );
          });
        })}
      </div>

      {/* 拍摄日期统计 */}
      <div className="flex items-center justify-between px-1 pt-1">
        <span className="text-[10px]" style={{ color: "#b0a89a" }}>
          共 {photoCount} 次练习
        </span>
        <div className="flex items-center gap-1">
          {allDays
            .filter((d) => photoMap.has(format(d, "yyyy-MM-dd")))
            .slice(-5)
            .map((d) => (
              <div
                key={format(d, "yyyy-MM-dd")}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#c5b0c5" }}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
