import type {
    Post,
    PostListResponse,
    PostListParams,
    AdminPostListParams,
    CreatePostRequest,
    CreatePostResponse,
    UpdatePostRequest,
    TagsResponse,
    LoginRequest,
    LoginResponse,
    ImageUploadResponse,
    HealthResponse,
} from "./types";

// ═══════════════════════════════════════════════════
// API Client
// Thin wrapper around fetch that handles:
// - Base URL from environment
// - JSON serialization/deserialization
// - Cookie credentials (HttpOnly JWT)
// - Error extraction from API responses
// ═══════════════════════════════════════════════════

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class ApiClientError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiClientError";
        this.status = status;
    }
}

async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${path}`;

    let response;
    try {
        response = await fetch(url, {
            ...options,
            credentials: "include",
            headers: {
                ...options.headers,
            },
        });
    } catch {
        throw new ApiClientError("Cannot connect to backend", 0);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const text = await response.text();

    if (!text) {
        if (!response.ok) {
            throw new ApiClientError("Request failed with empty response", response.status);
        }
        return undefined as T;
    }

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new ApiClientError(`Invalid JSON response: ${text.slice(0, 100)}`, response.status);
    }

    if (!response.ok) {
        throw new ApiClientError(
            data.error || "Something went wrong",
            response.status
        );
    }

    return data as T;
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
    const filtered = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

    return filtered.length > 0 ? `?${filtered.join("&")}` : "";
}

// ═══════════════════════════════════════════════════
// Public Endpoints (no auth required)
// ═══════════════════════════════════════════════════

export async function getPosts(params: PostListParams = {}): Promise<PostListResponse> {
    const query = buildQueryString({
        page: params.page,
        per_page: params.per_page,
        tag: params.tag,
    });
    return request<PostListResponse>(`/api/posts${query}`);
}

export async function getPost(slug: string): Promise<Post> {
    return request<Post>(`/api/posts/${encodeURIComponent(slug)}`);
}

export async function getTags(): Promise<TagsResponse> {
    return request<TagsResponse>("/api/tags");
}

export async function getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>("/api/health");
}

// RSS feed is fetched directly by the browser, not via this client
// It's at: ${API_BASE}/api/feed.xml

// ═══════════════════════════════════════════════════
// Auth Endpoints
// ═══════════════════════════════════════════════════

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
    return request<LoginResponse>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });
}

// ═══════════════════════════════════════════════════
// Admin Endpoints (auth required — cookie sent automatically)
// ═══════════════════════════════════════════════════

export async function getAdminPosts(
    params: AdminPostListParams = {}
): Promise<PostListResponse> {
    const query = buildQueryString({
        page: params.page,
        per_page: params.per_page,
        tag: params.tag,
        status: params.status,
    });
    return request<PostListResponse>(`/api/admin/posts${query}`);
}

export async function getAdminPost(slug: string): Promise<Post> {
    return request<Post>(`/api/admin/posts/${encodeURIComponent(slug)}`);
}

export async function createPost(
    post: CreatePostRequest
): Promise<CreatePostResponse> {
    return request<CreatePostResponse>("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
    });
}

export async function updatePost(
    slug: string,
    updates: UpdatePostRequest
): Promise<Post> {
    return request<Post>(`/api/admin/posts/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
    });
}

export async function deletePost(slug: string): Promise<void> {
    return request<void>(`/api/admin/posts/${encodeURIComponent(slug)}`, {
        method: "DELETE",
    });
}

export async function uploadImage(file: File): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append("image", file);

    return request<ImageUploadResponse>("/api/admin/images/upload", {
        method: "POST",
        body: formData,
        // Don't set Content-Type — browser sets it automatically with the boundary
    });
}

// ═══════════════════════════════════════════════════
// Export error class for consumers to catch
// ═══════════════════════════════════════════════════

export { ApiClientError };