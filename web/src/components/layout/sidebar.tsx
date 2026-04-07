"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./layout.css";

const navItems = [
  { name: "Dashboard", path: "/" },
  { name: "Stores", path: "/stores" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Sellora</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
