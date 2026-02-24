"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  align?: "left" | "right";
}

export function DropdownMenu({
  open,
  onClose,
  triggerRef,
  children,
  align = "right",
}: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !menuRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const menu = menuRef.current.getBoundingClientRect();
    const padding = 8;

    let top = trigger.bottom + 4;
    let left =
      align === "right"
        ? trigger.right - menu.width
        : trigger.left;

    // Keep within viewport
    if (top + menu.height > window.innerHeight - padding) {
      top = trigger.top - menu.height - 4;
    }
    if (left < padding) left = padding;
    if (left + menu.width > window.innerWidth - padding) {
      left = window.innerWidth - menu.width - padding;
    }

    setPosition({ top, left });
  }, [triggerRef, align]);

  useEffect(() => {
    if (!open) return;
    // Initial position after first render
    requestAnimationFrame(updatePosition);

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Invisible backdrop to catch outside clicks */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 w-44 bg-background border border-border rounded-lg shadow-lg py-1 animate-dropdown-enter"
        style={{ top: position.top, left: position.left }}
      >
        {children}
      </div>
    </>,
    document.body
  );
}

interface DropdownItemProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  variant?: "default" | "danger";
}

export function DropdownItem({
  onClick,
  icon,
  label,
  variant = "default",
}: DropdownItemProps) {
  return (
    <button
      className={cn(
        "w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 cursor-pointer transition-colors duration-150",
        variant === "danger"
          ? "text-red-500 hover:bg-red-500/10"
          : "hover:bg-surface-hover"
      )}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
