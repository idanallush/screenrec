"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { LayoutDashboard, Circle, Tag as LucideTag, Settings2 } from "lucide-react";
import { TagIcon } from "@/components/ui/tag-icon";
import { ManageTagsDialog } from "@/components/dashboard/manage-tags-dialog";
import { cn } from "@/lib/utils";
import type { TagWithCount } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Library", icon: LayoutDashboard },
  { href: "/record", label: "New Recording", icon: Circle },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTag = searchParams.get("tag") || undefined;
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [showManage, setShowManage] = useState(false);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then(setTags)
      .catch(() => {});
  }, [pathname, activeTag]);

  function handleTagsChange(newTags: TagWithCount[]) {
    setTags(newTags);
    // If the active tag was deleted/renamed, redirect to dashboard
    if (activeTag && !newTags.find((t) => t.name === activeTag)) {
      router.push("/dashboard");
    }
    router.refresh();
  }

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
      <div className="border-t border-border my-2" />
      <div className="px-3 py-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-1.5">
          <LucideTag className="w-3 h-3" />
          Tags
        </span>
        <button
          onClick={() => setShowManage(true)}
          className="p-0.5 rounded hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
          title="Manage tags"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {tags.length === 0 ? (
        <button
          onClick={() => setShowManage(true)}
          className="mx-3 px-3 py-2 text-xs text-muted hover:text-foreground border border-dashed border-border hover:border-primary/30 rounded-lg transition-colors text-center"
        >
          + Create a tag
        </button>
      ) : (
        tags.map((tag) => {
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
              <TagIcon
                icon={tag.icon}
                className="w-4 h-4 shrink-0"
                style={{ color: tag.color }}
              />
              <span className="truncate flex-1">{tag.name}</span>
              <span className="text-xs opacity-60">{tag.count}</span>
            </Link>
          );
        })
      )}

      {/* Manage Tags Dialog */}
      <ManageTagsDialog
        open={showManage}
        onClose={() => setShowManage(false)}
        tags={tags}
        onTagsChange={handleTagsChange}
      />
    </aside>
  );
}
