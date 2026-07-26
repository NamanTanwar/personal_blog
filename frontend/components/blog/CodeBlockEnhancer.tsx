"use client";

import { useEffect } from "react";

export function CodeBlockEnhancer() {
    useEffect(() => {
        // Find all <pre> elements inside the prose container
        const codeBlocks = document.querySelectorAll(".prose pre");

        codeBlocks.forEach((pre) => {
            // Skip if already enhanced
            if (pre.querySelector(".code-block-header")) return;

            const code = pre.querySelector("code");
            if (!code) return;

            // Extract language from class (e.g., "language-rust" → "rust")
            const langClass = Array.from(code.classList).find((c) =>
                c.startsWith("language-")
            );
            const language = langClass ? langClass.replace("language-", "") : "";

            // Create header bar
            const header = document.createElement("div");
            header.className = "code-block-header";

            // Language label
            const langLabel = document.createElement("span");
            langLabel.className = "code-block-lang";
            langLabel.textContent = language;

            // Copy button
            const copyBtn = document.createElement("button");
            copyBtn.className = "code-block-copy";
            copyBtn.textContent = "Copy";
            copyBtn.addEventListener("click", () => {
                const text = code.textContent || "";
                navigator.clipboard.writeText(text).then(() => {
                    copyBtn.textContent = "Copied!";
                    setTimeout(() => {
                        copyBtn.textContent = "Copy";
                    }, 2000);
                });
            });

            header.appendChild(langLabel);
            header.appendChild(copyBtn);

            // Insert header before the code content
            pre.insertBefore(header, pre.firstChild);
        });
    }, []);

    return null;
}
