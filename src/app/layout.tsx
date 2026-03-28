import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { sanityClient } from "@/lib/sanity";
import { SITE_SETTINGS_QUERY, NAVIGATION_QUERY } from "@/lib/queries";
import { SiteSettings, Page } from "@/lib/types";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

async function getLayoutData() {
  try {
    const [siteSettings, navigationPages] = await Promise.all([
      sanityClient.fetch<SiteSettings>(SITE_SETTINGS_QUERY),
      sanityClient.fetch<Page[]>(NAVIGATION_QUERY),
    ]);
    return { siteSettings, navigationPages };
  } catch (error) {
    console.error('Error fetching layout data:', error);
    return { siteSettings: null, navigationPages: [] };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteSettings } = await getLayoutData();
  
  return {
    title: {
      default: siteSettings?.title || "Blog",
      template: `%s | ${siteSettings?.title || "Blog"}`,
    },
    description: siteSettings?.description || "A modern blog built with Next.js and Sanity",
    keywords: siteSettings?.seo?.keywords,
    openGraph: {
      title: siteSettings?.title || "Blog",
      description: siteSettings?.description || "A modern blog built with Next.js and Sanity",
      url: siteSettings?.url,
      siteName: siteSettings?.title || "Blog",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteSettings?.title || "Blog",
      description: siteSettings?.description || "A modern blog built with Next.js and Sanity",
      creator: siteSettings?.social?.twitter ? `@${siteSettings.social.twitter}` : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { siteSettings, navigationPages } = await getLayoutData();

  return (
    <html lang="en" className={workSans.variable}>
      <body className={`${workSans.className} antialiased min-h-screen flex flex-col bg-[#e8e8e8]`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 bg-gray-900 text-white px-4 py-2 rounded-md"
        >
          Skip to main content
        </a>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <Navigation siteSettings={siteSettings || undefined} navigationPages={navigationPages} />
        <main className="grow" id="main-content">
          {children}
        </main>
        <Footer siteSettings={siteSettings || undefined} />
      </body>
    </html>
  );
}
