import Link from "next/link";
import { getPosts } from "@/lib/api";
import { PostCard } from "@/components/blog/PostCard";
import type { Post } from "@/lib/types";

export const revalidate = 60;

export default async function Home() {
  let recentPosts: Post[] = [];

  try {
    const data = await getPosts({ per_page: 4 });
    recentPosts = data.posts;
  } catch {
    // Backend might not be running
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px" }}>
      {/* Hero */}
      <div style={{ padding: "100px 0 72px" }}>
        <p className="m-0" style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--accent)", marginBottom: "20px", letterSpacing: "0.02em", opacity: 0.7 }}>
          ~/blog $
        </p>
        <h1 className="m-0" style={{ fontFamily: "var(--font-mono)", fontSize: "48px", fontWeight: 700, lineHeight: "1.1", marginBottom: "24px", letterSpacing: "-0.04em" }}>
          The Syntax Syndicate
        </h1>
        <p className="m-0" style={{ fontSize: "20px", lineHeight: "1.6", color: "var(--muted)", maxWidth: "560px", marginBottom: "20px" }}>
          Writing about the things that break and the things that don&apos;t
          <span className="inline-block animate-blink" style={{ width: "2px", height: "20px", background: "var(--accent)", marginLeft: "4px", verticalAlign: "text-bottom" }} />
        </p>
        <p className="m-0" style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--muted)", letterSpacing: "0.06em", opacity: 0.5 }}>
          Security · Systems · Rust · Distributed Systems
        </p>
      </div>

      {/* Recent Posts */}
      <div style={{ paddingBottom: "80px" }}>
        <div className="flex items-baseline justify-between" style={{ marginBottom: "32px" }}>
          <h2 className="m-0" style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "-0.02em" }}>Recent Posts</h2>
          <Link href="/blog" className="no-underline" style={{ fontSize: "13px", fontWeight: 500, color: "var(--accent)" }}>View all →</Link>
        </div>

        {recentPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "16px" }}>
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} variant="compact" />
            ))}
          </div>
        ) : (
          <div className="text-center" style={{ background: "var(--surface)", borderRadius: "8px", padding: "64px 32px", border: "1px solid var(--border-card)" }}>
            <p className="m-0 mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>No posts yet</p>
            <p className="m-0" style={{ fontSize: "14px", color: "var(--muted)" }}>Start your Rust backend and create your first post.</p>
          </div>
        )}
      </div>
    </div>
  );
}
