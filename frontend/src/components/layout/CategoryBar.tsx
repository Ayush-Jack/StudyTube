"use client";
import { useCategoryStore } from "@/store";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────
interface CategoryBarProps {
  onCategoryChange?: (category: string) => void;
}

// ── Categories (matches StudyTube domains) ───────────────────────
const CATEGORIES: string[] = [
  "All",
  "Engineering",
  "Medical",
  "Law",
  "Science",
  "Mathematics",
  "Commerce",
  "UPSC",
  "JEE/NEET",
  "Programming",
];

// ── Component ────────────────────────────────────────────────────
export function CategoryBar({ onCategoryChange }: CategoryBarProps) {
  const { activeCategory, setActiveCategory } = useCategoryStore();

  const handleClick = (category: string) => {
    setActiveCategory(category);
    onCategoryChange?.(category);
  };

  return (
    <div
      className="
        sticky top-[60px] z-40 flex items-center h-[52px] px-4 gap-2
        overflow-x-auto scrollbar-none
        bg-[#0e0e12]/65 light:bg-[#f0f2f8]/70
        backdrop-blur-lg saturate-[140%]
        border-b border-white/[0.04] light:border-[rgba(200,210,235,0.25)]
      "
    >
      {CATEGORIES.map((category) => {
        const isActive = activeCategory === category;
        return (
          <button
            key={category}
            id={`category-pill-${category.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
            onClick={() => handleClick(category)}
            className={cn("chip shrink-0", isActive && "active")}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}

// Default export for convenience
export default CategoryBar;
