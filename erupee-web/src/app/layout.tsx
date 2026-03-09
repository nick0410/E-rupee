import "./globals.css";
import dynamic from "next/dynamic";

const WatermarkOverlay = dynamic(() => import("@/components/WatermarkOverlay"), { ssr: false });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <WatermarkOverlay />
        {children}
      </body>
    </html>
  );
}
