"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPost, uploadImage, ApiClientError } from "@/lib/api";
import { Upload, Eye, EyeOff, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export default function NewEditorPage() {
    const router = useRouter();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [description, setDescription] = useState("");
    const [contentMd, setContentMd] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [published, setPublished] = useState(false);

    const [showPreview, setShowPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function handleTitleChange(value: string) {
        setTitle(value);
        if (!slugManuallyEdited) {
            setSlug(slugify(value));
        }
    }

    function handleSlugChange(value: string) {
        setSlug(value);
        setSlugManuallyEdited(true);
    }

    function addTag() {
        const trimmed = tagInput.trim().toLowerCase();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
        }
        setTagInput("");
    }

    function removeTag(tag: string) {
        setTags(tags.filter((t) => t !== tag));
    }

    function handleTagKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
        }
    }

    async function handleImageUpload() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/jpeg,image/png,image/gif,image/webp";

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            setUploading(true);
            setError("");

            try {
                const result = await uploadImage(file);
                const markdownImage = `![${file.name}](${result.url})`;

                // Insert at cursor position
                const textarea = textareaRef.current;
                if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const before = contentMd.slice(0, start);
                    const after = contentMd.slice(end);
                    setContentMd(`${before}${markdownImage}${after}`);
                } else {
                    setContentMd(contentMd + "\n" + markdownImage);
                }
            } catch (err) {
                if (err instanceof ApiClientError) {
                    setError(`Image upload failed: ${err.message}`);
                }
            } finally {
                setUploading(false);
            }
        };

        input.click();
    }

    async function handleSave() {
        setError("");
        setSuccess("");

        if (!title.trim()) {
            setError("Title is required.");
            return;
        }
        if (!contentMd.trim()) {
            setError("Content is required.");
            return;
        }

        setSaving(true);

        try {
            await createPost({
                title: title.trim(),
                slug: slug || undefined,
                description: description.trim(),
                tags,
                content_md: contentMd,
                published,
            });

            setSuccess("Post created successfully!");
            setTimeout(() => router.push("/admin/dashboard"), 1000);
        } catch (err) {
            if (err instanceof ApiClientError) {
                setError(err.message);
            } else {
                setError("Failed to save post.");
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-container mx-auto px-8">
            <div className="py-8 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="no-underline">
                            <button className="admin-btn-secondary">
                                <ArrowLeft size={16} />
                                Back
                            </button>
                        </Link>
                        <h1
                            className="font-heading font-bold m-0"
                            style={{ fontSize: "24px" }}
                        >
                            New Post
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            className="admin-btn-secondary"
                            onClick={() => setShowPreview(!showPreview)}
                        >
                            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                            {showPreview ? "Editor" : "Preview"}
                        </button>

                        <button
                            className="admin-btn-primary"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <Save size={16} />
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>

                {/* Messages */}
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
                {success && (
                    <div
                        className="mb-6"
                        style={{
                            padding: "12px 16px",
                            borderRadius: "12px",
                            fontSize: "14px",
                            background: "var(--color-accent-2-100)",
                            color: "var(--color-accent-2-700)",
                            border: "1px solid var(--color-accent-2-200)",
                        }}
                    >
                        {success}
                    </div>
                )}

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Title */}
                    <div>
                        <label
                            className="block mb-1.5"
                            style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "var(--color-neutral-600)",
                            }}
                        >
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="My Awesome Post"
                            className="admin-input"
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label
                            className="block mb-1.5"
                            style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "var(--color-neutral-600)",
                            }}
                        >
                            Slug
                            <span
                                style={{
                                    fontWeight: 400,
                                    color: "var(--color-neutral-400)",
                                    marginLeft: "6px",
                                }}
                            >
                                (auto-generated)
                            </span>
                        </label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            placeholder="my-awesome-post"
                            className="admin-input"
                            style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                    <label
                        className="block mb-1.5"
                        style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--color-neutral-600)",
                        }}
                    >
                        Description
                    </label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="A brief summary for listing cards and SEO"
                        className="admin-input"
                    />
                </div>

                {/* Tags */}
                <div className="mb-6">
                    <label
                        className="block mb-1.5"
                        style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--color-neutral-600)",
                        }}
                    >
                        Tags
                    </label>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="tag tag-neutral"
                                style={{ cursor: "pointer" }}
                                onClick={() => removeTag(tag)}
                            >
                                {tag} ×
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={addTag}
                        placeholder="Type a tag and press Enter"
                        className="admin-input"
                        style={{ maxWidth: "300px" }}
                    />
                </div>

                {/* Published toggle */}
                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={() => setPublished(!published)}
                        className="editor-toggle"
                        style={{
                            background: published
                                ? "var(--color-accent-2)"
                                : "var(--color-neutral-300)",
                        }}
                    >
                        <div
                            className="editor-toggle-knob"
                            style={{
                                transform: published ? "translateX(18px)" : "translateX(0)",
                            }}
                        />
                    </button>
                    <span
                        style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: published
                                ? "var(--color-accent-2)"
                                : "var(--color-neutral-500)",
                        }}
                    >
                        {published ? "Published" : "Draft"}
                    </span>
                </div>

                {/* Editor / Preview */}
                <div>
                    {/* Toolbar */}
                    <div
                        className="flex items-center gap-2 mb-3"
                        style={{
                            borderBottom: "1px solid var(--color-divider)",
                            paddingBottom: "12px",
                        }}
                    >
                        <button
                            className="admin-btn-secondary"
                            onClick={handleImageUpload}
                            disabled={uploading}
                        >
                            <Upload size={14} />
                            {uploading ? "Uploading..." : "Upload Image"}
                        </button>
                    </div>

                    {showPreview ? (
                        /* Preview pane */
                        <div
                            style={{
                                background: "var(--color-surface)",
                                borderRadius: "16px",
                                padding: "32px",
                                minHeight: "400px",
                                border: "1px solid var(--color-divider)",
                            }}
                        >
                            {contentMd ? (
                                <div
                                    className="prose"
                                    style={{ fontSize: "14px", lineHeight: "1.7" }}
                                >
                                    <p
                                        style={{
                                            color: "var(--color-neutral-400)",
                                            fontSize: "12px",
                                        }}
                                    >
                                        Note: This is a raw preview. Full rendering with syntax
                                        highlighting happens on the server after saving.
                                    </p>
                                    <pre
                                        style={{
                                            whiteSpace: "pre-wrap",
                                            fontFamily: "var(--font-body)",
                                            fontSize: "16px",
                                            lineHeight: "1.8",
                                        }}
                                    >
                                        {contentMd}
                                    </pre>
                                </div>
                            ) : (
                                <p
                                    style={{
                                        color: "var(--color-neutral-400)",
                                        fontSize: "14px",
                                    }}
                                >
                                    Nothing to preview yet. Start writing in the editor.
                                </p>
                            )}
                        </div>
                    ) : (
                        /* Editor pane */
                        <textarea
                            ref={textareaRef}
                            value={contentMd}
                            onChange={(e) => setContentMd(e.target.value)}
                            placeholder="Write your post in Markdown..."
                            className="admin-textarea"
                            style={{ minHeight: "500px" }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
