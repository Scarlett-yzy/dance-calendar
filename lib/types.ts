export interface BlockContent {
  id: string;
  type: "text" | "image" | "mixed";
  text?: string;
  images?: BlockImage[];
}

export interface BlockImage {
  id: string;
  url: string;
  source?: "main" | "ref";
  annotations?: Annotation[];
}

export interface Annotation {
  type: "circle" | "arrow" | "text";
  x: number;
  y: number;
  radius?: number;
  text?: string;
  color?: string;
}

export interface VideoWithEntry {
  id: string;
  title: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  recordDate: string;
  duration: number | null;
  entry?: {
    id: string;
    date: string;
    blocks: string;
  } | null;
}

export interface CalendarDay {
  date: Date;
  hasVideo: boolean;
  thumbnailUrl?: string;
  videoId?: string;
}
