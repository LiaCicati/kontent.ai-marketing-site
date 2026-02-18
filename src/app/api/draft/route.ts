import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { createDeliveryClient } from "@kontent-ai/delivery-sdk";
import {
  isValidLocale,
  localeToKontentLanguage,
  defaultLocale,
  type Locale,
} from "@/lib/i18n";

const previewClient = createDeliveryClient({
  environmentId: process.env.KONTENT_PROJECT_ID!,
  previewApiKey: process.env.KONTENT_PREVIEW_API_KEY!,
  defaultQueryConfig: { usePreviewMode: true },
});

/**
 * Resolves a Kontent.ai content item codename + type to a URL path.
 */
async function resolveSlug(
  codename: string,
  type: string,
  language: string
): Promise<string> {
  try {
    const response = await previewClient
      .item(codename)
      .languageParameter(language)
      .depthParameter(0)
      .toPromise();

    const item = response.data.item;

    if (type === "blog_post") {
      const slug = item.elements["slug"]?.value;
      return slug ? `/blog/${slug}` : "/blog";
    }

    if (type === "page") {
      const slug = item.elements["slug"]?.value;
      return slug ? `/${slug}` : "/";
    }
  } catch {
    // Fall through to default
  }

  return "/";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const secret = searchParams.get("secret");

  if (secret !== process.env.KONTENT_PREVIEW_SECRET) {
    return new Response("Invalid secret", { status: 401 });
  }

  const draft = await draftMode();
  draft.enable();

  // {Lang} macro resolves to Kontent.ai language codename ("default" for
  // English, "ro" for Romanian). Map it to the URL locale.
  const kontentLangToLocale: Record<string, Locale> = Object.fromEntries(
    Object.entries(localeToKontentLanguage).map(([loc, lang]) => [lang, loc as Locale])
  );
  const localeParam = searchParams.get("locale") ?? "";
  const locale =
    kontentLangToLocale[localeParam] ??
    (isValidLocale(localeParam) ? localeParam : defaultLocale);
  const language = localeToKontentLanguage[locale];

  // Support both approaches:
  // 1. Direct slug (legacy): ?slug=/services
  // 2. Codename + type (Web Spotlight): ?codename=page_home&type=page
  const slug = searchParams.get("slug");
  const codename = searchParams.get("codename");
  const type = searchParams.get("type") ?? "page";

  if (slug) {
    redirect(`/${locale}${slug.startsWith("/") ? slug : `/${slug}`}`);
  } else if (codename) {
    const resolvedPath = await resolveSlug(codename, type, language);
    redirect(`/${locale}${resolvedPath}`);
  } else {
    redirect(`/${locale}`);
  }
}
