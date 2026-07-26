import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                bg: "var(--color-bg)",
                surface: "var(--color-surface)",
                text: "var(--color-text)",
                divider: "var(--color-divider)",
                accent: {
                    DEFAULT: "var(--color-accent)",
                    100: "var(--color-accent-100)",
                    200: "var(--color-accent-200)",
                    300: "var(--color-accent-300)",
                    400: "var(--color-accent-400)",
                    500: "var(--color-accent-500)",
                    600: "var(--color-accent-600)",
                    700: "var(--color-accent-700)",
                    800: "var(--color-accent-800)",
                    900: "var(--color-accent-900)",
                },
                accent2: {
                    DEFAULT: "var(--color-accent-2)",
                    100: "var(--color-accent-2-100)",
                    200: "var(--color-accent-2-200)",
                    300: "var(--color-accent-2-300)",
                    400: "var(--color-accent-2-400)",
                    500: "var(--color-accent-2-500)",
                    600: "var(--color-accent-2-600)",
                    700: "var(--color-accent-2-700)",
                    800: "var(--color-accent-2-800)",
                    900: "var(--color-accent-2-900)",
                },
                neutral: {
                    100: "var(--color-neutral-100)",
                    200: "var(--color-neutral-200)",
                    300: "var(--color-neutral-300)",
                    400: "var(--color-neutral-400)",
                    500: "var(--color-neutral-500)",
                    600: "var(--color-neutral-600)",
                    700: "var(--color-neutral-700)",
                    800: "var(--color-neutral-800)",
                    900: "var(--color-neutral-900)",
                },
                code: {
                    bg: "#1a1816",
                    keyword: "#d4834a",
                    function: "#e2b86b",
                    string: "#90a573",
                    number: "#d19a66",
                    comment: "#706a5f",
                    text: "#ede8df",
                    preprocessor: "#b4a078",
                },
            },
            fontFamily: {
                brand: ["var(--font-brand)"],
                heading: ["var(--font-heading)"],
                body: ["var(--font-body)"],
                mono: ["var(--font-mono)"],
            },
            borderRadius: {
                sm: "8px",
                md: "16px",
                lg: "28px",
                pill: "999px",
            },
            boxShadow: {
                sm: "var(--shadow-sm)",
                md: "var(--shadow-md)",
                lg: "var(--shadow-lg)",
            },
            spacing: {
                "s1": "4.4px",
                "s2": "8.8px",
                "s3": "13.2px",
                "s4": "17.6px",
                "s6": "26.4px",
                "s8": "35.2px",
            },
            maxWidth: {
                container: "1200px",
                article: "720px",
            },
            fontSize: {
                "hero": ["52px", { lineHeight: "1.08", letterSpacing: "-0.025em" }],
                "post-title": ["38px", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
                "h2": ["28px", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
                "h3": ["22px", { lineHeight: "1.3" }],
                "body-lg": ["20px", { lineHeight: "1.6" }],
                "body": ["18px", { lineHeight: "1.85" }],
                "body-sm": ["15px", { lineHeight: "1.7" }],
                "caption": ["14px", { lineHeight: "1.55" }],
                "small": ["13px", { lineHeight: "1.5" }],
                "tag": ["11px", { lineHeight: "1", letterSpacing: "0.02em" }],
            },
            keyframes: {
                blink: {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0" },
                },
            },
            animation: {
                blink: "blink 1.2s step-end infinite",
            },
        },
    },
    plugins: [],
};

export default config;
