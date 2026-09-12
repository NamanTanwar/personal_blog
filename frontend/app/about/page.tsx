import type { Metadata } from "next";
import { Rss } from "lucide-react";

export const metadata: Metadata = {
    title: "About",
    description:
        "About Naman Tanwar — security researcher, systems programmer, and Rust enthusiast.",
};

function GitHubIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
    );
}

function LinkedInIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect width="4" height="12" x="2" y="9" />
            <circle cx="4" cy="4" r="2" />
        </svg>
    );
}

const SOCIAL_LINKS = [
    { label: "GitHub", href: "https://github.com/NamanTanwar", icon: GitHubIcon },
    { label: "LinkedIn", href: "https://linkedin.com/in/naman-tanwar886", icon: LinkedInIcon },
    { label: "RSS Feed", href: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/feed.xml`, icon: Rss },
];

export default function AboutPage() {
    return (
        <div style={{ maxWidth: "640px", margin: "0 auto", padding: "56px 32px 80px" }}>
            {/* Header — avatar + name side by side */}
            <div className="flex items-center" style={{ gap: "28px", marginBottom: "48px" }}>
                <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50%",
                        background: "var(--accent)",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "32px",
                            fontWeight: 700,
                            color: "#0a0a0a",
                        }}
                    >
                        NT
                    </span>
                </div>
                <div>
                    <h1
                        className="m-0"
                        style={{
                            fontSize: "28px",
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                            marginBottom: "6px",
                        }}
                    >
                        Naman Tanwar
                    </h1>
                    <p
                        className="m-0"
                        style={{
                            fontSize: "13px",
                            color: "var(--muted)",
                            fontFamily: "var(--font-mono)",
                        }}
                    >
                        security · systems · rust · distributed systems
                    </p>
                </div>
            </div>

            {/* Bio */}
            <div style={{ fontSize: "16px", lineHeight: "1.8" }}>
                <p style={{ margin: "0 0 20px" }}>
                    I work at the intersection of security, systems programming, and automotive
                    software. By day, I build safety-critical software for next-generation
                    vehicles. By night, I break things to understand how they work — and write
                    about it here.
                </p>
                <p style={{ margin: "0 0 20px" }}>
                    My background is in low-level systems: Linux kernel internals, memory
                    management, embedded systems. I fell in love with Rust when I realized it
                    could prevent entire classes of bugs I&apos;d spent years debugging in C
                    and C++.
                </p>
                <p style={{ margin: "0 0 20px" }}>
                    This blog is where I publish deep dives into topics I find fascinating —
                    buffer overflows, memory safety, kernel internals, and the emerging world
                    of AI in autonomous driving. Every post is written for experienced
                    developers who want to go deeper, not wider.
                </p>
                <p style={{ margin: "0 0 40px" }}>
                    When I&apos;m not writing code or prose, you&apos;ll find me reading RFCs,
                    contributing to open-source projects, or arguing about undefined behavior
                    on forums.
                </p>
            </div>

            {/* Social links */}
            <div className="flex items-center flex-wrap" style={{ gap: "10px" }}>
                {SOCIAL_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                        <a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="about-social-link"
                        >
                            <Icon size={15} strokeWidth={2} />
                            {link.label}
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
