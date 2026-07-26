"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Tag } from "@/lib/types";
import { getTagColorClass } from "@/lib/types";

interface TagFilterProps {
    tags: Tag[];
    activeTag: string | null;
}

export function TagFilter({ tags, activeTag }: TagFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    function handleTagClick(tagName: string | null) {
        const params = new URLSearchParams(searchParams.toString());

        if (tagName === null || tagName === activeTag) {
            // Clear filter
            params.delete("tag");
        } else {
            params.set("tag", tagName);
        }

        // Reset to page 1 when changing filter
        params.delete("page");

        const query = params.toString();
        router.push(`/blog${query ? `?${query}` : ""}`);
    }

    const isAllActive = activeTag === null;

    return (
        <div className="flex gap-2 flex-wrap items-center">
            {/* "All" button */}
            <button
                onClick={() => handleTagClick(null)}
                className="tag-filter-btn"
                style={{
                    background: "var(--color-neutral-200)",
                    color: "var(--color-neutral-700)",
                    boxShadow: isAllActive ? "0 0 0 2px var(--color-accent)" : "none",
                    opacity: isAllActive ? 1 : 0.8,
                }}
            >
                All
            </button>

            {/* Tag buttons */}
            {tags.map((tag) => {
                const isActive = tag.name === activeTag;
                return (
                    <button
                        key={tag.name}
                        onClick={() => handleTagClick(tag.name)}
                        className={`tag-filter-btn tag ${getTagColorClass(tag.name)}`}
                        style={{
                            boxShadow: isActive ? "0 0 0 2px var(--color-accent)" : "none",
                            opacity: isActive ? 1 : 0.8,
                        }}
                    >
                        {tag.name} ({tag.count})
                    </button>
                );
            })}
        </div>
    );
}
