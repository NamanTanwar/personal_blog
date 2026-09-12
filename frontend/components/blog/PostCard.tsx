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
        <Link href={`/blog/${post.slug}`} className="block no-underline">
            <div
                className="post-card h-full"
                style={{ padding: "24px" }}
            >
                {/* Title */}
                <h3
                    className="m-0 mb-2"
                    style={{
                        fontSize: isExpanded ? "18px" : "16px",
                        lineHeight: isExpanded ? "1.3" : "1.4",
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        color: "var(--text)",
                    }}
                >
                    {post.title}
                </h3>

                {/* Description */}
                <p
                    className="m-0 mb-4"
                    style={{
                        fontSize: "14px",
                        lineHeight: "1.6",
                        color: "var(--muted)",
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
                            style={{
                                fontSize: "12px",
                                color: "var(--muted)",
                                opacity: 0.6,
                                fontFamily: "var(--font-mono)",
                            }}
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
                            style={{
                                fontSize: "12px",
                                color: "var(--muted)",
                                opacity: 0.6,
                                fontFamily: "var(--font-mono)",
                            }}
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
