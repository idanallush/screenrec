"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { TagBadge } from "./tag-badge";
import { TagIcon } from "./tag-icon";
import { TAG_COLORS } from "@/lib/constants";
import type { Tag } from "@/lib/types";

interface TagInputProps {
  existingTags: Tag[];
  selectedTags: Tag[];
  onAddTag: (tagId: string) => void;
  onCreateTag: (name: string, color: string) => Promise<Tag | null>;
  onRemoveTag: (tagId: string) => void;
}

export function TagInput({
  existingTags,
  selectedTags,
  onAddTag,
  onCreateTag,
  onRemoveTag,
}: TagInputProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedIds = new Set(selectedTags.map((t) => t.id));

  const suggestions = existingTags.filter(
    (t) =>
      !selectedIds.has(t.id) &&
      t.name.toLowerCase().includes(query.toLowerCase())
  );

  const showCreateOption =
    query.trim() &&
    !existingTags.some(
      (t) => t.name.toLowerCase() === query.trim().toLowerCase()
    );

  const handleSelect = useCallback(
    (tagId: string) => {
      onAddTag(tagId);
      setQuery("");
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [onAddTag]
  );

  const handleCreate = useCallback(async () => {
    const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
    const tag = await onCreateTag(query.trim(), color);
    if (tag) {
      onAddTag(tag.id);
    }
    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [query, onCreateTag, onAddTag]);

  // Close suggestions on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedTags.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              size="sm"
              onRemove={() => onRemoveTag(tag.id)}
            />
          ))}
        </div>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder="Search or create tag..."
        className="w-full px-2.5 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
      />

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || showCreateOption) && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg py-1 z-50 max-h-40 overflow-y-auto animate-dropdown-enter">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-surface-hover flex items-center gap-2 cursor-pointer transition-colors duration-150"
              onClick={() => handleSelect(tag.id)}
            >
              <TagIcon
                icon={tag.icon}
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: tag.color }}
              />
              {tag.name}
            </button>
          ))}
          {showCreateOption && (
            <button
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-surface-hover flex items-center gap-2 cursor-pointer text-primary transition-colors duration-150"
              onClick={handleCreate}
            >
              <Plus className="w-3.5 h-3.5" />
              Create &quot;{query.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
