import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { sanityClient } from "@/lib/sanity";
import { siteSettingsQuery, navigationQuery } from "@/lib/queries";
import { SiteSettings, Page } from "@/lib/types";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

async function getLayoutData() {
  try {
    const [siteSettings, navigationPages] = await Promise.all([
      sanityClient.fetch<SiteSettings>(siteSettingsQuery),
      sanityClient.fetch<Page[]>(navigationQuery),
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
      <body className={`${workSans.className} antialiased min-h-screen flex flex-col`}>
        <Navigation siteSettings={siteSettings || undefined} navigationPages={navigationPages} />
        <main className="flex-grow" id="main-content">
          {children}
        </main>
        <Footer siteSettings={siteSettings || undefined} />
      </body>
    </html>
  );
}
