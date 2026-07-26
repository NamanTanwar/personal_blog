import Link from "next/link";
import type { Post } from "@/lib/types";
import { formatDate, readingTimeLabel, getTagColorClass } from "@/lib/types";

interface PostCardProps {
    post: Post;
    variant?: "compact" | "expanded";
}

export function PostCard({ post, variant = "compact" }: PostCardProps) {
    const isExpanded = variant === "expanded";

    return (
        <Link href={`/blog/${post.slug}`} className="block no-underline group">
            <div
                className="post-card h-full transition-all duration-200"
                style={{
                    padding: isExpanded ? "28px" : "24px",
                }}
            >
                {/* Title */}
                <h3
                    className="font-heading font-bold m-0 mb-2"
                    style={{
                        fontSize: isExpanded ? "22px" : "19px",
                        lineHeight: "1.3",
                        color: "var(--color-text)",
                    }}
                >
                    {post.title}
                </h3>

                {/* Description */}
                <p
                    className="m-0 mb-4"
                    style={{
                        fontSize: isExpanded ? "15px" : "14px",
                        lineHeight: isExpanded ? "1.7" : "1.65",
                        color: "var(--color-neutral-600)",
                        display: "-webkit-box",
                        WebkitLineClamp: isExpanded ? 3 : 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                >
                    {post.description}
                </p>

                {/* Bottom row */}
                {isExpanded ? (
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div
                            className="flex items-center gap-1.5"
                            style={{ fontSize: "13px", color: "var(--color-neutral-500)" }}
                        >
                            <span>{formatDate(post.created_at)}</span>
                            <span style={{ opacity: 0.4 }}>·</span>
                            <span>{readingTimeLabel(post.reading_time_mins)}</span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {post.tags.map((tag) => (
                                <span key={tag} className={`tag ${getTagColorClass(tag)}`}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div
                            className="flex items-center gap-1.5 mb-3"
                            style={{ fontSize: "12px", color: "var(--color-neutral-500)" }}
                        >
                            <span>{formatDate(post.created_at)}</span>
                            <span style={{ opacity: 0.4 }}>·</span>
                            <span>{readingTimeLabel(post.reading_time_mins)}</span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {post.tags.map((tag) => (
                                <span key={tag} className={`tag ${getTagColorClass(tag)}`}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </Link>
    );
}