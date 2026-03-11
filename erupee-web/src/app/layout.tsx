import type { Metadata } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const WatermarkOverlay = dynamic(() => import("@/components/WatermarkOverlay"), { ssr: false });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen`}>
        <WatermarkOverlay />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}