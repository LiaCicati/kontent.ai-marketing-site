import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import type { Metadata } from "next";
import { getPage, getAllPages } from "@/lib/kontent";
import { locales, localeToKontentLanguage, type Locale } from "@/lib/i18n";
import ComponentResolver from "@/components/blocks/ComponentResolver";

interface PageProps {
  params: Promise<{ locale: string; slug?: string[] }>;
}

export async function generateStaticParams() {
  const params: { locale: string; slug?: string[] }[] = [];

  for (const locale of locales) {
    const language = localeToKontentLanguage[locale];
    const pages = await getAllPages(false, language);

    for (const page of pages) {
      params.push({
        locale,
        slug: page.elements.slug.value
          ? page.elements.slug.value.split("/")
          : undefined,
      });
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug?.join("/") ?? "";
  const language =
    localeToKontentLanguage[resolvedParams.locale as Locale] ?? "default";
  const draft = await draftMode();
  const page = await getPage(slug, draft.isEnabled, language);

  if (!page) return {};

  return {
    title: page.elements.title.value,
    description: page.elements.meta_description.value,
  };
}

export const revalidate = 60;

export default async function CatchAllPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug?.join("/") ?? "";
  const locale = resolvedParams.locale;
  const language = localeToKontentLanguage[locale as Locale] ?? "default";
  const draft = await draftMode();
  const page = await getPage(slug, draft.isEnabled, language);

  if (!page) {
    notFound();
  }

  const bodyItems = page.elements.body.linkedItems ?? [];

  return <ComponentResolver items={bodyItems} locale={locale} />;
}
