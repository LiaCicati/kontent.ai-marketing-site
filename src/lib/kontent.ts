import { DeliveryClient, createDeliveryClient } from "@kontent-ai/delivery-sdk";
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
  preview = false
): Promise<Page | null> {
  const client = resolveClient(preview);

  const filterSlug = slug === "" ? "" : slug;

  const response = await client
    .items<Page>()
    .type("page")
    .equalsFilter("elements.slug", filterSlug)
    .depthParameter(3)
    .toPromise();

  return response.data.items[0] ?? null;
}

export async function getAllPages(preview = false): Promise<Page[]> {
  const client = resolveClient(preview);
  const response = await client
    .items<Page>()
    .type("page")
    .depthParameter(3)
    .toPromise();

  return response.data.items;
}

export async function getSiteConfig(
  preview = false
): Promise<SiteConfig | null> {
  const client = resolveClient(preview);
  const response = await client
    .items<SiteConfig>()
    .type("site_config")
    .depthParameter(3)
    .limitParameter(1)
    .toPromise();

  return response.data.items[0] ?? null;
}

export async function getContentItem(
  codename: string,
  preview = false
) {
  const client = resolveClient(preview);
  const response = await client
    .item(codename)
    .depthParameter(3)
    .toPromise();

  return response.data.item ?? null;
}

export async function getBlogPosts(preview = false): Promise<BlogPost[]> {
  const client = resolveClient(preview);
  const response = await client
    .items<BlogPost>()
    .type("blog_post")
    .orderByDescending("elements.publish_date")
    .depthParameter(1)
    .toPromise();

  return response.data.items;
}

export async function getBlogPost(
  slug: string,
  preview = false
): Promise<BlogPost | null> {
  const client = resolveClient(preview);
  const response = await client
    .items<BlogPost>()
    .type("blog_post")
    .equalsFilter("elements.slug", slug)
    .depthParameter(2)
    .toPromise();

  return response.data.items[0] ?? null;
}
