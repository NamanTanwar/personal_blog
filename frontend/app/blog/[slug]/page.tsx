import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPosts } from "@/lib/api";
import { formatDate, readingTimeLabel, getTagColorClass } from "@/lib/types";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { CodeBlockEnhancer } from "@/components/blog/CodeBlockEnhancer";
import { PostCard } from "@/components/blog/PostCard";
import { ApiClientError } from "@/lib/api";
import { BlogPostJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";

interface PostPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
    const { slug } = await params;
    try {
        const post = await getPost(slug);
        return {
            title: post.title,
            description: post.description,
            keywords: post.tags.join(", "),
            authors: [{ name: "Naman Tanwar", url: "https://etherbot.in" }],
            openGraph: {
                title: post.title,
                description: post.description,
                type: "article",
                publishedTime: post.created_at,
                modifiedTime: post.updated_at,
                authors: ["Naman Tanwar"],
                tags: post.tags,
                url: `https://etherbot.in/blog/${slug}`,
                siteName: "The Syntax Syndicate",
            },
            twitter: {
                card: "summary_large_image",
                title: post.title,
                description: post.description,
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

    let relatedPosts: Awaited<ReturnType<typeof getPosts>>["posts"] = [];
    try {
        if (post.tags.length > 0) {
            const data = await getPosts({ per_page: 4, tag: post.tags[0] });
            relatedPosts = data.posts.filter((p) => p.slug !== post.slug).slice(0, 3);
        }
    } catch { }

    return (
        <>
            <BlogPostJsonLd post={post} />
            <BreadcrumbJsonLd postTitle={post.title} postSlug={post.slug} />
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px" }}>
                <div style={{ padding: "32px 0 80px" }}>
                    {/* Breadcrumb — monospace with / separator */}
                    <div
                        className="flex items-center"
                        style={{
                            gap: "8px",
                            fontSize: "13px",
                            color: "var(--muted)",
                            fontFamily: "var(--font-mono)",
                            marginBottom: "28px",
                        }}
                    >
                        <Link
                            href="/blog"
                            className="no-underline transition-colors"
                            style={{ color: "var(--muted)" }}
                        >
                            blog
                        </Link>
                        <span style={{ opacity: 0.4 }}>/</span>
                        <span style={{ color: "var(--text)", opacity: 0.6 }}>
                            {post.slug}
                        </span>
                    </div>

                    {/* Two-column layout */}
                    <div className="post-layout">
                        {/* TOC sidebar */}
                        <aside className="post-sidebar hidden lg:block">
                            <div className="sticky" style={{ top: "80px", padding: "24px 0" }}>
                                <TableOfContents />
                            </div>
                        </aside>

                        {/* Article */}
                        <article className="post-article">
                            <h1
                                className="m-0"
                                style={{
                                    fontSize: "36px",
                                    lineHeight: "1.15",
                                    letterSpacing: "-0.03em",
                                    fontWeight: 700,
                                    marginBottom: "20px",
                                }}
                            >
                                {post.title}
                            </h1>

                            {/* Metadata */}
                            <div
                                className="flex items-center flex-wrap"
                                style={{
                                    gap: "16px",
                                    fontSize: "13px",
                                    color: "var(--muted)",
                                    marginBottom: "40px",
                                    fontFamily: "var(--font-mono)",
                                }}
                            >
                                <span>{formatDate(post.created_at)}</span>
                                <span style={{ opacity: 0.3 }}>·</span>
                                <span>{readingTimeLabel(post.reading_time_mins)}</span>
                                <span style={{ opacity: 0.3 }}>·</span>
                                <div className="flex" style={{ gap: "6px" }}>
                                    {post.tags.map((tag) => (
                                        <Link key={tag} href={`/blog?tag=${tag}`} className="no-underline">
                                            <span className={`tag ${getTagColorClass(tag)}`}>{tag}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div
                                className="prose"
                                dangerouslySetInnerHTML={{ __html: post.content_html || "" }}
                            />
                            <CodeBlockEnhancer />
                        </article>
                    </div>

                    {/* Related posts */}
                    {relatedPosts.length > 0 && (
                        <div style={{ borderTop: "1px solid var(--border)", marginTop: "64px", paddingTop: "40px" }}>
                            <h3
                                className="m-0"
                                style={{
                                    fontSize: "16px",
                                    fontWeight: 600,
                                    letterSpacing: "-0.01em",
                                    marginBottom: "20px",
                                }}
                            >
                                Related Posts
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "12px" }}>
                                {relatedPosts.map((rp) => (
                                    <PostCard key={rp.id} post={rp} variant="compact" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
