"use client";

import { usePathname } from "next/navigation";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

type AppChromeProps = {
  children: React.ReactNode;
};

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const isGmailLab = pathname.startsWith("/gmail-lab");

  if (isGmailLab) {
    return <>{children}</>;
  }

  return (
    <div className="page-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="content-inner">{children}</main>
      </div>
    </div>
  );
}
