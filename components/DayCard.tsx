import Link from "next/link";
import { format } from "date-fns";
import { Upload } from "lucide-react";

interface DayCardProps {
  date: Date;
  hasVideo?: boolean;
  thumbnailUrl?: string;
  isCurrentMonth?: boolean;
}

export default function DayCard({
  date,
  hasVideo = false,
  thumbnailUrl,
  isCurrentMonth = true,
}: DayCardProps) {
  const day = date.getDate();
  const dateStr = format(date, "yyyy-MM-dd");

  if (!hasVideo) {
    return (
      <Link
        href={`/upload?date=${dateStr}`}
        className={`
          relative aspect-square rounded-xl overflow-hidden
          flex flex-col items-center justify-center
          transition-all duration-200 group
          ${isCurrentMonth ? "bg-white/60 hover:bg-white" : "opacity-30 bg-transparent"}
          hover:shadow-sm
        `}
      >
        <span className={`relative text-base font-semibold ${isCurrentMonth ? "text-warm-muted/40" : "text-warm-muted/20"}`}>
          {day}
        </span>

        {isCurrentMonth && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/0 group-hover:bg-warm-dark/5 transition-colors rounded-xl">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-0.5">
              <Upload className="h-4 w-4 text-coral" />
              <span className="text-[9px] text-coral font-medium">上传</span>
            </div>
          </div>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/day/${dateStr}`}
      className={`
        relative aspect-square rounded-xl overflow-hidden
        flex flex-col items-center justify-center
        transition-all duration-200 group
        ${isCurrentMonth ? "bg-white" : "opacity-30"}
        cursor-pointer hover:shadow-md hover:-translate-y-0.5
      `}
      style={
        thumbnailUrl
          ? {
              backgroundImage: `url(${thumbnailUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}
      }
    >
      {!thumbnailUrl && <div className="absolute inset-0 bg-white" />}
      {thumbnailUrl && <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />}

      <span className={`relative text-lg font-bold ${thumbnailUrl ? "text-white" : "text-warm-dark"}`}>
        {day}
      </span>

      <span className="relative mt-0.5 flex h-1.5 w-1.5 rounded-full bg-coral shadow-sm" />
    </Link>
  );
}
