import { ManagementClient } from "@kontent-ai/management-sdk";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const client = new ManagementClient({
  environmentId: process.env.KONTENT_PROJECT_ID!,
  apiKey: process.env.KONTENT_MANAGEMENT_API_KEY!,
});

async function run() {
  // Step 1: Update the subpages element to also allow blog_post type
  console.log("=== Step 1: Updating subpages element to allow blog_post ===");
  const typesResp = await client.listContentTypes().toPromise();
  const pageType = typesResp.data.items.find((t) => t.codename === "page")!;
  const blogPostType = typesResp.data.items.find((t) => t.codename === "blog_post")!;

  const subpagesEl = pageType.elements.find((e) => e.codename === "subpages") as any;

  // Check current allowed_content_types on the subpages element
  console.log("Current subpages element config:", JSON.stringify(subpagesEl._raw || subpagesEl, null, 2).substring(0, 500));

  // Modify the subpages element to allow both page and blog_post
  try {
    await client
      .modifyContentType()
      .byTypeCodename("page")
      .withData([
        {
          op: "replace",
          path: `/elements/codename:subpages/allowed_content_types`,
          value: [
            { codename: "page" },
            { codename: "blog_post" },
          ],
        } as any,
      ])
      .toPromise();
    console.log("Updated subpages to allow page + blog_post types.");
  } catch (e: any) {
    console.log("Note updating allowed types:", e.message?.substring(0, 200));
    console.log("Subpages element may already allow all types or use different config.");
  }

  // Step 2: Check if a Blog page already exists
  console.log("\n=== Step 2: Checking for existing Blog page ===");
  const itemsResp = await client.listContentItems().toPromise();
  const typeIdToCodename: Record<string, string> = {};
  for (const t of typesResp.data.items) {
    typeIdToCodename[t.id] = t.codename;
  }

  const pages: { codename: string; name: string; id: string }[] = [];
  const blogPosts: { codename: string; name: string; id: string }[] = [];

  for (const item of itemsResp.data.items) {
    const typeCodename = typeIdToCodename[item.type.id!] || "unknown";
    if (typeCodename === "page") {
      pages.push({ codename: item.codename, name: item.name, id: item.id });
    } else if (typeCodename === "blog_post") {
      blogPosts.push({ codename: item.codename, name: item.name, id: item.id });
    }
  }

  console.log("Pages:", pages.map((p) => p.name).join(", "));
  console.log("Blog posts:", blogPosts.map((p) => p.name).join(", "));

  let blogPage = pages.find((p) => p.codename === "page_blog");

  // Step 3: Create Blog page if it doesn't exist
  if (!blogPage) {
    console.log("\n=== Step 3: Creating Blog page ===");

    // Get element IDs from the page type
    const fullPageType = await client.viewContentType().byTypeCodename("page").toPromise();
    const titleEl = fullPageType.data.elements.find((e) => e.codename === "title")!;
    const slugEl = fullPageType.data.elements.find((e) => e.codename === "slug")!;
    const metaEl = fullPageType.data.elements.find((e) => e.codename === "meta_description")!;
    const subpagesElement = fullPageType.data.elements.find((e) => e.codename === "subpages")!;

    // Create the Blog page content item
    const addResp = await client
      .addContentItem()
      .withData({
        name: "Blog",
        codename: "page_blog",
        type: { codename: "page" },
      })
      .toPromise();

    console.log(`Created Blog page: ${addResp.data.codename} (${addResp.data.id})`);
    blogPage = { codename: addResp.data.codename, name: addResp.data.name, id: addResp.data.id };

    // Upsert default language variant with blog posts as subpages
    await client
      .upsertLanguageVariant()
      .byItemCodename("page_blog")
      .byLanguageCodename("default")
      .withData(() => ({
        elements: [
          { element: { id: titleEl.id! }, value: "Blog" },
          { element: { id: slugEl.id! }, mode: "custom", value: "blog" },
          { element: { id: metaEl.id! }, value: "Read our latest articles on web development, cloud solutions, and design systems." },
          {
            element: { id: subpagesElement.id! },
            value: blogPosts.map((p) => ({ codename: p.codename })),
          },
        ],
      }) as any)
      .toPromise();
    console.log("Set Blog page content + blog posts as subpages (default).");

    // Publish default
    await client
      .publishLanguageVariant()
      .byItemCodename("page_blog")
      .byLanguageCodename("default")
      .withoutData()
      .toPromise();
    console.log("Published Blog page (default).");

    // Upsert Romanian variant
    try {
      await client
        .upsertLanguageVariant()
        .byItemCodename("page_blog")
        .byLanguageCodename("ro")
        .withData(() => ({
          elements: [
            { element: { id: titleEl.id! }, value: "Blog" },
            { element: { id: slugEl.id! }, mode: "custom", value: "blog" },
            { element: { id: metaEl.id! }, value: "Citește cele mai recente articole despre dezvoltare web, soluții cloud și sisteme de design." },
            {
              element: { id: subpagesElement.id! },
              value: blogPosts.map((p) => ({ codename: p.codename })),
            },
          ],
        }) as any)
        .toPromise();

      await client
        .publishLanguageVariant()
        .byItemCodename("page_blog")
        .byLanguageCodename("ro")
        .withoutData()
        .toPromise();
      console.log("Published Blog page (Romanian).");
    } catch (e: any) {
      console.log("Romanian Blog page note:", e.message?.substring(0, 200));
    }
  } else {
    console.log(`Blog page already exists: ${blogPage.name} (${blogPage.codename})`);
  }

  // Step 4: Update Home Page subpages to include Blog page
  console.log("\n=== Step 4: Updating Home Page subpages ===");
  const homePage = pages.find((p) => p.codename === "page_home")!;
  const fullPageType = await client.viewContentType().byTypeCodename("page").toPromise();
  const subpagesElement = fullPageType.data.elements.find((e) => e.codename === "subpages")!;

  // All child pages including the new Blog page
  const childPages = pages
    .filter((p) => p.codename !== "page_home")
    .map((p) => ({ codename: p.codename }));

  // Add blog page if not already in the list
  if (!childPages.some((p) => p.codename === "page_blog")) {
    childPages.push({ codename: "page_blog" });
  }

  console.log("Child pages for Home:", childPages.map((p) => p.codename).join(", "));

  const subpagesElementData = {
    element: { id: subpagesElement.id! },
    value: childPages,
  };

  // Update default language
  try {
    await client
      .createNewVersionOfLanguageVariant()
      .byItemCodename("page_home")
      .byLanguageCodename("default")
      .toPromise();
    console.log("Created new version of Home Page (default).");
  } catch (e: any) {
    console.log("Home new version note:", e.message?.substring(0, 100));
  }

  await client
    .upsertLanguageVariant()
    .byItemCodename("page_home")
    .byLanguageCodename("default")
    .withData(() => ({ elements: [subpagesElementData] }) as any)
    .toPromise();

  await client
    .publishLanguageVariant()
    .byItemCodename("page_home")
    .byLanguageCodename("default")
    .withoutData()
    .toPromise();
  console.log("Updated and published Home Page (default).");

  // Update Romanian language
  try {
    await client
      .createNewVersionOfLanguageVariant()
      .byItemCodename("page_home")
      .byLanguageCodename("ro")
      .toPromise();

    await client
      .upsertLanguageVariant()
      .byItemCodename("page_home")
      .byLanguageCodename("ro")
      .withData(() => ({ elements: [subpagesElementData] }) as any)
      .toPromise();

    await client
      .publishLanguageVariant()
      .byItemCodename("page_home")
      .byLanguageCodename("ro")
      .withoutData()
      .toPromise();
    console.log("Updated and published Home Page (Romanian).");
  } catch (e: any) {
    console.log("Romanian Home update note:", e.message?.substring(0, 200));
  }

  console.log("\n=== Done! ===");
  console.log("Web Spotlight tree should now show:");
  console.log("  Home Page");
  console.log("    ├── Services Page");
  console.log("    ├── About Page");
  console.log("    ├── Contact Page");
  console.log("    └── Blog");
  blogPosts.forEach((p, i) => {
    const prefix = i === blogPosts.length - 1 ? "└──" : "├──";
    console.log(`         ${prefix} ${p.name}`);
  });
}

run().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
