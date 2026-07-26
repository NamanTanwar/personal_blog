"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch — theme is unknown on the server
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        // Render a placeholder with the same dimensions to prevent layout shift
        return <div className="w-[34px] h-[34px]" />;
    }

    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex items-center justify-center w-[34px] h-[34px] rounded-full transition-colors hover:bg-neutral-200 cursor-pointer"
            style={{ color: "var(--color-text)" }}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {isDark ? <Sun size={18} strokeWidth={2.75} /> : <Moon size={18} strokeWidth={2.75} />}
        </button>
    );
}
