"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, ApiClientError } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login({ email, password });
            router.push("/admin/dashboard");
        } catch (err) {
            if (err instanceof ApiClientError) {
                if (err.status === 429) {
                    setError("Too many login attempts. Please try again later.");
                } else {
                    setError("Invalid email or password.");
                }
            } else {
                setError("Cannot connect to the server.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-container mx-auto px-8">
            <div
                className="py-20"
                style={{ maxWidth: "400px", margin: "0 auto" }}
            >
                {/* Header */}
                <h1
                    className="font-heading font-bold m-0 mb-2 text-center"
                    style={{ fontSize: "28px" }}
                >
                    Admin Login
                </h1>
                <p
                    className="m-0 mb-8 text-center"
                    style={{ fontSize: "14px", color: "var(--color-neutral-500)" }}
                >
                    Sign in to manage your blog posts.
                </p>

                {/* Error message */}
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

                {/* Login form */}
                <div>
                    {/* Email */}
                    <div className="mb-4">
                        <label
                            className="block mb-1.5"
                            style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "var(--color-neutral-600)",
                            }}
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            className="admin-input"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="mb-6">
                        <label
                            className="block mb-1.5"
                            style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "var(--color-neutral-600)",
                            }}
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="admin-input"
                            required
                        />
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !email || !password}
                        className="admin-btn-primary w-full"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </div>
            </div>
        </div>
    );
}
