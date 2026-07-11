"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Timeline from "@/components/Timeline";

export default function Home() {
  const router = useRouter();
  const [petals, setPetals] = useState<React.ReactNode[]>([]);
  const [videoDates, setVideoDates] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/videos")
      .then((res) => res.json())
      .then((data) => {
        if (data.videos) {
          setVideoDates(data.videos.map((v: { recordDate: string }) => v.recordDate));
        }
      })
      .catch(() => {});
  }, []);

  // 花瓣飘落
  useEffect(() => {
    const arr: React.ReactNode[] = [];
    const colors = ["#e8b4b8", "#f2c9cc", "#f5deb3", "#dccce4", "#c9b8d6", "#fce9dc"];
    for (let i = 0; i < 20; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 15;
      const dur = 10 + Math.random() * 12;
      const size = 10 + Math.random() * 14;
      const color = colors[Math.floor(Math.random() * colors.length)];
      arr.push(
        <div key={i}
          className="absolute top-0 pointer-events-none"
          style={{
            left: `${left}%`,
            width: size,
            height: size * 0.6,
            backgroundColor: color,
            borderRadius: "50% 0 50% 0",
            opacity: 0.7,
            animation: `fall ${dur}s ease-in ${delay}s infinite`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      );
    }
    setPetals(arr);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#fcf8f5]">
      {/* ===== pai.co 风格流动色块 ===== */}
      {/* 每个色块独立移动，blur 后交融 */}
      <div className="absolute pointer-events-none w-[45vw] h-[45vw] rounded-full"
        style={{
          left: "5%", top: "10%",
          background: "#fce9dc",
          filter: "blur(100px)",
          opacity: 0.65,
          animation: "driftA 18s ease-in-out infinite",
        }}
      />
      <div className="absolute pointer-events-none w-[50vw] h-[50vw] rounded-full"
        style={{
          left: "50%", top: "-5%",
          background: "#f8d7d7",
          filter: "blur(110px)",
          opacity: 0.6,
          animation: "driftB 22s ease-in-out infinite alternate",
        }}
      />
      <div className="absolute pointer-events-none w-[40vw] h-[40vw] rounded-full"
        style={{
          left: "30%", top: "50%",
          background: "#fffdf9",
          filter: "blur(100px)",
          opacity: 0.55,
          animation: "driftC 20s ease-in-out infinite alternate-reverse",
        }}
      />
      <div className="absolute pointer-events-none w-[55vw] h-[55vw] rounded-full"
        style={{
          left: "-10%", top: "30%",
          background: "#d7d4ee",
          filter: "blur(120px)",
          opacity: 0.45,
          animation: "driftD 25s ease-in-out infinite",
        }}
      />
      <div className="absolute pointer-events-none w-[35vw] h-[35vw] rounded-full"
        style={{
          left: "60%", top: "55%",
          background: "#fce9dc",
          filter: "blur(90px)",
          opacity: 0.4,
          animation: "driftA 24s ease-in-out infinite alternate",
        }}
      />
      <div className="absolute pointer-events-none w-[30vw] h-[30vw] rounded-full"
        style={{
          left: "70%", top: "20%",
          background: "#fce9dc",
          filter: "blur(80px)",
          opacity: 0.5,
          animation: "driftB 16s ease-in-out infinite reverse",
        }}
      />
      <div className="absolute pointer-events-none w-[38vw] h-[38vw] rounded-full"
        style={{
          left: "15%", top: "60%",
          background: "#f8d7d7",
          filter: "blur(100px)",
          opacity: 0.3,
          animation: "driftC 28s ease-in-out infinite",
        }}
      />

      {/* 光线 */}
      <div className="absolute left-[-20%] top-[-15%] w-[140%] h-[90%] pointer-events-none"
        style={{
          background: "linear-gradient(115deg, rgba(255,255,255,0), rgba(255,255,255,.55), rgba(255,255,255,0))",
          filter: "blur(90px)",
          transform: "rotate(-18deg)",
        }}
      />

      {/* 树影（摇曳剪影） */}
      <div className="absolute pointer-events-none"
        style={{
          left: -30, top: -10, width: 300, height: 650,
          animation: "sway 5s ease-in-out infinite alternate",
        }}
      >
        <svg viewBox="0 0 300 650" width="100%" height="100%">
          <g fill="#6b5d59" opacity="0.15" transform="translate(150,650) scale(1,-1)">
            <path d="M-20 0 C-25-100 -15-200 0-300 C15-200 25-100 20 0Z" />
            <path d="M0-200 C-60-220-100-180-120-120" stroke="#6b5d59" strokeWidth="6" fill="none" opacity="0.2"/>
            <path d="M0-180 C50-200 90-160 110-100" stroke="#6b5d59" strokeWidth="6" fill="none" opacity="0.2"/>
            <path d="M0-250 C-40-270-80-240-90-200" stroke="#6b5d59" strokeWidth="5" fill="none" opacity="0.2"/>
            <path d="M0-230 C40-250 70-220 80-180" stroke="#6b5d59" strokeWidth="5" fill="none" opacity="0.2"/>
            <ellipse cx="-100" cy="-100" rx="55" ry="40" opacity="0.15"/>
            <ellipse cx="90" cy="-80" rx="50" ry="38" opacity="0.15"/>
            <ellipse cx="-60" cy="-240" rx="45" ry="35" opacity="0.12"/>
            <ellipse cx="50" cy="-220" rx="40" ry="30" opacity="0.12"/>
            <ellipse cx="0" cy="-280" rx="50" ry="40" opacity="0.12"/>
          </g>
        </svg>
      </div>
      <div className="absolute pointer-events-none"
        style={{
          right: -20, top: 50, width: 260, height: 550,
          animation: "sway 6s ease-in-out infinite alternate-reverse",
        }}
      >
        <svg viewBox="0 0 260 550" width="100%" height="100%">
          <g fill="#6b5d59" opacity="0.12" transform="translate(130,550) scale(1,-1)">
            <path d="M-15 0 C-20-80-10-170 0-260 C10-170 20-80 15 0Z" />
            <path d="M0-170 C-50-190-80-150-95-100" stroke="#6b5d59" strokeWidth="5" fill="none" opacity="0.2"/>
            <path d="M0-150 C40-170 70-130 80-80" stroke="#6b5d59" strokeWidth="5" fill="none" opacity="0.2"/>
            <ellipse cx="-75" cy="-80" rx="45" ry="32" opacity="0.15"/>
            <ellipse cx="65" cy="-60" rx="40" ry="30" opacity="0.15"/>
            <ellipse cx="0" cy="-230" rx="40" ry="32" opacity="0.12"/>
          </g>
        </svg>
      </div>

      {/* 底部花丛 */}
      <div className="absolute bottom-0 left-0 right-0 h-[160px] pointer-events-none overflow-hidden">
        <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="w-full h-full">
          <g opacity="0.5">
            <ellipse cx="120" cy="160" rx="160" ry="55" fill="#8d9b7a" opacity="0.2"/>
            <circle cx="80" cy="120" r="11" fill="#e8b4b8" opacity="0.6"/>
            <circle cx="100" cy="115" r="9" fill="#f2c9cc" opacity="0.6"/>
            <circle cx="115" cy="125" r="10" fill="#e8b4b8" opacity="0.5"/>
            <circle cx="140" cy="118" r="8" fill="#dccce4" opacity="0.5"/>
            <ellipse cx="720" cy="160" rx="200" ry="45" fill="#8d9b7a" opacity="0.12"/>
            <circle cx="680" cy="130" r="9" fill="#c9b8d6" opacity="0.5"/>
            <circle cx="720" cy="125" r="10" fill="#e8b4b8" opacity="0.5"/>
            <circle cx="760" cy="130" r="8" fill="#f2c9cc" opacity="0.5"/>
            <ellipse cx="1320" cy="160" rx="160" ry="50" fill="#8d9b7a" opacity="0.2"/>
            <circle cx="1280" cy="120" r="10" fill="#f2c9cc" opacity="0.6"/>
            <circle cx="1300" cy="115" r="9" fill="#e8b4b8" opacity="0.6"/>
            <circle cx="1325" cy="120" r="11" fill="#c9b8d6" opacity="0.5"/>
            <circle cx="1350" cy="128" r="8" fill="#f5deb3" opacity="0.5"/>
          </g>
        </svg>
      </div>

      {/* 飘落花瓣 */}
      {petals}

      {/* ========== 韵影录 内容 ========== */}
      <div className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto z-10">
        <div className="text-center max-w-[640px] w-full px-6 py-8">
          {/* 星光徽章 */}
          <div className="relative mb-3.5 inline-block" style={{ animation: "float 3s ease-in-out infinite" }}>
            <svg className="w-14 h-auto" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.6">
                <line x1="40" y1="8" x2="40" y2="2" stroke="#E8C4A0" strokeWidth="1.8" strokeLinecap="round" style={{ animation: "sparkle 2s ease-in-out infinite" }} />
                <line x1="40" y1="78" x2="40" y2="72" stroke="#E8C4A0" strokeWidth="1.8" strokeLinecap="round" style={{ animation: "sparkle-delay 2.5s ease-in-out infinite" }} />
                <line x1="8" y1="40" x2="2" y2="40" stroke="#E8C4A0" strokeWidth="1.8" strokeLinecap="round" style={{ animation: "sparkle 2.8s ease-in-out infinite" }} />
                <line x1="78" y1="40" x2="72" y2="40" stroke="#E8C4A0" strokeWidth="1.8" strokeLinecap="round" style={{ animation: "sparkle-delay 2.2s ease-in-out infinite" }} />
                <line x1="16.5" y1="16.5" x2="12" y2="12" stroke="#E8C4A0" strokeWidth="1.5" strokeLinecap="round" style={{ animation: "sparkle-delay 3s ease-in-out infinite" }} />
                <line x1="63.5" y1="63.5" x2="68" y2="68" stroke="#E8C4A0" strokeWidth="1.5" strokeLinecap="round" style={{ animation: "sparkle 2.6s ease-in-out infinite" }} />
              </g>
              <circle cx="20" cy="14" r="1.8" fill="#ECB8C0" opacity="0.8" style={{ animation: "sparkle 2.4s ease-in-out infinite" }} />
              <circle cx="60" cy="18" r="1.5" fill="#F5D2D6" opacity="0.7" style={{ animation: "sparkle-delay 2.8s ease-in-out infinite" }} />
              <circle cx="58" cy="66" r="1.8" fill="#D6A2AD" opacity="0.8" style={{ animation: "sparkle 3s ease-in-out infinite" }} />
              <circle cx="22" cy="68" r="1.5" fill="#E5D7D6" opacity="0.7" style={{ animation: "sparkle-delay 2.2s ease-in-out infinite" }} />
              <path d="M40 12 L44 30 L62 34 L46 44 L50 64 L40 52 L30 64 L34 44 L18 34 L36 30 Z" fill="#E8C4A0" stroke="#D6A2AD" strokeWidth="1.2" opacity="0.9" />
              <path d="M40 24 L42 32 L50 34 L43 40 L45 48 L40 43 L35 48 L37 40 L30 34 L38 32 Z" fill="#F5D2D6" opacity="0.7" />
            </svg>
          </div>

          <h1 className="text-[44px] font-semibold tracking-[14px] mb-2.5" style={{ color: "#4a3f3d", fontFamily: "'Noto Serif SC', var(--font-nss), serif" }}>
            韵<span className="text-[#c98a94] tracking-normal mx-0.5">·</span>影<span className="text-[#c98a94] tracking-normal mx-0.5">·</span>录
          </h1>
          <div className="text-[15px] tracking-[6px] mb-6" style={{ color: "#b8677a", fontWeight: 500, fontFamily: "var(--font-cg), 'Cormorant Garamond', serif" }}>
            DANCE MOMENTS
          </div>
          <div className="flex items-center justify-center gap-2.5 text-[15.5px] mb-9 tracking-wide" style={{ color: "#6b5d59" }}>
            <span className="w-[5px] h-[5px] rounded-full inline-block" style={{ backgroundColor: "#c98a94" }} />
            以韵入影，以影成录。
            <span className="w-[5px] h-[5px] rounded-full inline-block" style={{ backgroundColor: "#c98a94" }} />
          </div>

          {/* 时光卡片 */}
          <div className="w-full rounded-[28px] p-[28px_32px_24px] backdrop-blur-lg mb-8 relative"
            style={{
              background: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow: "0 20px 50px rgba(120,100,90,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
            }}
          >
            {/* 装饰圆点 */}
            <div className="absolute w-2 h-2 rounded-full" style={{ top: 16, left: 20, background: "rgba(255,255,255,0.9)", boxShadow: "0 0 0 3px rgba(255,255,255,0.35)" }} />
            <div className="absolute w-2 h-2 rounded-full" style={{ top: 16, right: 20, background: "rgba(255,255,255,0.9)", boxShadow: "0 0 0 3px rgba(255,255,255,0.35)" }} />

            {/* 时光轴组件 */}
            <Timeline videoDates={videoDates} />
          </div>

          <button onClick={() => router.push("/upload")}
            className="w-full max-w-[420px] py-3.5 border-none rounded-full text-[#fbf9f7] text-base tracking-[3px] cursor-pointer flex items-center justify-center gap-2.5 mx-auto transition-transform hover:-translate-y-0.5"
            style={{
              fontFamily: "var(--font-nss), 'Noto Serif SC', serif",
              background: "linear-gradient(120deg, #8f8fae, #6f6f92)",
              boxShadow: "0 12px 28px rgba(111,111,146,0.35)",
            }}>
            开始你的舞蹈旅程 <span>→</span>
          </button>

          <div className="mt-6 text-sm tracking-wider" style={{ color: "#6b5d59" }}>
            在这里，遇见更好的自己。
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="w-[22px] h-px" style={{ backgroundColor: "#c9b8ae" }} />
            <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: "#c98a94" }} />
            <span className="w-[22px] h-px" style={{ backgroundColor: "#c9b8ae" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
