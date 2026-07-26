"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getAdminPosts, deletePost, ApiClientError } from "@/lib/api";
import { formatDate } from "@/lib/types";
import type { Post } from "@/lib/types";

export default function DashboardPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
    const [deleting, setDeleting] = useState(false);

    async function fetchPosts() {
        try {
            const data = await getAdminPosts({ per_page: 50 });
            setPosts(data.posts);
            setTotal(data.total);
        } catch (err) {
            if (err instanceof ApiClientError && err.status === 401) {
                router.push("/admin/login");
            } else {
                setError("Failed to load posts.");
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPosts();
    }, []);

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);

        try {
            await deletePost(deleteTarget.slug);
            setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
            setTotal((prev) => prev - 1);
            setDeleteTarget(null);
        } catch (err) {
            if (err instanceof ApiClientError) {
                setError(`Failed to delete: ${err.message}`);
            }
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="max-w-container mx-auto px-8">
                <div
                    className="flex items-center justify-center py-32"
                    style={{ color: "var(--color-neutral-500)" }}
                >
                    <p className="text-body-sm">Loading posts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-container mx-auto px-8">
            <div className="py-10 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1
                            className="font-heading font-bold m-0 mb-1"
                            style={{ fontSize: "28px" }}
                        >
                            Dashboard
                        </h1>
                        <p
                            className="m-0"
                            style={{ fontSize: "14px", color: "var(--color-neutral-500)" }}
                        >
                            {total} {total === 1 ? "post" : "posts"} total
                        </p>
                    </div>

                    <Link href="/admin/editor" className="no-underline">
                        <button className="admin-btn-primary">
                            <Plus size={18} strokeWidth={2.5} />
                            New Post
                        </button>
                    </Link>
                </div>

                {/* Error */}
                {error && (
                    <div
                        className="mb-6"
                        style={{
                            padding: "12px 16px",
                            borderRadius: "12px",
                            fontSize: "14px",
                            background: "var(--color-accent-100)",
                            color: "var(--color-accent-700)",
                            border: "1px solid var(--color-accent-200)",
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Posts table */}
                {posts.length > 0 ? (
                    <div
                        style={{
                            background: "var(--color-surface)",
                            borderRadius: "20px",
                            border: "1px solid var(--color-divider)",
                            overflow: "hidden",
                        }}
                    >
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map((post) => (
                                    <tr key={post.id}>
                                        <td>
                                            <div>
                                                <span
                                                    className="font-heading font-semibold"
                                                    style={{ color: "var(--color-text)" }}
                                                >
                                                    {post.title}
                                                </span>
                                                <br />
                                                <span
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "var(--color-neutral-500)",
                                                    }}
                                                >
                                                    /{post.slug}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            {post.published ? (
                                                <span className="tag tag-accent-2">published</span>
                                            ) : (
                                                <span className="tag tag-neutral">draft</span>
                                            )}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: "13px",
                                                color: "var(--color-neutral-500)",
                                            }}
                                        >
                                            {formatDate(post.created_at)}
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/editor/${post.slug}`}
                                                    className="no-underline"
                                                >
                                                    <button className="admin-btn-secondary">
                                                        <Pencil size={14} />
                                                        Edit
                                                    </button>
                                                </Link>
                                                <button
                                                    className="admin-btn-danger"
                                                    onClick={() => setDeleteTarget(post)}
                                                >
                                                    <Trash2 size={14} />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div
                        className="text-center py-16"
                        style={{
                            background: "var(--color-surface)",
                            borderRadius: "20px",
                        }}
                    >
                        <p
                            className="m-0 mb-2 font-heading text-lg"
                            style={{ color: "var(--color-text)" }}
                        >
                            No posts yet
                        </p>
                        <p
                            className="m-0 mb-6"
                            style={{ fontSize: "14px", color: "var(--color-neutral-500)" }}
                        >
                            Create your first blog post to get started.
                        </p>
                        <Link href="/admin/editor" className="no-underline">
                            <button className="admin-btn-primary">
                                <Plus size={18} strokeWidth={2.5} />
                                New Post
                            </button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            {deleteTarget && (
                <div className="admin-dialog-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="admin-dialog" onClick={(e) => e.stopPropagation()}>
                        <h3
                            className="font-heading font-bold m-0 mb-2"
                            style={{ fontSize: "20px" }}
                        >
                            Delete Post
                        </h3>
                        <p
                            className="m-0 mb-6"
                            style={{ fontSize: "14px", color: "var(--color-neutral-600)" }}
                        >
                            Are you sure you want to delete &quot;{deleteTarget.title}&quot;?
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                className="admin-btn-secondary"
                                onClick={() => setDeleteTarget(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="admin-btn-danger"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
