import Link from "next/link";
import { getPosts } from "@/lib/api";
import { PostCard } from "@/components/blog/PostCard";

export default async function Home() {
  let recentPosts = [];

  try {
    const data = await getPosts({ per_page: 4 });
    recentPosts = data.posts;
  } catch (error) {
    console.log("API Error:", error);
  }

  return (
    <div className="max-w-container mx-auto px-8">
      {/* ═══ Hero Section ═══ */}
      <div className="relative py-20 pb-16 overflow-hidden">
        {/* Decorative green circle */}
        <div
          className="absolute pointer-events-none"
          style={{
            right: "-100px",
            top: "-40px",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: "var(--color-accent-2-200)",
            opacity: 0.3,
          }}
        />

        {/* Dot pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--color-neutral-400) 0.5px, transparent 0.5px)",
            backgroundSize: "28px 28px",
            opacity: 0.12,
          }}
        />

        <div className="relative">
          {/* Name */}
          <h1
            className="font-heading font-bold m-0 mb-4"
            style={{
              fontSize: "52px",
              lineHeight: "1.08",
              letterSpacing: "-0.025em",
            }}
          >
            Naman Tanwar
          </h1>

          {/* Tagline with blinking cursor */}
          <p
            className="m-0"
            style={{
              fontSize: "20px",
              lineHeight: "1.6",
              color: "var(--color-neutral-600)",
              maxWidth: "540px",
            }}
          >
            Writing about the things that break and the things that don&apos;t
            <span
              className="inline-block animate-blink"
              style={{
                width: "3px",
                height: "22px",
                background: "var(--color-accent)",
                marginLeft: "4px",
                verticalAlign: "text-bottom",
              }}
            />
          </p>

          {/* Topic keywords */}
          <p
            className="m-0 mt-4"
            style={{
              fontSize: "14px",
              color: "var(--color-neutral-500)",
              letterSpacing: "0.04em",
            }}
          >
            Security · Systems · Rust · Automotive
          </p>
        </div>
      </div>

      {/* ═══ Recent Posts ═══ */}
      <div className="py-5 pb-20">
        <div className="flex items-baseline justify-between mb-7">
          <h2
            className="font-heading m-0"
            style={{ fontSize: "24px" }}
          >
            Recent Posts
          </h2>
          <Link
            href="/blog"
            className="text-sm font-semibold no-underline"
            style={{
              color: "var(--color-accent)",
              fontFamily: "var(--font-body)",
            }}
          >
            View all posts →
          </Link>
        </div>

        {recentPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} variant="compact" />
            ))}
          </div>
        ) : (
          <div
            className="text-center py-16 rounded-md"
            style={{
              background: "var(--color-surface)",
              borderRadius: "20px",
            }}
          >
            <p
              className="m-0 mb-2 font-heading text-lg"
              style={{ color: "var(--color-text)" }}
            >
              No posts yet
            </p>
            <p
              className="m-0"
              style={{
                fontSize: "14px",
                color: "var(--color-neutral-500)",
              }}
            >
              Start your Rust backend and create your first post.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
