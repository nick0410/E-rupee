import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "eRupeeX — Digital Currency Platform",
  description: "Your Digital Currency Platform powered by Blockchain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
