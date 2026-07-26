import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
        },
        {
            url: `${SITE_URL}/blog`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
    ];

    // Dynamic post pages
    let postPages: MetadataRoute.Sitemap = [];

    try {
        const response = await fetch(`${API_URL}/api/posts?per_page=50`, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (response.ok) {
            const data = await response.json();
            postPages = data.posts.map(
                (post: { slug: string; updated_at: string }) => ({
                    url: `${SITE_URL}/blog/${post.slug}`,
                    lastModified: new Date(post.updated_at),
                    changeFrequency: "monthly" as const,
                    priority: 0.7,
                })
            );
        }
    } catch {
        // Backend unavailable — return static pages only
    }

    return [...staticPages, ...postPages];
}