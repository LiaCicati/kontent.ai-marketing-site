import {
  DeliveryClient,
  createDeliveryClient,
} from "@kontent-ai/delivery-sdk";
import type { Page, SiteConfig, BlogPost } from "./models";

let clientInstance: DeliveryClient | null = null;
let previewClientInstance: DeliveryClient | null = null;

function getClient(): DeliveryClient {
  if (!clientInstance) {
    clientInstance = createDeliveryClient({
      environmentId: process.env.KONTENT_PROJECT_ID!,
    });
  }
  return clientInstance;
}

function getPreviewClient(): DeliveryClient {
  if (!previewClientInstance) {
    previewClientInstance = createDeliveryClient({
      environmentId: process.env.KONTENT_PROJECT_ID!,
      previewApiKey: process.env.KONTENT_PREVIEW_API_KEY!,
      defaultQueryConfig: {
        usePreviewMode: true,
        waitForLoadingNewContent: true,
      },
    });
  }
  return previewClientInstance;
}

function resolveClient(preview: boolean): DeliveryClient {
  return preview ? getPreviewClient() : getClient();
}

export async function getPage(
  slug: string,
  preview = false,
  language = "default"
): Promise<Page | null> {
  const client = resolveClient(preview);
  const filterSlug = slug === "" ? "" : slug;

  const response = await client
    .items<Page>()
    .type("page")
    .equalsFilter("elements.slug", filterSlug)
    .languageParameter(language)
    .depthParameter(3)
    .toPromise();

  return response.data.items[0] ?? null;
}

export async function getAllPages(
  preview = false,
  language = "default"
): Promise<Page[]> {
  const client = resolveClient(preview);
  const response = await client
    .items<Page>()
    .type("page")
    .languageParameter(language)
    .depthParameter(3)
    .toPromise();

  return response.data.items;
}

export async function getSiteConfig(
  preview = false,
  language = "default"
): Promise<SiteConfig | null> {
  const client = resolveClient(preview);
  const response = await client
    .items<SiteConfig>()
    .type("site_config")
    .languageParameter(language)
    .depthParameter(3)
    .limitParameter(1)
    .toPromise();

  return response.data.items[0] ?? null;
}

export async function getContentItem(
  codename: string,
  preview = false,
  language = "default"
) {
  const client = resolveClient(preview);
  const response = await client
    .item(codename)
    .languageParameter(language)
    .depthParameter(3)
    .toPromise();

  return response.data.item ?? null;
}

export async function getBlogPosts(
  preview = false,
  language = "default"
): Promise<BlogPost[]> {
  const client = resolveClient(preview);
  const response = await client
    .items<BlogPost>()
    .type("blog_post")
    .languageParameter(language)
    .orderByDescending("elements.publish_date")
    .depthParameter(1)
    .toPromise();

  return response.data.items;
}

export async function getBlogPost(
  slug: string,
  preview = false,
  language = "default"
): Promise<BlogPost | null> {
  const client = resolveClient(preview);
  const response = await client
    .items<BlogPost>()
    .type("blog_post")
    .equalsFilter("elements.slug", slug)
    .languageParameter(language)
    .depthParameter(2)
    .toPromise();

  return response.data.items[0] ?? null;
}
