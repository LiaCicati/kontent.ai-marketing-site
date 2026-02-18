import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { draftMode } from "next/headers";
import { getSiteConfig } from "@/lib/kontent";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { NavigationItem, Footer as FooterModel } from "@/lib/models";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Acme Inc.",
    template: "%s | Acme Inc.",
  },
  description: "Build something amazing with Acme Inc.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const draft = await draftMode();
  const siteConfig = await getSiteConfig(draft.isEnabled);

  const siteName = siteConfig?.elements.site_name.value ?? "Acme Inc.";
  const logoUrl = siteConfig?.elements.logo.value?.[0]?.url;
  const navItems =
    (siteConfig?.elements.header_navigation.linkedItems as NavigationItem[]) ??
    [];
  const footer =
    (siteConfig?.elements.footer.linkedItems?.[0] as FooterModel) ?? null;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header siteName={siteName} logoUrl={logoUrl} items={navItems} />
        <div className="flex-1">{children}</div>
        <Footer footer={footer} siteName={siteName} />
      </body>
    </html>
  );
}
