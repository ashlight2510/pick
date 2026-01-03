import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FunnyPick | 오늘 뭐 볼까?",
  description: "평점·접근성·분위기로 실패 없는 선택",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    images: [
      {
        url: "https://dummyimage.com/1200x630/1f2937/f9fafb&text=OTT PICK",
        width: 1200,
        height: 630,
        alt: "OTT PICK",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1204894220949193" crossOrigin="anonymous"></script>
      </head>
      <body className="bg-white text-gray-900">{children}</body>
    </html>
  );
}
