"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, Circle, Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TagWithCount } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Library", icon: LayoutDashboard },
  { href: "/record", label: "New Recording", icon: Circle },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag") || undefined;
  const [tags, setTags] = useState<TagWithCount[]>([]);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then(setTags)
      .catch(() => {});
  }, [pathname, activeTag]);

  return (
    <aside className="w-56 border-r border-border bg-surface p-3 flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href && !activeTag;
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

      {/* Tags section */}
      {tags.length > 0 && (
        <>
          <div className="border-t border-border my-2" />
          <div className="px-3 py-1">
            <span className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-1.5">
              <TagIcon className="w-3 h-3" />
              Tags
            </span>
          </div>
          {tags.map((tag) => {
            const isActive = activeTag === tag.name;
            return (
              <Link
                key={tag.id}
                href={
                  isActive
                    ? "/dashboard"
                    : `/dashboard?tag=${encodeURIComponent(tag.name)}`
                }
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted hover:text-foreground hover:bg-surface-hover"
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="truncate flex-1">{tag.name}</span>
                <span className="text-xs opacity-60">{tag.count}</span>
              </Link>
            );
          })}
        </>
      )}
    </aside>
  );
}
