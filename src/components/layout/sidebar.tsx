"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { LayoutDashboard, Circle, Tag as TagIcon, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
  const [deleteTarget, setDeleteTarget] = useState<TagWithCount | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then(setTags)
      .catch(() => {});
  }, [pathname, activeTag]);

  async function handleDeleteTag() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/tags/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      setTags((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success(`Tag "${deleteTarget.name}" deleted`);
      if (activeTag === deleteTarget.name) {
        router.push("/dashboard");
      }
      router.refresh();
    } else {
      toast.error("Failed to delete tag");
    }
    setDeleting(false);
    setDeleteTarget(null);
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
              <div key={tag.id} className="group/tag flex items-center">
                <Link
                  href={
                    isActive
                      ? "/dashboard"
                      : `/dashboard?tag=${encodeURIComponent(tag.name)}`
                  }
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors flex-1 min-w-0",
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
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteTarget(tag);
                  }}
                  className="opacity-0 group-hover/tag:opacity-100 p-1 mr-1 rounded hover:bg-red-500/10 hover:text-red-500 text-muted transition-all duration-150 shrink-0"
                  title={`Delete tag "${tag.name}"`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={handleDeleteTag}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Tag"
        description={`Are you sure you want to delete the tag "${deleteTarget?.name}"? It will be removed from all recordings.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </aside>
  );
}
