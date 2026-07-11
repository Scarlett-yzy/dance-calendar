"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface MonthNavProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthNav({ year, month, onPrev, onNext }: MonthNavProps) {
  const date = new Date(year, month);
  const isCurrentMonth =
    year === new Date().getFullYear() && month === new Date().getMonth();

  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={onPrev}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-warm-muted hover:text-warm-dark hover:shadow-sm transition-all"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="text-center">
        <h2 className="text-xl font-bold text-warm-dark tracking-tight">
          {format(date, "M")}
          <span className="text-sm font-normal text-warm-muted ml-0.5">月 {format(date, "yyyy")}</span>
        </h2>
        {isCurrentMonth && (
          <span className="text-[10px] text-coral/70 font-medium">本月</span>
        )}
      </div>

      <button
        onClick={onNext}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-warm-muted hover:text-warm-dark hover:shadow-sm transition-all"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
