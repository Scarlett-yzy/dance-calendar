"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1";

interface CloudinaryAuth {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

export default function UploadPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [videoPreview, setVideoPreview] = useState<string>("");

  const [title, setTitle] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [dateFromUrl, setDateFromUrl] = useState(false);

  const [enableCompare, setEnableCompare] = useState(false);
  const [refVideoFile, setRefVideoFile] = useState<File | null>(null);
  const [refVideoTitle, setRefVideoTitle] = useState("");
  const refInputRef = useRef<HTMLInputElement>(null);

  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");
    if (dateParam) {
      setRecordDate(dateParam);
      setDateFromUrl(true);
    } else {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      setRecordDate(`${y}-${m}-${d}`);
      setDateFromUrl(false);
    }
  }, []);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  /** 获取 Cloudinary 签名 */
  const getAuth = async (): Promise<CloudinaryAuth> => {
    const res = await fetch("/api/cloudinary-auth");
    if (!res.ok) throw new Error("无法获取上传凭证");
    return res.json();
  };

  /** 上传文件到 Cloudinary（浏览器直传） */
  const uploadToCloudinary = async (
    file: File,
    auth: CloudinaryAuth,
    resourceType: "video" | "image",
    onProgress?: (pct: number) => void
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", auth.apiKey);
    formData.append("timestamp", String(auth.timestamp));
    formData.append("signature", auth.signature);
    formData.append("folder", auth.folder);

    return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${CLOUDINARY_UPLOAD_URL}/${auth.cloudName}/${resourceType}/upload`;

      xhr.open("POST", url);
      xhr.responseType = "json";

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 && xhr.response) {
          resolve({
            url: xhr.response.secure_url,
            publicId: xhr.response.public_id,
          });
        } else {
          const msg = xhr.response?.error?.message || "上传到云存储失败";
          reject(new Error(msg));
        }
      };

      xhr.onerror = () => reject(new Error("网络错误，上传失败"));
      xhr.send(formData);
    });
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("请选择视频文件（MP4、MOV 等）");
      return;
    }

    setVideoFile(file);
    setTitle(file.name.replace(/\.[^/.]+$/, ""));

    if (!dateFromUrl) {
      const fileDate = new Date(file.lastModified);
      const fy = fileDate.getFullYear();
      const fm = String(fileDate.getMonth() + 1).padStart(2, "0");
      const fd = String(fileDate.getDate()).padStart(2, "0");
      setRecordDate(`${fy}-${fm}-${fd}`);
    }

    const url = URL.createObjectURL(file);
    setVideoPreview(url);

    setTimeout(() => captureThumbnail(url), 100);
  };

  const captureThumbnail = (videoUrl: string) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.src = videoUrl;

    video.onloadeddata = () => {
      video.currentTime = 0.1;
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          setThumbnailBlob(blob);
          setThumbnailPreview(URL.createObjectURL(blob));
        }
      }, "image/jpeg", 0.85);

      video.remove();
    };
  };

  const handleUpload = async () => {
    if (!videoFile || !thumbnailBlob) {
      alert("请等待封面生成完毕");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // 1. 获取 Cloudinary 上传凭证
      setProgressText("获取上传凭证…");
      const auth = await getAuth();

      // 2. 上传视频到 Cloudinary（浏览器直传）
      setProgressText("上传视频中…");
      const videoResult = await uploadToCloudinary(videoFile, auth, "video", (pct) => {
        setProgress(Math.round(pct * 0.7)); // 视频占70%进度
      });

      // 3. 上传缩略图
      setProgressText("上传封面…");
      const thumbnailFile = new File([thumbnailBlob], "thumbnail.jpg", { type: "image/jpeg" });
      const thumbResult = await uploadToCloudinary(thumbnailFile, auth, "image", (pct) => {
        setProgress(70 + Math.round(pct * 0.1)); // 缩略图占10%
      });

      // 4. 上传参考视频（如果有）
      let refResult: { url: string; publicId: string } | null = null;
      if (enableCompare && refVideoFile) {
        setProgressText("上传参考视频…");
        refResult = await uploadToCloudinary(refVideoFile, auth, "video", (pct) => {
          setProgress(80 + Math.round(pct * 0.1));
        });
      }

      // 5. 保存到数据库
      setProgressText("保存记录…");
      setProgress(95);
      const saveRes = await fetch("/api/videos/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          recordDate,
          videoUrl: videoResult.url,
          videoPublicId: videoResult.publicId,
          thumbnailUrl: thumbResult.url,
          referenceFileUrl: refResult?.url || null,
          referencePublicId: refResult?.publicId || null,
          referenceTitle: refResult ? refVideoTitle || refVideoFile.name.replace(/\.[^/.]+$/, "") : null,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.error || "保存记录失败");
      }

      setProgress(100);
      router.push(recordDate ? `/day/${recordDate}` : "/calendar");
    } catch (error) {
      alert(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
      setProgressText("");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden bg-[#fcf8f5]">
      {/* pai.co 风格流动色块 */}
      <div className="absolute pointer-events-none w-[45vw] h-[45vw] rounded-full" style={{ left: "5%", top: "10%", background: "#fce9dc", filter: "blur(100px)", opacity: 0.7, animation: "driftA 12s ease-in-out infinite" }} />
      <div className="absolute pointer-events-none w-[50vw] h-[50vw] rounded-full" style={{ left: "50%", top: "-5%", background: "#f8d7d7", filter: "blur(110px)", opacity: 0.65, animation: "driftB 14s ease-in-out infinite alternate" }} />
      <div className="absolute pointer-events-none w-[40vw] h-[40vw] rounded-full" style={{ left: "30%", top: "50%", background: "#fffdf9", filter: "blur(100px)", opacity: 0.6, animation: "driftC 13s ease-in-out infinite alternate-reverse" }} />
      <div className="absolute pointer-events-none w-[55vw] h-[55vw] rounded-full" style={{ left: "-10%", top: "30%", background: "#d7d4ee", filter: "blur(120px)", opacity: 0.5, animation: "driftD 16s ease-in-out infinite" }} />
      <div className="absolute pointer-events-none w-[35vw] h-[35vw] rounded-full" style={{ left: "60%", top: "55%", background: "#fce9dc", filter: "blur(90px)", opacity: 0.45, animation: "driftA 15s ease-in-out infinite alternate" }} />
      {/* 顶部导航 */}
      <div className="flex items-center gap-2 px-6 py-4 shrink-0 relative z-10">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-warm-muted/60 hover:text-warm-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-sm font-medium" style={{ color: "#6b5d59" }}>上传舞蹈视频</h1>
      </div>

      {/* 主内容 */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20 relative z-10">
        <div className="w-full max-w-lg">
          {!videoFile ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-3 border-dashed rounded-3xl text-center cursor-pointer transition-all
                flex flex-col items-center justify-center
                ${dragOver
                  ? "border-[#c98a94] bg-white/40"
                  : "border-white/60 bg-white/30 hover:bg-white/40 hover:border-white/80"
                }
                py-28 px-8
              `}
            >
              <svg className="w-16 h-16 mb-5" viewBox="0 0 24 24" fill="none" stroke="#c98a94" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M7 3v18" />
                <path d="M3 7.5h4" />
                <path d="M3 12h18" />
                <path d="M3 16.5h4" />
                <path d="M17 3v18" />
              </svg>
              <p className="text-xl font-medium mb-2" style={{ color: "#6b5d59" }}>
                点击选择或拖拽视频到此处
              </p>
              <p className="text-sm" style={{ color: "#8a7b76" }}>支持 MP4、MOV 等格式</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="space-y-5">
              {thumbnailPreview && (
                <div className="rounded-2xl overflow-hidden bg-white/40">
                  <img src={thumbnailPreview} alt="视频封面" className="w-full aspect-video object-cover" />
                  <p className="text-xs text-center py-1.5" style={{ color: "#8a7b76" }}>
                    ↑ 自动截取的第一帧作为封面
                  </p>
                </div>
              )}

              {/* 进度条 */}
              {uploading && (
                <div className="rounded-xl bg-white/40 p-4 space-y-2">
                  <div className="flex justify-between text-xs" style={{ color: "#6b5d59" }}>
                    <span>{progressText}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                        background: "linear-gradient(90deg, #8f8fae, #6f6f92)",
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#6b5d59" }}>标题</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/60 bg-white/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c98a94]/40"
                  placeholder="给这段舞蹈起个名字" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#6b5d59" }}>拍摄日期</label>
                <input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full rounded-xl border border-white/60 bg-white/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c98a94]/40" />
              </div>

              <div className="rounded-xl border border-white/60 bg-white/30 overflow-hidden">
                <button type="button" onClick={() => setEnableCompare(!enableCompare)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${enableCompare ? "bg-[#6f6f92] border-[#6f6f92]" : "border-white/60"}`}>
                      {enableCompare && <span className="text-white text-[10px]">✓</span>}
                    </span>
                    <span style={{ color: "#6b5d59" }}>对比参考视频</span>
                  </div>
                  <span className="text-xs" style={{ color: "#8a7b76" }}>可选</span>
                </button>
                {enableCompare && (
                  <div className="px-4 pb-4 border-t border-white/30 pt-3">
                    <p className="text-xs mb-2" style={{ color: "#8a7b76" }}>上传老师或标准视频，详情页可左右对比观看</p>
                    {!refVideoFile ? (
                      <div onClick={() => refInputRef.current?.click()}
                        className="border-2 border-dashed border-white/60 rounded-xl py-5 text-center cursor-pointer hover:bg-white/20 transition-colors">
                        <p className="text-sm" style={{ color: "#6b5d59" }}>点击选择参考视频</p>
                        <input ref={refInputRef} type="file" accept="video/*" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) { setRefVideoFile(f); setRefVideoTitle(f.name.replace(/\.[^/.]+$/, "")); } }} />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-white/30 rounded-xl px-3 py-2">
                        <span className="text-sm truncate" style={{ color: "#6b5d59" }}>{refVideoTitle}</span>
                        <button onClick={() => { setRefVideoFile(null); setRefVideoTitle(""); }} className="text-xs text-red-400 hover:text-red-600 shrink-0">移除</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setVideoFile(null); setThumbnailBlob(null); setThumbnailPreview(""); setVideoPreview(""); }}
                  className="flex-1 rounded-xl border border-white/60 bg-white/30 px-4 py-3 text-sm hover:bg-white/40 transition-colors"
                  style={{ color: "#6b5d59" }}>
                  重新选择
                </button>
                <button onClick={handleUpload} disabled={uploading || !thumbnailBlob}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{
                    background: uploading
                      ? "linear-gradient(120deg, #b8b8cc, #8f8fae)"
                      : "linear-gradient(120deg, #8f8fae, #6f6f92)",
                    boxShadow: "0 8px 20px rgba(111,111,146,0.3)",
                  }}>
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> {progressText}</> : <><Upload className="h-4 w-4" /> 上传视频</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
