"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { useEffect } from "react";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { initPrivacyProtection } from "@/utils/privacyProtection";
import WatermarkOverlay from "@/components/WatermarkOverlay";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initPrivacyProtection();
  }, []);

  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen`}>
        <WatermarkOverlay />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}