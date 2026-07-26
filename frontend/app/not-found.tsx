import Link from "next/link";

export default function NotFound() {
    return (
        <div className="max-w-container mx-auto px-8" >
            <div
                className="flex flex-col items-center justify-center text-center"
                style={{ minHeight: "60vh" }
                }
            >
                {/* 404 number */}
                < p
                    className="font-heading font-bold m-0"
                    style={{
                        fontSize: "120px",
                        lineHeight: "1",
                        color: "var(--color-accent)",
                        opacity: 0.25,
                    }}
                >
                    404
                </p>

                {/* Message */}
                <h1
                    className="font-heading font-bold m-0 mb-3"
                    style={{ fontSize: "28px" }}
                >
                    Page not found
                </h1>

                < p
                    className="m-0 mb-8"
                    style={{
                        fontSize: "16px",
                        color: "var(--color-neutral-500)",
                        maxWidth: "400px",
                    }}
                >
                    The page you & apos;re looking for doesn & apos; t exist or has been moved.
                    Maybe the slug changed, or the post was unpublished.
                </p>

                {/* Navigation links */}
                <div className="flex gap-3" >
                    <Link href="/" className="no-underline" >
                        <button className="admin-btn-primary" > Go Home </button>
                    </Link>
                    < Link href="/blog" className="no-underline" >
                        <button className="admin-btn-secondary" > Browse Posts </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
