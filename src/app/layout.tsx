import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/organisms/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import {OverflowDebug} from "@/components/utils/OverflowDebug";
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
  const metadataBase = (() => {
    const raw = siteSettings?.url || 'https://www.stuartwainstock.com'
    try {
      return new URL(raw)
    } catch {
      return new URL('https://www.stuartwainstock.com')
    }
  })()
  
  return {
    metadataBase,
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
      <body className={`${workSans.className} layout-body`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <OverflowDebug />
        <Navigation siteSettings={siteSettings || undefined} navigationPages={navigationPages} />
        <main className="layout-main" id="main-content">
          {children}
        </main>
        <Footer siteSettings={siteSettings || undefined} />
      </body>
    </html>
  );
}
