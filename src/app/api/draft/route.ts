import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { createDeliveryClient } from "@kontent-ai/delivery-sdk";

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
  type: string
): Promise<string> {
  try {
    const response = await previewClient
      .item(codename)
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

  // Support both approaches:
  // 1. Direct slug (legacy): ?slug=/services
  // 2. Codename + type (Web Spotlight): ?codename=page_home&type=page
  const slug = searchParams.get("slug");
  const codename = searchParams.get("codename");
  const type = searchParams.get("type") ?? "page";

  if (slug) {
    redirect(slug);
  } else if (codename) {
    const resolvedPath = await resolveSlug(codename, type);
    redirect(resolvedPath);
  } else {
    redirect("/");
  }
}
