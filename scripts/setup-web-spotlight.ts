import { ManagementClient } from "@kontent-ai/management-sdk";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const client = new ManagementClient({
  environmentId: process.env.KONTENT_PROJECT_ID!,
  apiKey: process.env.KONTENT_MANAGEMENT_API_KEY!,
});

async function run() {
  // Step 1: List all content types to find "page" type
  console.log("=== Step 1: Fetching content types ===");
  const typesResp = await client.listContentTypes().toPromise();
  const pageType = typesResp.data.items.find((t) => t.codename === "page");

  if (!pageType) {
    console.error("Page content type not found!");
    process.exit(1);
  }

  console.log(`Found page type: ${pageType.name} (id: ${pageType.id})`);
  console.log("Current elements:", pageType.elements.map((e) => `${e.codename} (${e.type})`).join(", "));

  // Check if subpages element already exists
  const hasSubpages = pageType.elements.some((e) => e.codename === "subpages");

  if (!hasSubpages) {
    console.log("\n=== Step 2: Adding subpages element to Page type ===");

    // We need to modify the content type to add the subpages element
    // First, get the full type details
    const existingElements = pageType.elements.map((el: any) => {
      const base: any = {
        codename: el.codename,
        type: el.type,
      };

      // Skip adding the element if we can't properly reconstruct it
      // We'll use addContentType approach instead - modify via API
      return base;
    });

    // Use the modify content type endpoint to add the subpages element
    await client
      .modifyContentType()
      .byTypeCodename("page")
      .withData([
        {
          op: "addInto",
          path: "/elements",
          value: {
            name: "Subpages",
            codename: "subpages",
            type: "subpages",
            content_group: undefined,
          } as any,
        },
      ])
      .toPromise();

    console.log("Added 'subpages' element to Page content type.");
  } else {
    console.log("Subpages element already exists on Page type.");
  }

  // Also check blog_post type - add subpages for blog listing page
  const blogPostType = typesResp.data.items.find((t) => t.codename === "blog_post");
  if (blogPostType) {
    console.log(`\nFound blog_post type: ${blogPostType.name}`);
  }

  // Step 3: List all content items to understand the structure
  console.log("\n=== Step 3: Listing all content items ===");
  const itemsResp = await client.listContentItems().toPromise();

  // Build a map of type ID -> type codename
  const typeIdToCodename: Record<string, string> = {};
  for (const t of typesResp.data.items) {
    typeIdToCodename[t.id] = t.codename;
  }

  const pages: { codename: string; name: string; id: string }[] = [];
  const blogPosts: { codename: string; name: string; id: string }[] = [];
  const otherItems: { codename: string; name: string; type: string; id: string }[] = [];

  for (const item of itemsResp.data.items) {
    const typeCodename = typeIdToCodename[item.type.id!] || "unknown";
    if (typeCodename === "page") {
      pages.push({ codename: item.codename, name: item.name, id: item.id });
    } else if (typeCodename === "blog_post") {
      blogPosts.push({ codename: item.codename, name: item.name, id: item.id });
    } else {
      otherItems.push({ codename: item.codename, name: item.name, type: typeCodename, id: item.id });
    }
  }

  console.log("\nPages:");
  pages.forEach((p) => console.log(`  - ${p.name} (${p.codename}) [${p.id}]`));

  console.log("\nBlog Posts:");
  blogPosts.forEach((p) => console.log(`  - ${p.name} (${p.codename}) [${p.id}]`));

  console.log("\nOther items:");
  otherItems.forEach((p) => console.log(`  - ${p.name} (${p.type}: ${p.codename})`));

  // Step 4: Find the home page (slug is empty)
  const homePage = pages.find((p) => p.codename === "page_home" || p.name.toLowerCase().includes("home"));
  if (!homePage) {
    console.error("Could not find home page!");
    process.exit(1);
  }
  console.log(`\nHome page: ${homePage.name} (${homePage.codename})`);

  // Step 5: Get the home page variant to see current state
  console.log("\n=== Step 4: Getting home page language variant ===");
  const homeVariant = await client
    .viewLanguageVariant()
    .byItemCodename(homePage.codename)
    .byLanguageCodename("default")
    .toPromise();

  console.log("Home page elements:");
  homeVariant.data.elements.forEach((el: any) => {
    console.log(`  - ${JSON.stringify(el).substring(0, 200)}`);
  });

  // Step 6: Set up the hierarchy - child pages linked as subpages of home
  const childPages = pages.filter((p) => p.codename !== homePage.codename);

  console.log(`\n=== Step 5: Linking ${childPages.length} child pages to home page ===`);
  console.log("Child pages to link:", childPages.map((p) => p.name).join(", "));

  // Get the subpages element ID from the updated type
  const updatedType = await client.viewContentType().byTypeCodename("page").toPromise();
  const subpagesElement = updatedType.data.elements.find((e) => e.codename === "subpages");

  if (!subpagesElement) {
    console.error("Subpages element not found after modification!");
    process.exit(1);
  }

  console.log(`Subpages element ID: ${subpagesElement.id}`);

  const subpagesValue = childPages.map((p) => ({ codename: p.codename }));
  const subpagesElementData = {
    element: { id: subpagesElement.id! },
    value: subpagesValue,
  };

  const homeCodename = homePage.codename;

  // Helper: create new version -> upsert subpages -> publish
  async function updateAndPublish(lang: string) {
    // Create new version (needed because item is already published)
    try {
      await client
        .createNewVersionOfLanguageVariant()
        .byItemCodename(homeCodename)
        .byLanguageCodename(lang)
        .toPromise();
      console.log(`  Created new version (${lang})`);
    } catch (e: any) {
      // May already be a draft - that's fine
      console.log(`  New version note (${lang}): ${e.message?.substring(0, 100)}`);
    }

    // Upsert subpages
    await client
      .upsertLanguageVariant()
      .byItemCodename(homeCodename)
      .byLanguageCodename(lang)
      .withData(() => ({ elements: [subpagesElementData] }) as any)
      .toPromise();
    console.log(`  Set subpages (${lang})`);

    // Publish
    await client
      .publishLanguageVariant()
      .byItemCodename(homeCodename)
      .byLanguageCodename(lang)
      .withoutData()
      .toPromise();
    console.log(`  Published (${lang})`);
  }

  console.log("\nUpdating default language:");
  await updateAndPublish("default");

  console.log("\nUpdating Romanian language:");
  try {
    await updateAndPublish("ro");
  } catch (e: any) {
    console.log(`  Romanian update failed: ${e.message?.substring(0, 200)}`);
  }

  console.log("\n=== Done! ===");
  console.log("Web Spotlight should now show the full site tree:");
  console.log(`  ${homePage.name}`);
  childPages.forEach((p) => console.log(`    ├── ${p.name}`));
}

run().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
