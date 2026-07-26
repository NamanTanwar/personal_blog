import { describe, it, expect } from "vitest";
import {
    formatDate,
    readingTimeLabel,
    getTagColorClass,
} from "../lib/types";

// ═══════════════════════════════════════════════════
// formatDate
// ═══════════════════════════════════════════════════

describe("formatDate", () => {
    it("formats an ISO date string correctly", () => {
        const result = formatDate("2026-06-01T10:00:00Z");
        expect(result).toBe("Jun 1, 2026");
    });

    it("formats a different date correctly", () => {
        const result = formatDate("2026-12-25T00:00:00Z");
        expect(result).toBe("Dec 25, 2026");
    });

    it("formats January correctly", () => {
        const result = formatDate("2026-01-15T08:30:00Z");
        expect(result).toBe("Jan 15, 2026");
    });

    it("handles date without time component", () => {
        const result = formatDate("2026-06-01");
        expect(result).toContain("2026");
        expect(result).toContain("Jun");
    });
});

// ═══════════════════════════════════════════════════
// readingTimeLabel
// ═══════════════════════════════════════════════════

describe("readingTimeLabel", () => {
    it("formats single minute", () => {
        expect(readingTimeLabel(1)).toBe("1 min read");
    });

    it("formats multiple minutes", () => {
        expect(readingTimeLabel(12)).toBe("12 min read");
    });

    it("formats zero minutes", () => {
        expect(readingTimeLabel(0)).toBe("0 min read");
    });

    it("formats large numbers", () => {
        expect(readingTimeLabel(45)).toBe("45 min read");
    });
});

// ═══════════════════════════════════════════════════
// getTagColorClass
// ═══════════════════════════════════════════════════

describe("getTagColorClass", () => {
    // Accent (terracotta) tags
    it("returns tag-accent for security", () => {
        expect(getTagColorClass("security")).toBe("tag-accent");
    });

    it("returns tag-accent for exploits", () => {
        expect(getTagColorClass("exploits")).toBe("tag-accent");
    });

    it("returns tag-accent for ai", () => {
        expect(getTagColorClass("ai")).toBe("tag-accent");
    });

    // Accent-2 (sage) tags
    it("returns tag-accent-2 for rust", () => {
        expect(getTagColorClass("rust")).toBe("tag-accent-2");
    });

    it("returns tag-accent-2 for memory-safety", () => {
        expect(getTagColorClass("memory-safety")).toBe("tag-accent-2");
    });

    it("returns tag-accent-2 for testing", () => {
        expect(getTagColorClass("testing")).toBe("tag-accent-2");
    });

    // Blue tags
    it("returns tag-blue for c", () => {
        expect(getTagColorClass("c")).toBe("tag-blue");
    });

    it("returns tag-blue for linux", () => {
        expect(getTagColorClass("linux")).toBe("tag-blue");
    });

    it("returns tag-blue for automotive", () => {
        expect(getTagColorClass("automotive")).toBe("tag-blue");
    });

    // Neutral tags
    it("returns tag-neutral for kernel", () => {
        expect(getTagColorClass("kernel")).toBe("tag-neutral");
    });

    it("returns tag-neutral for systems", () => {
        expect(getTagColorClass("systems")).toBe("tag-neutral");
    });

    // Default fallback
    it("returns tag-neutral for unknown tags", () => {
        expect(getTagColorClass("unknown-tag")).toBe("tag-neutral");
    });

    it("returns tag-neutral for empty string", () => {
        expect(getTagColorClass("")).toBe("tag-neutral");
    });

    // Case insensitivity
    it("is case insensitive", () => {
        expect(getTagColorClass("Security")).toBe("tag-accent");
        expect(getTagColorClass("RUST")).toBe("tag-accent-2");
        expect(getTagColorClass("Linux")).toBe("tag-blue");
    });
});