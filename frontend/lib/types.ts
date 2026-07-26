// ═══════════════════════════════════════════════════
// Types matching the Rust backend API responses
// ═══════════════════════════════════════════════════

// --- Posts ---

export interface Post {
    id: string;
    title: string;
    slug: string;
    description: string;
    tags: string[];
    content_html?: string; // Only present on single post fetch
    content_md?: string; // Only present on admin endpoints
    published: boolean;
    reading_time_mins: number;
    created_at: string; // ISO 8601
    updated_at: string; // ISO 8601
}

export interface PostListResponse {
    posts: Post[];
    total: number;
    page: number;
    per_page: number;
}

export interface PostListParams {
    page?: number;
    per_page?: number;
    tag?: string;
}

export interface AdminPostListParams extends PostListParams {
    status?: "all" | "published" | "draft";
}

// --- Create / Update ---

export interface CreatePostRequest {
    title: string;
    slug?: string; // Auto-generated from title if omitted
    description: string;
    tags: string[];
    content_md: string;
    published: boolean;
}

export interface UpdatePostRequest {
    title?: string;
    slug?: string;
    description?: string;
    tags?: string[];
    content_md?: string;
    published?: boolean;
}

export interface CreatePostResponse {
    message: string;
    post_id: string;
}

// --- Tags ---

export interface Tag {
    name: string;
    count: number;
}

export interface TagsResponse {
    tags: Tag[];
}

// --- Auth ---

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    message: string;
}

// --- Images ---

export interface ImageUploadResponse {
    url: string;
}

// --- Health ---

export interface HealthResponse {
    status: string;
    uptime_seconds?: number;
}

// --- Errors ---

export interface ApiError {
    error: string;
}

// --- Tag Color Mapping ---

export type TagColorClass =
    | "tag-accent"
    | "tag-accent-2"
    | "tag-blue"
    | "tag-neutral";

// Maps tag names to their color classes
// Matches the mockup: terracotta for security topics,
// sage for Rust/testing, blue for C/Linux, neutral for everything else
const TAG_COLOR_MAP: Record<string, TagColorClass> = {
    security: "tag-accent",
    exploits: "tag-accent",
    ai: "tag-accent",
    vulnerabilities: "tag-accent",

    rust: "tag-accent-2",
    "memory-safety": "tag-accent-2",
    testing: "tag-accent-2",

    c: "tag-blue",
    linux: "tag-blue",
    automotive: "tag-blue",

    kernel: "tag-neutral",
    systems: "tag-neutral",
    embedded: "tag-neutral",
};

export function getTagColorClass(tagName: string): TagColorClass {
    return TAG_COLOR_MAP[tagName.toLowerCase()] || "tag-neutral";
}

// --- Utilities ---

export function formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function readingTimeLabel(mins: number): string {
    return `${mins} min read`;
}