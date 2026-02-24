"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Library", icon: LayoutDashboard },
  { href: "/record", label: "New Recording", icon: Circle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-border bg-surface p-3 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            )}
          >
            <item.icon
              className={cn(
                "w-5 h-5",
                item.href === "/record" && "fill-current text-red-500"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
