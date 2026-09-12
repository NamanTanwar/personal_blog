import type { Metadata } from "next";
import { getPosts, getTags } from "@/lib/api";
import { PostCard } from "@/components/blog/PostCard";
import { TagFilter } from "@/components/blog/TagFilter";
import { Pagination } from "@/components/blog/Pagination";

export const metadata: Metadata = {
    title: "Blog",
    description: "All posts on security, systems programming, Rust, and automotive software.",
};

interface BlogPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
    const params = await searchParams;
    const currentPage = Number(params.page) || 1;
    const activeTag = typeof params.tag === "string" ? params.tag : null;
    const perPage = 10;

    let posts: Awaited<ReturnType<typeof getPosts>> = { posts: [], total: 0, page: 1, per_page: perPage };
    let tags: Awaited<ReturnType<typeof getTags>> = { tags: [] };

    try {
        [posts, tags] = await Promise.all([
            getPosts({ page: currentPage, per_page: perPage, tag: activeTag || undefined }),
            getTags(),
        ]);
    } catch { }

    const totalPages = Math.ceil(posts.total / perPage);

    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px" }}>
            <div style={{ padding: "48px 0 80px" }}>
                <h1 className="m-0" style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "32px" }}>
                    All Posts
                </h1>

                {tags.tags.length > 0 && (
                    <div style={{ marginBottom: "40px" }}>
                        <TagFilter tags={tags.tags} activeTag={activeTag} />
                    </div>
                )}

                {posts.posts.length > 0 ? (
                    <div className="flex flex-col" style={{ gap: "12px" }}>
                        {posts.posts.map((post) => (
                            <PostCard key={post.id} post={post} variant="expanded" />
                        ))}
                    </div>
                ) : (
                    <div className="text-center" style={{ background: "var(--surface)", borderRadius: "8px", padding: "64px 32px", border: "1px solid var(--border-card)" }}>
                        <p className="m-0 mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                            {activeTag ? `No posts tagged "${activeTag}"` : "No posts yet"}
                        </p>
                        <p className="m-0" style={{ fontSize: "14px", color: "var(--muted)" }}>
                            {activeTag ? "Try a different tag or view all posts." : "Start your Rust backend and create your first post."}
                        </p>
                    </div>
                )}

                <Pagination currentPage={currentPage} totalPages={totalPages} />
            </div>
        </div>
    );
}
