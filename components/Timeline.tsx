"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  addMonths,
  subMonths,
  differenceInMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TimelineProps {
  videoDates?: string[];
}

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function Timeline({ videoDates = [] }: TimelineProps) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: currentYear - 2009 + 5 }, (_, i) => 2009 + i),
    [currentYear]
  );

  const today = new Date();
  const [startYear, setStartYear] = useState(today.getFullYear());
  const [startMonth, setStartMonth] = useState(today.getMonth());
  const [endYear, setEndYear] = useState(
    today.getMonth() + 5 > 11 ? today.getFullYear() + 1 : today.getFullYear()
  );
  const [endMonth, setEndMonth] = useState((today.getMonth() + 5) % 12);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const startDate = new Date(startYear, startMonth);
  const endDate = new Date(endYear, endMonth);
  const totalMonths = differenceInMonths(endDate, startDate) + 1;

  // Always show exactly 7 ticks evenly spaced
  const tickMonths = useMemo(() => {
    const ticks: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const offset = Math.round((i * (totalMonths - 1)) / 6);
      ticks.push(addMonths(startDate, offset));
    }
    return ticks;
  }, [startDate, totalMonths]);

  const handlePrev = () => {
    const newEnd = subMonths(endDate, 6);
    const newStart = subMonths(startDate, 6);
    setStartYear(newStart.getFullYear());
    setStartMonth(newStart.getMonth());
    setEndYear(newEnd.getFullYear());
    setEndMonth(newEnd.getMonth());
  };

  const handleNext = () => {
    const newEnd = addMonths(endDate, 6);
    const newStart = addMonths(startDate, 6);
    setStartYear(newStart.getFullYear());
    setStartMonth(newStart.getMonth());
    setEndYear(newEnd.getFullYear());
    setEndMonth(newEnd.getMonth());
  };

  const handleTickClick = (date: Date) => {
    router.push(`/calendar?year=${date.getFullYear()}&month=${date.getMonth()}`);
  };

  const START_YEARS_FIXED = years;

  return (
    <div className="w-full">
      {/* Start / End date selectors */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="relative flex-1">
          <label className="block text-[10px] tracking-wider mb-1.5" style={{ color: "#8c887e" }}>开始</label>
          <button
            onClick={() => { setShowStartPicker(!showStartPicker); setShowEndPicker(false); }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all"
            style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(200,195,185,0.5)", color: "#2b2823" }}
          >
            <span>{startYear}年{startMonth + 1}月</span>
            <svg className="w-3 h-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showStartPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-lg border border-[#d9d4c8] p-3 w-48">
              <YearMonthPicker year={startYear} month={startMonth}
                onChange={(y, m) => { setStartYear(y); setStartMonth(m); }}
                onClose={() => setShowStartPicker(false)} years={START_YEARS_FIXED} />
            </div>
          )}
        </div>

        <div className="pt-5 px-1 text-xs" style={{ color: "#c5bdb5" }}>—</div>

        <div className="relative flex-1">
          <label className="block text-[10px] tracking-wider mb-1.5" style={{ color: "#8c887e" }}>结束</label>
          <button
            onClick={() => { setShowEndPicker(!showEndPicker); setShowStartPicker(false); }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all"
            style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(200,195,185,0.5)", color: "#2b2823" }}
          >
            <span>{endYear}年{endMonth + 1}月</span>
            <svg className="w-3 h-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showEndPicker && (
            <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl shadow-lg border border-[#d9d4c8] p-3 w-48">
              <YearMonthPicker year={endYear} month={endMonth}
                onChange={(y, m) => { setEndYear(y); setEndMonth(m); }}
                onClose={() => setShowEndPicker(false)} years={START_YEARS_FIXED} />
            </div>
          )}
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="flex items-center justify-center gap-4 mb-3">
        <button onClick={handlePrev} className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:bg-white/50" style={{ color: "#8c887e" }}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs tracking-wider" style={{ color: "#8c887e" }}>
          {format(startDate, "yyyy/MM")} — {format(endDate, "yyyy/MM")}
        </span>
        <button onClick={handleNext} className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:bg-white/50" style={{ color: "#8c887e" }}>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Timeline axis - FIXED HEIGHT 72px */}
      <div className="relative" style={{ height: 72 }}>
        {/* Horizontal baseline */}
        <div className="absolute inset-x-4 top-[30px] h-px" style={{ background: "#d9d4c8" }} />

        {/* Ticks and labels - exactly 7 */}
        <div className="flex justify-between px-4">
          {tickMonths.map((date, idx) => {
            const isCurrent = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
            const hasVideo = videoDates.some((d) => {
              const v = new Date(d);
              return v.getFullYear() === date.getFullYear() && v.getMonth() === date.getMonth();
            });
            const showYear = date.getMonth() === 0;

            return (
              <button
                key={idx}
                onClick={() => handleTickClick(date)}
                className="flex flex-col items-center cursor-pointer group transition-all"
                style={{ minWidth: 0 }}
              >
                {/* Vertical tick line */}
                <div
                  className="w-px h-3 transition-all group-hover:h-4"
                  style={{ background: isCurrent ? "#8f8fae" : hasVideo ? "#c5b0c5" : "#d9d4c8" }}
                />
                {isCurrent && <div className="w-1.5 h-1.5 rounded-full mt-[-3px]" style={{ background: "#8f8fae" }} />}

                {/* Month label */}
                <span
                  className="mt-1.5 text-[10px] tracking-wider transition-all group-hover:font-semibold truncate"
                  style={{
                    color: isCurrent ? "#2b2823" : hasVideo ? "#6b5d59" : "#b0a89a",
                    fontWeight: isCurrent ? 600 : 400,
                    lineHeight: 1.2,
                  }}
                >
                  {MONTH_ABBR[date.getMonth()]}
                </span>

                {/* Year label (only for January, fixed position) */}
                {showYear && (
                  <span className="text-[8px] mt-0.5" style={{ color: "#c5bdb5", lineHeight: 1 }}>
                    {date.getFullYear()}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      {videoDates.length > 0 && (
        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "#c5b0c5" }} />
            <span className="text-[9px]" style={{ color: "#b0a89a" }}>有练习</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "#8f8fae" }} />
            <span className="text-[9px]" style={{ color: "#b0a89a" }}>本月</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* Year/Month picker panel */
function YearMonthPicker({
  year, month, onChange, onClose, years,
}: {
  year: number; month: number;
  onChange: (y: number, m: number) => void;
  onClose: () => void;
  years: number[];
}) {
  const [selectedYear, setSelectedYear] = useState(year);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setSelectedYear(y => y - 1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#efece4]">
          <ChevronLeft className="h-3 w-3" />
        </button>
        <span className="text-sm font-medium" style={{ color: "#2b2823" }}>{selectedYear}</span>
        <button onClick={() => setSelectedYear(y => y + 1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#efece4]">
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {MONTH_ABBR.map((abbr, m) => {
          const isSelected = m === month && selectedYear === year;
          return (
            <button key={m} onClick={() => { onChange(selectedYear, m); onClose(); }}
              className="px-2 py-1.5 text-xs rounded-lg transition-all hover:bg-[#efece4]"
              style={{ background: isSelected ? "#d9d4c8" : "transparent", color: isSelected ? "#2b2823" : "#8c887e", fontWeight: isSelected ? 600 : 400 }}
            >
              {abbr}
            </button>
          );
        })}
      </div>

      <div className="mt-2 pt-2 border-t border-[#d9d4c8]">
        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          {years.map((y) => (
            <button key={y} onClick={() => setSelectedYear(y)}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${y === selectedYear ? "font-semibold" : ""}`}
              style={{ background: y === selectedYear ? "#e6e2d8" : "transparent", color: y === selectedYear ? "#2b2823" : "#8c887e" }}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
