import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import type { Metadata } from "next";
import { getPage, getAllPages } from "@/lib/kontent";
import ComponentResolver from "@/components/blocks/ComponentResolver";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateStaticParams() {
  const pages = await getAllPages();
  return pages.map((page) => ({
    slug: page.elements.slug.value
      ? page.elements.slug.value.split("/")
      : undefined,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug?.join("/") ?? "";
  const draft = await draftMode();
  const page = await getPage(slug, draft.isEnabled);

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
  const draft = await draftMode();
  const page = await getPage(slug, draft.isEnabled);

  if (!page) {
    notFound();
  }

  const bodyItems = page.elements.body.linkedItems ?? [];

  return <ComponentResolver items={bodyItems} />;
}
