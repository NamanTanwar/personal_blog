import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to test the internal buildQueryString function and error handling
// Since buildQueryString is not exported, we test it through the public API functions

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Set env before importing
vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001");

// Import after mocking
import { getPosts, getPost, getTags, login, ApiClientError } from "../lib/api";

beforeEach(() => {
    mockFetch.mockReset();
});

// ═══════════════════════════════════════════════════
// getPosts — Query String Building
// ═══════════════════════════════════════════════════

describe("getPosts", () => {
    it("calls the correct URL with no params", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () =>
                JSON.stringify({ posts: [], total: 0, page: 1, per_page: 10 }),
        });

        await getPosts();

        expect(mockFetch).toHaveBeenCalledWith(
            "http://localhost:3001/api/posts",
            expect.objectContaining({ credentials: "include" })
        );
    });

    it("includes page in query string", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () =>
                JSON.stringify({ posts: [], total: 0, page: 2, per_page: 10 }),
        });

        await getPosts({ page: 2 });

        const calledUrl = mockFetch.mock.calls[0][0];
        expect(calledUrl).toContain("page=2");
    });

    it("includes tag in query string", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () =>
                JSON.stringify({ posts: [], total: 0, page: 1, per_page: 10 }),
        });

        await getPosts({ tag: "security" });

        const calledUrl = mockFetch.mock.calls[0][0];
        expect(calledUrl).toContain("tag=security");
    });

    it("includes multiple params in query string", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () =>
                JSON.stringify({ posts: [], total: 0, page: 1, per_page: 5 }),
        });

        await getPosts({ page: 3, per_page: 5, tag: "rust" });

        const calledUrl = mockFetch.mock.calls[0][0];
        expect(calledUrl).toContain("page=3");
        expect(calledUrl).toContain("per_page=5");
        expect(calledUrl).toContain("tag=rust");
    });

    it("omits undefined params from query string", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () =>
                JSON.stringify({ posts: [], total: 0, page: 1, per_page: 10 }),
        });

        await getPosts({ page: 1, tag: undefined });

        const calledUrl = mockFetch.mock.calls[0][0];
        expect(calledUrl).not.toContain("tag");
    });

    it("returns parsed response", async () => {
        const mockData = {
            posts: [{ id: "1", title: "Test", slug: "test" }],
            total: 1,
            page: 1,
            per_page: 10,
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () => JSON.stringify(mockData),
        });

        const result = await getPosts();
        expect(result.posts).toHaveLength(1);
        expect(result.posts[0].title).toBe("Test");
        expect(result.total).toBe(1);
    });
});

// ═══════════════════════════════════════════════════
// getPost — Single Post Fetch
// ═══════════════════════════════════════════════════

describe("getPost", () => {
    it("calls the correct URL with slug", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () =>
                JSON.stringify({
                    id: "1",
                    title: "Test",
                    slug: "test-post",
                    content_html: "<p>hi</p>",
                }),
        });

        await getPost("test-post");

        const calledUrl = mockFetch.mock.calls[0][0];
        expect(calledUrl).toBe("http://localhost:3001/api/posts/test-post");
    });

    it("encodes special characters in slug", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ id: "1", title: "Test" }),
        });

        await getPost("post with spaces");

        const calledUrl = mockFetch.mock.calls[0][0];
        expect(calledUrl).toContain("post%20with%20spaces");
    });
});

// ═══════════════════════════════════════════════════
// Error Handling
// ═══════════════════════════════════════════════════

describe("error handling", () => {
    it("throws ApiClientError on 404", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            text: async () => JSON.stringify({ error: "Post not found" }),
        });

        try {
            await getPost("nonexistent");
            expect.fail("Should have thrown");
        } catch (err) {
            expect(err).toBeInstanceOf(ApiClientError);
            expect((err as ApiClientError).status).toBe(404);
            expect((err as ApiClientError).message).toBe("Post not found");
        }
    });

    it("throws ApiClientError on 401", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            text: async () => JSON.stringify({ error: "Unauthorized" }),
        });

        try {
            await getPost("secret-post");
            expect.fail("Should have thrown");
        } catch (err) {
            expect(err).toBeInstanceOf(ApiClientError);
            expect((err as ApiClientError).status).toBe(401);
        }
    });

    it("throws on network failure", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        try {
            await getPosts();
            expect.fail("Should have thrown");
        } catch (err) {
            expect(err).toBeInstanceOf(ApiClientError);
            expect((err as ApiClientError).message).toBe("Cannot connect to backend");
        }
    });

    it("throws on invalid JSON response", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () => "not json",
        });

        try {
            await getPosts();
            expect.fail("Should have thrown");
        } catch (err) {
            expect(err).toBeInstanceOf(ApiClientError);
            expect((err as ApiClientError).message).toContain("Invalid JSON");
        }
    });

    it("handles empty response body", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () => "",
        });

        const result = await getPosts();
        expect(result).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════
// Login
// ═══════════════════════════════════════════════════

describe("login", () => {
    it("sends POST with correct body", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ message: "Successfully authenticated" }),
        });

        await login({ email: "admin@example.com", password: "test123" });

        expect(mockFetch).toHaveBeenCalledWith(
            "http://localhost:3001/api/auth/login",
            expect.objectContaining({
                method: "POST",
                credentials: "include",
                body: JSON.stringify({
                    email: "admin@example.com",
                    password: "test123",
                }),
            })
        );
    });

    it("throws on 429 rate limit", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 429,
            text: async () =>
                JSON.stringify({ error: "Too many login attempts" }),
        });

        try {
            await login({ email: "admin@example.com", password: "wrong" });
            expect.fail("Should have thrown");
        } catch (err) {
            expect(err).toBeInstanceOf(ApiClientError);
            expect((err as ApiClientError).status).toBe(429);
        }
    });
});

// ═══════════════════════════════════════════════════
// getTags
// ═══════════════════════════════════════════════════

describe("getTags", () => {
    it("calls the correct URL", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () =>
                JSON.stringify({ tags: [{ name: "rust", count: 5 }] }),
        });

        const result = await getTags();

        expect(mockFetch).toHaveBeenCalledWith(
            "http://localhost:3001/api/tags",
            expect.objectContaining({ credentials: "include" })
        );
        expect(result.tags).toHaveLength(1);
        expect(result.tags[0].name).toBe("rust");
        expect(result.tags[0].count).toBe(5);
    });
});