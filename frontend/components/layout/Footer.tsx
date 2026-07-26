import { Rss } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function Footer() {
    return (
        <footer
            className="border-t"
            style={{ borderColor: "var(--color-divider)" }}
        >
            <div className="max-w-container mx-auto px-8 py-8">
                <div
                    className="flex justify-between items-center text-small flex-wrap gap-3"
                    style={{ color: "var(--color-neutral-500)" }}
                >
                    <span>© {new Date().getFullYear()} Naman Tanwar</span>

                    <div className="flex items-center gap-4">
                        <a
                            href={`${API_BASE}/api/feed.xml`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 no-underline transition-colors hover:text-accent"
                            style={{ color: "var(--color-neutral-500)" }}
                        >
                            <Rss size={14} strokeWidth={2.75} />
                            RSS
                        </a>

                        <span style={{ opacity: 0.3 }}>·</span>

                        <span>Built with Rust &amp; Next.js</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
