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
            className="sticky top-0 z-50 border-b"
            style={{
                background: "color-mix(in srgb, var(--color-bg) 85%, transparent)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderColor: "var(--color-divider)",
            }}
        >
            <nav className="max-w-container mx-auto px-8 py-3.5">
                {/* Desktop layout */}
                <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    {/* Brand */}
                    <Link
                        href="/"
                        className="font-brand text-lg no-underline whitespace-nowrap"
                        style={{ color: "var(--color-text)" }}
                    >
                        The Syntax Syndicate
                    </Link>

                    {/* Center links */}
                    <div className="flex items-center gap-7">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-semibold no-underline transition-colors"
                                style={{
                                    fontFamily: "var(--font-body)",
                                    color: isActive(link.href)
                                        ? "var(--color-accent)"
                                        : "inherit",
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Theme toggle */}
                    <div className="justify-self-end">
                        <ThemeToggle />
                    </div>
                </div>

                {/* Mobile layout */}
                <div className="flex md:hidden items-center justify-between">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="flex items-center justify-center w-[34px] h-[34px] bg-transparent border-none cursor-pointer"
                        style={{ color: "var(--color-text)" }}
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {mobileMenuOpen ? (
                            <X size={20} strokeWidth={2.75} />
                        ) : (
                            <Menu size={20} strokeWidth={2.75} />
                        )}
                    </button>

                    <Link
                        href="/"
                        className="font-brand text-sm no-underline"
                        style={{ color: "var(--color-text)" }}
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
                                className="text-sm font-semibold no-underline py-1"
                                style={{
                                    fontFamily: "var(--font-body)",
                                    color: isActive(link.href)
                                        ? "var(--color-accent)"
                                        : "inherit",
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
