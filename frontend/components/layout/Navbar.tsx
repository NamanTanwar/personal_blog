"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
    { href: "/", label: "Home" },
    { href: "/blog", label: "Blog" },
    { href: "/about", label: "About" },
];

export function Navbar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    function isActive(href: string): boolean {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    }

    return (
        <header
            className="sticky top-0 z-50"
            style={{
                background: "color-mix(in srgb, var(--bg) 85%, transparent)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderBottom: "1px solid var(--border)",
            }}
        >
            <nav style={{ maxWidth: "1100px", margin: "0 auto", padding: "14px 32px" }}>
                {/* Desktop */}
                <div className="hidden md:grid" style={{ gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "16px" }}>
                    <Link
                        href="/"
                        className="no-underline whitespace-nowrap"
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "var(--text)",
                            letterSpacing: "-0.03em",
                        }}
                    >
                        The Syntax Syndicate
                    </Link>

                    <div className="flex items-center" style={{ gap: "32px" }}>
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="no-underline transition-colors"
                                style={{
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    color: isActive(link.href) ? "var(--accent)" : "var(--muted)",
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="justify-self-end">
                        <ThemeToggle />
                    </div>
                </div>

                {/* Mobile */}
                <div className="flex md:hidden items-center justify-between">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="flex items-center justify-center w-[30px] h-[30px] bg-transparent border-none cursor-pointer"
                        style={{ color: "var(--muted)" }}
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <Link
                        href="/"
                        className="no-underline"
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "var(--text)",
                            letterSpacing: "-0.03em",
                        }}
                    >
                        The Syntax Syndicate
                    </Link>

                    <ThemeToggle />
                </div>

                {/* Mobile dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden pt-4 pb-2 flex flex-col gap-3">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="no-underline py-1"
                                style={{
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    color: isActive(link.href) ? "var(--accent)" : "var(--muted)",
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}
            </nav>
        </header>
    );
}
