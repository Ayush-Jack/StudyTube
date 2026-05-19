"use client";
import { CATEGORY_CHIPS } from "@/lib/mock-data";
import { useCategoryStore } from "@/store";
import { cn } from "@/lib/utils";

export default function CategoryChips() {
  const { activeCategory, setActiveCategory } = useCategoryStore();

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar py-3 px-1">
      {CATEGORY_CHIPS.map((chip) => (
        <button
          key={chip}
          onClick={() => setActiveCategory(chip)}
          className={cn(
            "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
            activeCategory === chip
              ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
              : "bg-[var(--chip-bg)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          )}>
          {chip}
        </button>
      ))}
    </div>
  );
}
