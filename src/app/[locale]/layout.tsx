import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getSiteConfig } from "@/lib/kontent";
import {
  locales,
  isValidLocale,
  localeToKontentLanguage,
  type Locale,
} from "@/lib/i18n";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DraftModeBanner from "@/components/ui/DraftModeBanner";
import SmartLinkProvider from "@/components/ui/SmartLinkProvider";
import type { NavigationItem, Footer as FooterModel } from "@/lib/models";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const language = localeToKontentLanguage[locale as Locale];
  const draft = await draftMode();
  const siteConfig = await getSiteConfig(draft.isEnabled, language);

  const siteName = siteConfig?.elements.site_name.value ?? "Acme Inc.";
  const logoUrl = siteConfig?.elements.logo.value?.[0]?.url;
  const navItems =
    (siteConfig?.elements.header_navigation.linkedItems as NavigationItem[]) ??
    [];
  const footer =
    (siteConfig?.elements.footer.linkedItems?.[0] as FooterModel) ?? null;

  return (
    <>
      {draft.isEnabled && <DraftModeBanner />}
      {draft.isEnabled && <SmartLinkProvider languageCodename={language} />}
      <div
        {...(draft.isEnabled
          ? {
              "data-kontent-environment-id":
                process.env.KONTENT_PROJECT_ID,
              "data-kontent-language-codename": language,
            }
          : {})}
      >
        <Header siteName={siteName} logoUrl={logoUrl} items={navItems} locale={locale} />
        <div className="flex-1">{children}</div>
        <Footer footer={footer} siteName={siteName} locale={locale} />
      </div>
    </>
  );
}
