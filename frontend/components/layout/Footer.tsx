import { Rss } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function Footer() {
    return (
        <footer style={{ borderTop: "1px solid var(--border)" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 32px" }}>
                <div
                    className="flex justify-between items-center flex-wrap gap-3"
                    style={{ fontSize: "13px", color: "var(--muted)" }}
                >
                    <span>© {new Date().getFullYear()} Naman Tanwar</span>

                    <div className="flex items-center gap-4">
                        <a
                            href={`${API_BASE}/api/feed.xml`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-rss-link flex items-center gap-1.5 no-underline"
                        >
                            <Rss size={14} />
                            RSS
                        </a>

                        <span style={{ opacity: 0.3 }}>·</span>

                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", opacity: 0.5 }}>
                            Built with Rust &amp; Next.js
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
