import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "The Syntax Syndicate",
    template: "%s | The Syntax Syndicate",
  },
  description:
    "Deep dives into security, systems programming, and Rust — by Naman Tanwar.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "The Syntax Syndicate",
    description:
      "Deep dives into security, systems programming, and Rust — by Naman Tanwar.",
    type: "website",
    locale: "en_US",
    siteName: "The Syntax Syndicate",
  },
  alternates: {
    types: {
      "application/rss+xml": "/api/feed.xml",
    },
  },
  verification: {
    google: "0x36FjIfQw0CakHOeilYTZoZEkZIrsnSJTpqOnuMDRI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <OrganizationJsonLd />
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
