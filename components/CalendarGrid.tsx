"use client";

import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subDays,
  addDays,
} from "date-fns";
import DayCard from "./DayCard";

interface CalendarDay {
  date: Date;
  hasVideo: boolean;
  thumbnailUrl?: string;
}

interface CalendarGridProps {
  year: number;
  month: number;
  days: CalendarDay[];
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export default function CalendarGrid({ year, month, days }: CalendarGridProps) {
  // 获取本月所有日期
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 计算第一天是星期几（0=周日）
  const startDay = getDay(monthStart);

  // 构建完整 grid 数据：前补空白 + 本月天数
  const gridDays: (CalendarDay | null)[] = [];

  // 上月补位
  for (let i = 0; i < startDay; i++) {
    const prevDate = subDays(monthStart, startDay - i);
    gridDays.push(null);
  }

  // 本月
  for (const date of allDays) {
    const videoDay = days.find(
      (d) =>
        d.date.getFullYear() === date.getFullYear() &&
        d.date.getMonth() === date.getMonth() &&
        d.date.getDate() === date.getDate()
    );
    gridDays.push(
      videoDay ?? { date, hasVideo: false }
    );
  }

  return (
    <div className="space-y-1">
      {/* 星期行 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((name) => (
          <div
            key={name}
            className="text-center text-xs font-medium text-zinc-400 py-1"
          >
            {name}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1">
        {gridDays.map((day, i) =>
          day ? (
            <DayCard
              key={i}
              date={day.date}
              hasVideo={day.hasVideo}
              thumbnailUrl={day.thumbnailUrl}
            />
          ) : (
            <div key={i} className="aspect-square" />
          )
        )}
      </div>
    </div>
  );
}
