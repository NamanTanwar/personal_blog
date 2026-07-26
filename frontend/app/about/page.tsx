import type { Metadata } from "next";
import { Rss } from "lucide-react";

export const metadata: Metadata = {
    title: "About",
    description:
        "About Naman Tanwar — security researcher, systems programmer, and Rust enthusiast.",
};

function GitHubIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
    );
}

function LinkedInIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    );
}

const SOCIAL_LINKS = [
    {
        label: "GitHub",
        href: "https://github.com/your-username",
        icon: GitHubIcon,
    },
    {
        label: "LinkedIn",
        href: "https://linkedin.com/in/your-username",
        icon: LinkedInIcon,
    },
    {
        label: "RSS Feed",
        href: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/feed.xml`,
        icon: Rss,
    },
];

export default function AboutPage() {
    return (
        <div className="max-w-container mx-auto px-8">
            <div
                className="py-16 pb-20"
                style={{ maxWidth: "720px", margin: "0 auto" }}
            >
                {/* Avatar */}
                <div
                    className="flex items-center justify-center mb-6"
                    style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: "var(--color-accent-2-200)",
                        color: "var(--color-accent-2-700)",
                        fontSize: "28px",
                        fontFamily: "var(--font-heading)",
                        fontWeight: 700,
                    }}
                >
                    NT
                </div>

                {/* Name */}
                <h1
                    className="font-heading font-bold m-0 mb-2"
                    style={{ fontSize: "32px", lineHeight: "1.2" }}
                >
                    Naman Tanwar
                </h1>

                {/* Subtitle */}
                <p
                    className="m-0 mb-10"
                    style={{
                        fontSize: "16px",
                        color: "var(--color-neutral-500)",
                    }}
                >
                    Security Researcher · Systems Programmer · Rust Enthusiast
                </p>

                {/* Bio */}
                <div
                    style={{
                        fontSize: "18px",
                        lineHeight: "1.85",
                        color: "var(--color-neutral-700)",
                    }}
                >
                    <p className="m-0 mb-7">
                        I&apos;m a software engineer based in Pune, India, working at the
                        intersection of automotive systems and low-level software. My day
                        job involves building convergence platforms — hypervisor systems
                        running QNX and Android simultaneously on Qualcomm SoCs, using C++,
                        gRPC, and Protobuf.
                    </p>

                    <p className="m-0 mb-7">
                        Outside of work, I spend most of my time exploring Rust and
                        security. I&apos;ve built everything from algorithmic trading
                        platforms to bi-directional cherry-pick synchronization tools —
                        always with a focus on correctness, performance, and understanding
                        things at the lowest level possible.
                    </p>

                    <p className="m-0 mb-7">
                        This blog is where I write about the things I learn along the way.
                        Expect deep dives into buffer overflow exploits, memory safety,
                        Linux internals, automotive software architecture, and the
                        occasional Rust adventure. I write for people who want to understand
                        how things actually work, not just how to use them.
                    </p>

                    <p className="m-0 mb-10">
                        If something here helped you or you want to talk shop, feel free to
                        reach out. I&apos;m always happy to connect with fellow engineers
                        who care about building things right.
                    </p>
                </div>

                {/* Social links */}
                <div className="flex gap-3 flex-wrap">
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
                                <Icon size={16} strokeWidth={2.5} />
                                {link.label}
                            </a>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
