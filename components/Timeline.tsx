"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, isSameMonth } from "date-fns";

interface TimelineProps {
  videoDates?: string[];
}

export default function Timeline({ videoDates = [] }: TimelineProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(60);
  const center = 60;

  // 生成 121 个月（10年范围），当前月居中
  const [months] = useState<Date[]>(() => {
    const arr: Date[] = [];
    const base = new Date();
    for (let i = -60; i <= 60; i++) {
      arr.push(i < 0 ? subMonths(base, Math.abs(i)) : i === 0 ? base : addMonths(base, i));
    }
    return arr;
  });

  const hasVideo = (date: Date) => {
    return videoDates.some((d) => {
      const v = new Date(d);
      return v.getFullYear() === date.getFullYear() && v.getMonth() === date.getMonth();
    });
  };

  useEffect(() => {
    setCurrentIndex(center);
    if (scrollRef.current) {
      const child = scrollRef.current.children[center] as HTMLElement;
      if (child) {
        const container = scrollRef.current;
        container.scrollLeft = child.offsetLeft - container.offsetWidth / 2 + child.offsetWidth / 2;
      }
    }
  }, []);

  const goTo = (idx: number) => {
    const clamped = Math.max(0, Math.min(months.length - 1, idx));
    setCurrentIndex(clamped);
    if (scrollRef.current) {
      const child = scrollRef.current.children[clamped] as HTMLElement;
      if (child) {
        const container = scrollRef.current;
        const scrollLeft = child.offsetLeft - container.offsetWidth / 2 + child.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  };

  const handleMonthClick = (date: Date) => {
    router.push(`/calendar?year=${date.getFullYear()}&month=${date.getMonth()}`);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex items-center justify-center gap-5 mb-4">
        <button onClick={() => goTo(currentIndex - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-warm-muted hover:text-warm-dark hover:shadow-sm transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="text-center min-w-[120px]">
          <div className="text-2xl font-bold text-warm-dark tracking-tight">
            {format(months[currentIndex], "M")}
            <span className="text-base font-normal text-warm-muted ml-0.5">月</span>
          </div>
          <div className="text-xs text-warm-muted/50 mt-0.5">{format(months[currentIndex], "yyyy")}</div>
        </div>

        <button onClick={() => goTo(currentIndex + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-warm-muted hover:text-warm-dark hover:shadow-sm transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="relative px-6">
        <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-gradient-to-r from-coral/20 via-cream-dark to-teal/20 -translate-y-1/2 rounded-full" />

        <div ref={scrollRef}
          className="flex overflow-x-auto gap-0 pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {months.map((date, idx) => {
            const isActive = idx === currentIndex;
            const has = hasVideo(date);
            const isToday = isSameMonth(date, new Date());

            return (
              <button key={`${date.getFullYear()}-${date.getMonth()}`}
                onClick={() => handleMonthClick(date)}
                className="flex flex-col items-center shrink-0 cursor-pointer transition-all duration-300"
                style={{ width: isActive ? 64 : 44 }}
              >
                <div className="relative flex items-center justify-center h-10">
                  {isActive ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-coral to-coral-light shadow-md" />
                      <div className="absolute w-9 h-9 rounded-full bg-coral/10 animate-ping" />
                    </>
                  ) : has ? (
                    <div className="w-3 h-3 rounded-full bg-coral/60 hover:bg-coral/80 transition-colors" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-cream-dark" />
                  )}
                  {isToday && !isActive && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-sun border-2 border-cream" />
                  )}
                </div>
                <span className={`mt-1 text-xs transition-all duration-200 ${
                  isActive ? "font-bold text-warm-dark" : "text-warm-muted/50"
                }`}>
                  {date.getMonth() + 1}月
                </span>
                {date.getMonth() === 0 && (
                  <span className="text-[9px] text-warm-muted/30 -mt-0.5">{date.getFullYear()}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
