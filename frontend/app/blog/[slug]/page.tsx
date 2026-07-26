import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPosts } from "@/lib/api";
import { formatDate, readingTimeLabel, getTagColorClass } from "@/lib/types";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { CodeBlockEnhancer } from "@/components/blog/CodeBlockEnhancer";
import { PostCard } from "@/components/blog/PostCard";
import { ApiClientError } from "@/lib/api";
import { ChevronRight } from "lucide-react";

interface PostPageProps {
    params: Promise<{ slug: string }>;
}

// Dynamic metadata for SEO
export async function generateMetadata({
    params,
}: PostPageProps): Promise<Metadata> {
    const { slug } = await params;

    try {
        const post = await getPost(slug);
        return {
            title: post.title,
            description: post.description,
            openGraph: {
                title: post.title,
                description: post.description,
                type: "article",
                publishedTime: post.created_at,
                tags: post.tags,
            },
        };
    } catch {
        return { title: "Post Not Found" };
    }
}

export default async function PostPage({ params }: PostPageProps) {
    const { slug } = await params;

    let post;
    try {
        post = await getPost(slug);
    } catch (error) {
        if (error instanceof ApiClientError && error.status === 404) {
            notFound();
        }
        throw error;
    }

    // Fetch related posts (same tag, excluding current post)
    let relatedPosts: Awaited<ReturnType<typeof getPosts>>["posts"] = [];
    try {
        if (post.tags.length > 0) {
            const data = await getPosts({ per_page: 4, tag: post.tags[0] });
            relatedPosts = data.posts
                .filter((p) => p.slug !== post.slug)
                .slice(0, 3);
        }
    } catch {
        // Not critical — page works without related posts
    }

    return (
        <div className="max-w-container mx-auto px-8">
            <div className="py-10 pb-20">
                {/* Breadcrumb */}
                <div
                    className="flex items-center gap-1 mb-8"
                    style={{ fontSize: "13px", color: "var(--color-neutral-500)" }}
                >
                    <Link
                        href="/blog"
                        className="no-underline hover:underline"
                        style={{ color: "var(--color-neutral-500)" }}
                    >
                        Blog
                    </Link>
                    <ChevronRight size={14} />
                    <span
                        style={{
                            color: "var(--color-text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "300px",
                        }}
                    >
                        {post.title}
                    </span>
                </div>

                {/* Two-column layout */}
                <div className="post-layout">
                    {/* TOC sidebar — hidden on mobile */}
                    <aside className="post-sidebar hidden lg:block">
                        <div className="sticky" style={{ top: "80px" }}>
                            <TableOfContents />
                        </div>
                    </aside>

                    {/* Article */}
                    <article className="post-article">
                        {/* Title */}
                        <h1
                            className="font-heading font-bold m-0 mb-4"
                            style={{
                                fontSize: "38px",
                                lineHeight: "1.15",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {post.title}
                        </h1>

                        {/* Metadata bar */}
                        <div
                            className="flex items-center gap-3 flex-wrap mb-10"
                            style={{ fontSize: "14px", color: "var(--color-neutral-500)" }}
                        >
                            <span>{formatDate(post.created_at)}</span>
                            <span style={{ opacity: 0.3 }}>·</span>
                            <span>{readingTimeLabel(post.reading_time_mins)}</span>
                            <span style={{ opacity: 0.3 }}>·</span>
                            <div className="flex gap-1.5">
                                {post.tags.map((tag) => (
                                    <Link
                                        key={tag}
                                        href={`/blog?tag=${tag}`}
                                        className="no-underline"
                                    >
                                        <span className={`tag ${getTagColorClass(tag)}`}>
                                            {tag}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Article content */}
                        <div
                            className="prose"
                            dangerouslySetInnerHTML={{ __html: post.content_html || "" }}
                        />

                        {/* Code block enhancer — attaches copy buttons */}
                        <CodeBlockEnhancer />
                    </article>
                </div>

                {/* Related posts */}
                {relatedPosts.length > 0 && (
                    <div className="mt-16">
                        <div
                            className="mb-8"
                            style={{
                                borderTop: "1px solid var(--color-divider)",
                                paddingTop: "40px",
                            }}
                        >
                            <h2
                                className="font-heading m-0 mb-6"
                                style={{ fontSize: "22px" }}
                            >
                                Related Posts
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {relatedPosts.map((relatedPost) => (
                                    <PostCard
                                        key={relatedPost.id}
                                        post={relatedPost}
                                        variant="compact"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
