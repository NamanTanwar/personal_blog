"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    if (totalPages <= 1) return null;

    function handlePageClick(page: number) {
        const params = new URLSearchParams(searchParams.toString());

        if (page === 1) {
            params.delete("page");
        } else {
            params.set("page", String(page));
        }

        const query = params.toString();
        router.push(`/blog${query ? `?${query}` : ""}`);
    }

    return (
        <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isActive = page === currentPage;
                return (
                    <button
                        key={page}
                        onClick={() => handlePageClick(page)}
                        className="pagination-btn"
                        style={{
                            background: isActive ? "var(--color-accent)" : "transparent",
                            color: isActive ? "var(--color-bg)" : "var(--color-neutral-600)",
                            fontWeight: isActive ? 600 : 400,
                        }}
                    >
                        {page}
                    </button>
                );
            })}
        </div>
    );
}
