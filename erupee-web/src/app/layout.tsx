"use client";

import { useEffect } from "react";
import "./globals.css";
import { initPrivacyProtection } from "@/utils/privacyProtection";
import WatermarkOverlay from "@/components/WatermarkOverlay";

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
      <body className="min-h-screen">
        <WatermarkOverlay />
        {children}
      </body>
    </html>
  );
}
