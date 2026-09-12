"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Tag } from "@/lib/types";

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
            params.delete("tag");
        } else {
            params.set("tag", tagName);
        }
        params.delete("page");
        const query = params.toString();
        router.push(`/blog${query ? `?${query}` : ""}`);
    }

    const isAllActive = activeTag === null;

    return (
        <div className="flex gap-2 flex-wrap items-center">
            <button
                onClick={() => handleTagClick(null)}
                className="tag-filter-btn"
                style={{
                    border: `1px solid ${isAllActive ? "var(--accent)" : "var(--tag-dim)"}`,
                    color: isAllActive ? "var(--accent)" : "var(--muted)",
                    background: isAllActive ? "var(--accent-dim)" : "transparent",
                }}
            >
                All
            </button>
            {tags.map((tag) => {
                const isActive = tag.name === activeTag;
                return (
                    <button
                        key={tag.name}
                        onClick={() => handleTagClick(tag.name)}
                        className="tag-filter-btn"
                        style={{
                            border: `1px solid ${isActive ? "var(--accent)" : "var(--tag-dim)"}`,
                            color: isActive ? "var(--accent)" : "var(--muted)",
                            background: isActive ? "var(--accent-dim)" : "transparent",
                        }}
                    >
                        {tag.name} ({tag.count})
                    </button>
                );
            })}
        </div>
    );
}
