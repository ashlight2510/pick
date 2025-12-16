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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-white text-gray-900">{children}</body>
    </html>
  );
}
