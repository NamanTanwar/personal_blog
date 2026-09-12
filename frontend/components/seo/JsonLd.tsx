import type { Post } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Site-wide Organization schema — add to root layout
export function OrganizationJsonLd() {
    const data = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Naman Tanwar",
        url: SITE_URL,
        sameAs: [
            "https://github.com/NamanTanwar",
            "https://linkedin.com/in/naman-tanwar886",
        ],
        jobTitle: "Software Engineer",
        description:
            "Security researcher and systems programmer writing about buffer overflows, Rust, Linux internals, and distributed systems.",
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

// Blog post schema — add to individual post pages
export function BlogPostJsonLd({ post }: { post: Post }) {
    const data = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.created_at,
        dateModified: post.updated_at,
        author: {
            "@type": "Person",
            name: "Naman Tanwar",
            url: SITE_URL,
        },
        publisher: {
            "@type": "Person",
            name: "Naman Tanwar",
            url: SITE_URL,
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${SITE_URL}/blog/${post.slug}`,
        },
        url: `${SITE_URL}/blog/${post.slug}`,
        keywords: post.tags.join(", "),
        wordCount: post.reading_time_mins * 200,
        timeRequired: `PT${post.reading_time_mins}M`,
        inLanguage: "en",
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

// Breadcrumb schema — add to post pages
export function BreadcrumbJsonLd({
    postTitle,
    postSlug,
}: {
    postTitle: string;
    postSlug: string;
}) {
    const data = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: SITE_URL,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: `${SITE_URL}/blog`,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: postTitle,
                item: `${SITE_URL}/blog/${postSlug}`,
            },
        ],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

// Website schema with search — add to home page
export function WebsiteJsonLd() {
    const data = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "The Syntax Syndicate",
        url: SITE_URL,
        description:
            "Deep dives into security, systems programming, and Rust — by Naman Tanwar.",
        author: {
            "@type": "Person",
            name: "Naman Tanwar",
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}