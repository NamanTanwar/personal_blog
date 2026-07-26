"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getHealth } from "@/lib/api";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    // Skip auth check on the login page itself
    const isLoginPage = pathname === "/admin/login";

    useEffect(() => {
        if (isLoginPage) {
            setChecking(false);
            setAuthenticated(true);
            return;
        }

        // Check if the user has a valid session by hitting an admin endpoint
        async function checkAuth() {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/admin/posts?per_page=1`,
                    { credentials: "include" }
                );

                if (response.ok) {
                    setAuthenticated(true);
                } else {
                    router.push("/admin/login");
                }
            } catch {
                router.push("/admin/login");
            } finally {
                setChecking(false);
            }
        }

        checkAuth();
    }, [isLoginPage, router]);

    if (checking && !isLoginPage) {
        return (
            <div className="max-w-container mx-auto px-8">
                <div
                    className="flex items-center justify-center py-32"
                    style={{ color: "var(--color-neutral-500)" }}
                >
                    <p className="text-body-sm">Checking authentication...</p>
                </div>
            </div>
        );
    }

    if (!authenticated && !isLoginPage) {
        return null;
    }

    return <>{children}</>;
}
