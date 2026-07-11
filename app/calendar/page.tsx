"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Upload, Loader2, ArrowLeft } from "lucide-react";
import MonthNav from "@/components/MonthNav";
import CalendarGrid from "@/components/CalendarGrid";
import type { CalendarDay } from "@/lib/types";

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{background: "linear-gradient(135deg, #fffdf9 0%, #fce9dc 25%, #f8d7d7 45%, #e8d4e8 60%, #d7d4ee 75%, #f8d7d7 90%, #fce9dc 100%)", backgroundSize: "250% 250%"}}><Loader2 className="h-8 w-8 animate-spin text-warm-muted" /></div>}>
      <CalendarContent />
    </Suspense>
  );
}

function CalendarContent() {
  const searchParams = useSearchParams();
  const urlYear = searchParams.get("year");
  const urlMonth = searchParams.get("month");

  const today = new Date();
  const [year, setYear] = useState(
    urlYear ? parseInt(urlYear) : today.getFullYear()
  );
  const [month, setMonth] = useState(
    urlMonth ? parseInt(urlMonth) : today.getMonth()
  );
  const [videos, setVideos] = useState<{ date: string; thumbnailUrl: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVideos = useCallback(() => {
    setLoading(true);
    fetch("/api/videos")
      .then((res) => res.json())
      .then((data) => {
        if (data.videos) {
          setVideos(
            data.videos.map((v: { recordDate: string; thumbnailUrl: string | null }) => ({
              date: v.recordDate.split("T")[0],
              thumbnailUrl: v.thumbnailUrl,
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

  // 窗口获得焦点时刷新（从详情页删除后返回时）
  useEffect(() => {
    window.addEventListener("focus", loadVideos);
    return () => window.removeEventListener("focus", loadVideos);
  }, [loadVideos]);

  const calendarDays: CalendarDay[] = videos
    .filter((v) => {
      const d = new Date(v.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .map((v) => ({
      date: new Date(v.date),
      hasVideo: true,
      thumbnailUrl: v.thumbnailUrl ?? undefined,
    }));

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

  return (
    <div className="min-h-screen relative overflow-hidden px-4 py-6"
      style={{
        background: "linear-gradient(145deg, #fcf8f5 0%, #fce9dc 20%, #f8d7d7 40%, #fffdf9 55%, #e8d4e8 70%, #d7d4ee 85%, #fcf8f5 100%)",
        backgroundSize: "200% 200%",
        animation: "flowBg 30s ease-in-out infinite",
      }}>
      {/* 动画色块叠加 */}
      <div className="absolute pointer-events-none w-[45vw] h-[45vw] rounded-full" style={{ left: "5%", top: "10%", background: "#fce9dc", filter: "blur(100px)", opacity: 0.55, animation: "driftA 12s ease-in-out infinite" }} />
      <div className="absolute pointer-events-none w-[50vw] h-[50vw] rounded-full" style={{ left: "50%", top: "-5%", background: "#f8d7d7", filter: "blur(110px)", opacity: 0.55, animation: "driftB 14s ease-in-out infinite alternate" }} />
      <div className="absolute pointer-events-none w-[40vw] h-[40vw] rounded-full" style={{ left: "30%", top: "50%", background: "#fffdf9", filter: "blur(100px)", opacity: 0.5, animation: "driftC 13s ease-in-out infinite alternate-reverse" }} />
      <div className="absolute pointer-events-none w-[55vw] h-[55vw] rounded-full" style={{ left: "-10%", top: "30%", background: "#d7d4ee", filter: "blur(120px)", opacity: 0.45, animation: "driftD 16s ease-in-out infinite" }} />
      <div className="absolute pointer-events-none w-[35vw] h-[35vw] rounded-full" style={{ left: "60%", top: "55%", background: "#fce9dc", filter: "blur(90px)", opacity: 0.4, animation: "driftA 15s ease-in-out infinite alternate" }} />
      <div className="max-w-md mx-auto relative z-10">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-warm-muted hover:text-warm-dark transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            时光轴
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-1.5 text-sm text-warm-muted hover:text-warm-dark transition-colors"
          >
            <Upload className="h-4 w-4" />
            上传
          </Link>
        </div>

        <MonthNav year={year} month={month} onPrev={handlePrev} onNext={handleNext} />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-warm-muted" />
          </div>
        ) : (
          <>
            <CalendarGrid year={year} month={month} days={calendarDays} />
            <p className="mt-8 text-center text-xs text-warm-muted/60">
              {calendarDays.length === 0 ? "本月还没有练习记录" : "点击有红点的日期查看详细记录"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
