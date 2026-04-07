"use client";

import { usePathname } from "next/navigation";
import "./layout.css";

export function Header() {
  const pathname = usePathname();

  let title = "Dashboard";
  if (pathname.includes("/stores")) title = "Stores";

  return (
    <header className="top-header">
      <div className="header-left">
        <h2 className="header-title">{title}</h2>
      </div>
      <div className="header-right">
        {/* Quick actions will go here */}
      </div>
    </header>
  );
}
