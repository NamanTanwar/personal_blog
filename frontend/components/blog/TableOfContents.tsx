"use client";

import { useEffect, useState } from "react";

interface TocItem {
    id: string;
    text: string;
    level: number;
}

export function TableOfContents() {
    const [headings, setHeadings] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string>("");

    useEffect(() => {
        const article = document.querySelector(".prose");
        if (!article) return;
        const elements = article.querySelectorAll("h2, h3");
        const items: TocItem[] = Array.from(elements)
            .filter((el) => el.id)
            .map((el) => ({
                id: el.id,
                text: el.textContent || "",
                level: el.tagName === "H2" ? 2 : 3,
            }));
        setHeadings(items);
    }, []);

    useEffect(() => {
        if (headings.length === 0) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length > 0) setActiveId(visible[0].target.id);
            },
            { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
        );
        headings.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [headings]);

    if (headings.length === 0) return null;

    return (
        <nav>
            <div
                style={{
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginBottom: "16px",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                }}
            >
                On this page
            </div>
            <div className="flex flex-col" style={{ gap: "2px" }}>
                {headings.map((heading) => {
                    const isActive = heading.id === activeId;
                    return (
                        <a
                            key={heading.id}
                            href={`#${heading.id}`}
                            className="toc-link block no-underline transition-colors"
                            style={{
                                padding: "6px 12px",
                                paddingLeft: heading.level === 3 ? "24px" : "16px",
                                borderLeft: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
                                fontSize: heading.level === 3 ? "13px" : "14px",
                                color: isActive ? "var(--accent)" : "var(--muted)",
                                fontWeight: isActive ? 600 : 400,
                            }}
                        >
                            {heading.text}
                        </a>
                    );
                })}
            </div>
        </nav>
    );
}
