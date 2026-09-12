import Link from "next/link";

export default function NotFound() {
    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px" }}>
            <div
                className="flex flex-col items-center justify-center text-center"
                style={{ minHeight: "60vh" }}
            >
                <p
                    className="m-0"
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "120px",
                        lineHeight: "1",
                        fontWeight: 700,
                        color: "var(--accent)",
                        opacity: 0.15,
                    }}
                >
                    404
                </p>
                <h1
                    className="m-0"
                    style={{ fontSize: "28px", fontWeight: 700, marginBottom: "12px" }}
                >
                    Page not found
                </h1>
                <p
                    className="m-0"
                    style={{
                        fontSize: "16px",
                        color: "var(--muted)",
                        maxWidth: "400px",
                        marginBottom: "32px",
                    }}
                >
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <div className="flex" style={{ gap: "12px" }}>
                    <Link href="/" className="no-underline">
                        <button className="admin-btn-primary">Go Home</button>
                    </Link>
                    <Link href="/blog" className="no-underline">
                        <button className="admin-btn-secondary">Browse Posts</button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
