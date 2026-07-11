import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  ZCOOL_KuaiLe,
  Ma_Shan_Zheng,
  Noto_Sans_SC,
  Noto_Serif_SC,
  Cormorant_Garamond,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const zcoolKuaile = ZCOOL_KuaiLe({
  variable: "--font-zk",
  weight: "400",
  subsets: ["latin"],
});

const maShanZheng = Ma_Shan_Zheng({
  variable: "--font-msz",
  weight: "400",
  subsets: ["latin"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto",
  weight: "900",
  subsets: ["latin"],
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-nss",
  weight: "600",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cg",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "韵影录",
  description: "用记录，让每一次起舞都有回响",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`
        ${geistSans.variable}
        ${geistMono.variable}
        ${zcoolKuaile.variable}
        ${maShanZheng.variable}
        ${notoSansSC.variable}
        ${notoSerifSC.variable}
        ${cormorantGaramond.variable}
        h-full antialiased
      `}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
