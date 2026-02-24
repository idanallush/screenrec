"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { TagBadge } from "@/components/ui/tag-badge";
import type { TagWithCount } from "@/lib/types";

interface TagFilterProps {
  tags: TagWithCount[];
  activeTag?: string;
}

export function TagFilter({ tags, activeTag }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="mb-4">
      {activeTag && (
        <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm text-muted">Filtered by:</span>
          <span className="text-sm font-medium">{activeTag}</span>
          <Link
            href="/dashboard"
            className="ml-auto text-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </Link>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={
              activeTag === tag.name ? "/dashboard" : `/dashboard?tag=${encodeURIComponent(tag.name)}`
            }
          >
            <TagBadge
              tag={tag}
              size="md"
              active={activeTag === tag.name}
              onClick={() => {}}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
