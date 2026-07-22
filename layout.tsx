import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "Elit-Web Audit AI - реальний SEO-аудит сайту";
const description =
  "MVP продукту Elit-Web для швидкої перевірки сайту з реальними даними On-page crawl, PageSpeed Insights і Serpstat API.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") ?? "https";
  const metadataBase = new URL(`${proto}://${host}`);

  return {
    metadataBase,
    title,
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: "/og.svg",
          width: 1200,
          height: 630,
          alt: "Elit-Web Audit AI preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.svg"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
