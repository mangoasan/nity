import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nity — Студия йоги в Астане",
  description: "Nity — премиальная студия йоги в Астане. Расписание занятий, запись к мастерам, персональные тренировки.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
