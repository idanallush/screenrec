"use client";

import {
  Tag,
  Star,
  Heart,
  Bookmark,
  Flag,
  Zap,
  Flame,
  Trophy,
  Gem,
  Crown,
  Music,
  Camera,
  Film,
  Gamepad2,
  Briefcase,
  GraduationCap,
  Code,
  Bug,
  Rocket,
  Lightbulb,
  Megaphone,
  Users,
  Globe,
  Shield,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

const iconMap: Record<string, ComponentType<LucideProps>> = {
  tag: Tag,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  flag: Flag,
  zap: Zap,
  flame: Flame,
  trophy: Trophy,
  gem: Gem,
  crown: Crown,
  music: Music,
  camera: Camera,
  film: Film,
  "gamepad-2": Gamepad2,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  code: Code,
  bug: Bug,
  rocket: Rocket,
  lightbulb: Lightbulb,
  megaphone: Megaphone,
  users: Users,
  globe: Globe,
  shield: Shield,
};

interface TagIconProps extends LucideProps {
  icon: string;
}

export function TagIcon({ icon, ...props }: TagIconProps) {
  const Icon = iconMap[icon] || Tag;
  return <Icon {...props} />;
}

export { iconMap };
