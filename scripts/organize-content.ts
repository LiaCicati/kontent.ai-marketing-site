/**
 * Organize Kontent.ai content into collections for easy searching and management.
 *
 * Collections created:
 *   - Global         → site config, navigation items, footer
 *   - Pages          → all Page content items
 *   - Blog           → all blog post items
 *   - Components     → reusable section blocks (heroes, feature grids, CTAs, etc.)
 *
 * Run: npx tsx scripts/organize-content.ts
 */
import { ManagementClient } from "@kontent-ai/management-sdk";
import * as fs from "fs";
import * as path from "path";

// ── Load .env.local ──────────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) return;
      process.env[trimmed.slice(0, eqIdx).trim()] = trimmed
        .slice(eqIdx + 1)
        .trim();
    });
}

const client = new ManagementClient({
  environmentId: process.env.KONTENT_PROJECT_ID!,
  apiKey: process.env.KONTENT_MANAGEMENT_API_KEY!,
});

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Collection definitions ──────────────────────────────────────────
const COLLECTIONS = [
  {
    name: "Global",
    codename: "global",
    description: "Site-wide config, navigation, and footer",
  },
  {
    name: "Pages",
    codename: "pages",
    description: "All Page content items",
  },
  {
    name: "Blog",
    codename: "blog",
    description: "Blog posts",
  },
  {
    name: "Home Components",
    codename: "home_components",
    description: "Reusable blocks for the Home page",
  },
  {
    name: "Services Components",
    codename: "services_components",
    description: "Reusable blocks for the Services page",
  },
  {
    name: "About Components",
    codename: "about_components",
    description: "Reusable blocks for the About page",
  },
  {
    name: "Contact Components",
    codename: "contact_components",
    description: "Reusable blocks for the Contact page",
  },
];

// ─── Item → Collection mapping ───────────────────────────────────────
const ITEM_COLLECTIONS: Record<string, string> = {
  // Global
  site_config_item: "global",
  nav_home: "global",
  nav_services: "global",
  nav_about: "global",
  nav_contact: "global",
  nav_blog: "global",
  footer_col_company: "global",
  footer_col_resources: "global",
  site_footer: "global",

  // Pages
  page_home: "pages",
  page_services: "pages",
  page_about: "pages",
  page_contact: "pages",

  // Blog
  blog_future_web: "blog",
  blog_cloud_migration: "blog",
  blog_design_systems: "blog",

  // Home Components
  home_hero: "home_components",
  home_logo_cloud: "home_components",
  feature_speed: "home_components",
  feature_secure: "home_components",
  feature_scale: "home_components",
  home_feature_grid: "home_components",
  home_text_image: "home_components",
  testimonial_sarah: "home_components",
  testimonial_james: "home_components",
  home_testimonials: "home_components",
  home_cta: "home_components",

  // Services Components
  services_hero: "services_components",
  service_web: "services_components",
  service_mobile: "services_components",
  service_cloud: "services_components",
  services_feature_grid: "services_components",
  pricing_starter: "services_components",
  pricing_pro: "services_components",
  pricing_enterprise: "services_components",
  services_pricing: "services_components",
  services_cta: "services_components",

  // About Components
  about_hero: "about_components",
  about_text_image: "about_components",
  value_innovation: "about_components",
  value_quality: "about_components",
  value_customer: "about_components",
  about_values_grid: "about_components",
  testimonial_maria: "about_components",
  testimonial_alex: "about_components",
  about_testimonials: "about_components",

  // Contact Components
  contact_hero: "contact_components",
  contact_form_item: "contact_components",
  faq_response: "contact_components",
  faq_consultation: "contact_components",
  faq_timeline: "contact_components",
  contact_faq: "contact_components",
};

// ═════════════════════════════════════════════════════════════════════
async function main() {
  console.log("📁 Organizing Kontent.ai content into collections\n");

  // ── Step 1: Create collections ─────────────────────────────────────
  console.log("Step 1: Creating collections...\n");

  // First, list existing collections to see what we have
  const existing = await client.listCollections().toPromise();
  const existingCodenames = new Set(
    existing.data.collections.map((c) => c.codename)
  );
  console.log(
    `  Existing collections: ${[...existingCodenames].join(", ") || "(default only)"}`
  );

  // Add new collections one by one (using addInto operations)
  const operations: any[] = [];
  for (const col of COLLECTIONS) {
    if (existingCodenames.has(col.codename)) {
      console.log(`  Collection "${col.name}" already exists, skipping`);
      continue;
    }
    operations.push({
      op: "addInto" as const,
      value: {
        name: col.name,
        codename: col.codename,
      },
    });
  }

  if (operations.length > 0) {
    try {
      await client.setCollections().withData(operations).toPromise();
      console.log(`  Created ${operations.length} new collections`);
    } catch (e: any) {
      console.error(`  Error creating collections: ${e.message}`);
      if (e.validationErrors?.length) {
        console.error(
          `  Details:`,
          JSON.stringify(e.validationErrors, null, 2)
        );
      }
    }
  } else {
    console.log("  All collections already exist");
  }
  await delay(300);

  // ── Step 2: Move items into collections ────────────────────────────
  console.log("\nStep 2: Moving items into collections...\n");

  let moved = 0;
  let errors = 0;

  for (const [itemCodename, collectionCodename] of Object.entries(
    ITEM_COLLECTIONS
  )) {
    try {
      await client
        .upsertContentItem()
        .byItemCodename(itemCodename)
        .withData({
          name: itemCodename, // name is required but we just re-use codename; it won't change the actual name
          collection: { codename: collectionCodename },
        })
        .toPromise();
      console.log(`  ✓ ${itemCodename} → ${collectionCodename}`);
      moved++;
    } catch (e: any) {
      console.error(`  ✗ ${itemCodename}: ${e.message}`);
      errors++;
    }
    await delay(80);
  }

  console.log(
    `\n✅ Done! Moved ${moved} items into collections (${errors} errors).`
  );
  console.log("\nYour Kontent.ai dashboard now has these collections:");
  console.log("  📌 Global          — site config, navigation, footer");
  console.log("  📄 Pages           — Home, Services, About, Contact");
  console.log("  📝 Blog            — blog posts");
  console.log("  🏠 Home Components — hero, features, testimonials, CTA");
  console.log("  🔧 Services Comp.  — hero, services grid, pricing, CTA");
  console.log("  ℹ️  About Comp.     — hero, story, values, testimonials");
  console.log("  📬 Contact Comp.   — hero, contact form, FAQ");
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
