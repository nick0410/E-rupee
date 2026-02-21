"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { WalletProvider } from "@/context/WalletContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-400 ${
      isDark ? "bg-[#060A13]" : "bg-[#f8fafc]"
    }`}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />
        <main className={`flex-1 overflow-y-auto p-6 transition-colors duration-400 ${
          isDark
            ? "bg-gradient-to-b from-[#060A13] via-[#0B1120] to-[#0F172A]"
            : "bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]"
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <WalletProvider>
        <DashboardShell>{children}</DashboardShell>
      </WalletProvider>
    </ThemeProvider>
  );
}
