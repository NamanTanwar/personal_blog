import type { Metadata } from "next";
import { getPosts, getTags } from "@/lib/api";
import { PostCard } from "@/components/blog/PostCard";
import { TagFilter } from "@/components/blog/TagFilter";
import { Pagination } from "@/components/blog/Pagination";

export const metadata: Metadata = {
    title: "Blog",
    description:
        "All posts on security, systems programming, Rust, and automotive software.",
};

interface BlogPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
    const params = await searchParams;
    const currentPage = Number(params.page) || 1;
    const activeTag = typeof params.tag === "string" ? params.tag : null;
    const perPage = 10;

    let posts: Awaited<ReturnType<typeof getPosts>> = {
        posts: [],
        total: 0,
        page: 1,
        per_page: perPage,
    };
    let tags: Awaited<ReturnType<typeof getTags>> = { tags: [] };

    try {
        [posts, tags] = await Promise.all([
            getPosts({ page: currentPage, per_page: perPage, tag: activeTag || undefined }),
            getTags(),
        ]);
    } catch {
        // Backend might not be running
    }

    const totalPages = Math.ceil(posts.total / perPage);

    return (
        <div className="max-w-container mx-auto px-8">
            <div className="py-12 pb-20">
                {/* Page title */}
                <h1
                    className="font-heading m-0 mb-7"
                    style={{ fontSize: "36px" }}
                >
                    All Posts
                </h1>

                {/* Tag filter bar */}
                {tags.tags.length > 0 && (
                    <div className="mb-9">
                        <TagFilter tags={tags.tags} activeTag={activeTag} />
                    </div>
                )}

                {/* Post list */}
                {posts.posts.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {posts.posts.map((post) => (
                            <PostCard key={post.id} post={post} variant="expanded" />
                        ))}
                    </div>
                ) : (
                    <div
                        className="text-center py-16"
                        style={{
                            background: "var(--color-surface)",
                            borderRadius: "20px",
                        }}
                    >
                        <p
                            className="m-0 mb-2 font-heading text-lg"
                            style={{ color: "var(--color-text)" }}
                        >
                            {activeTag ? `No posts tagged "${activeTag}"` : "No posts yet"}
                        </p>
                        <p
                            className="m-0"
                            style={{
                                fontSize: "14px",
                                color: "var(--color-neutral-500)",
                            }}
                        >
                            {activeTag
                                ? "Try a different tag or view all posts."
                                : "Start your Rust backend and create your first post."}
                        </p>
                    </div>
                )}

                {/* Pagination */}
                <Pagination currentPage={currentPage} totalPages={totalPages} />
            </div>
        </div>
    );
}
