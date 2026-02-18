/**
 * Organize Kontent.ai content into collections and apply editor-friendly names.
 *
 * Collections:
 *   - Global   → site settings, navigation links, footer
 *   - Pages    → all Page content items
 *   - Blog     → all blog post items
 *   - Home     → sections for the Home page
 *   - Services → sections for the Services page
 *   - About    → sections for the About page
 *   - Contact  → sections for the Contact page
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
  { name: "Global", codename: "global" },
  { name: "Pages", codename: "pages" },
  { name: "Blog", codename: "blog" },
  { name: "Home", codename: "home_components" },
  { name: "Services", codename: "services_components" },
  { name: "About", codename: "about_components" },
  { name: "Contact", codename: "contact_components" },
];

// ─── Item → [collection, editor-friendly name] ──────────────────────
const ITEMS: Record<string, [string, string]> = {
  // ── Global ──
  site_config_item: ["global", "Site Settings"],
  nav_home: ["global", "Home Link"],
  nav_services: ["global", "Services Link"],
  nav_about: ["global", "About Link"],
  nav_contact: ["global", "Contact Link"],
  nav_blog: ["global", "Blog Link"],
  footer_col_company: ["global", "Company Column"],
  footer_col_resources: ["global", "Resources Column"],
  site_footer: ["global", "Footer"],

  // ── Pages ──
  page_home: ["pages", "Home Page"],
  page_services: ["pages", "Services Page"],
  page_about: ["pages", "About Page"],
  page_contact: ["pages", "Contact Page"],

  // ── Blog ──
  blog_future_web: ["blog", "The Future of Web Development"],
  blog_cloud_migration: ["blog", "Cloud Migration Best Practices"],
  blog_design_systems: ["blog", "Building Design Systems That Scale"],

  // ── Home ──
  home_hero: ["home_components", "Hero Banner"],
  home_logo_cloud: ["home_components", "Trusted By \u2014 Logos"],
  feature_speed: ["home_components", "Lightning Fast"],
  feature_secure: ["home_components", "Enterprise Security"],
  feature_scale: ["home_components", "Infinite Scale"],
  home_feature_grid: ["home_components", "Why Choose Us"],
  home_text_image: ["home_components", "Our Mission"],
  testimonial_sarah: ["home_components", "Sarah Chen \u2014 Testimonial"],
  testimonial_james: ["home_components", "James Wilson \u2014 Testimonial"],
  home_testimonials: ["home_components", "Client Testimonials"],
  home_cta: ["home_components", "Ready to Get Started?"],

  // ── Services ──
  services_hero: ["services_components", "Hero Banner"],
  service_web: ["services_components", "Web Development"],
  service_mobile: ["services_components", "Mobile Development"],
  service_cloud: ["services_components", "Cloud Solutions"],
  services_feature_grid: ["services_components", "What We Offer"],
  pricing_starter: ["services_components", "Starter Plan"],
  pricing_pro: ["services_components", "Professional Plan"],
  pricing_enterprise: ["services_components", "Enterprise Plan"],
  services_pricing: ["services_components", "Pricing"],
  services_cta: ["services_components", "Need a Custom Solution?"],

  // ── About ──
  about_hero: ["about_components", "Hero Banner"],
  about_text_image: ["about_components", "Our Story"],
  value_innovation: ["about_components", "Innovation First"],
  value_quality: ["about_components", "Quality Obsessed"],
  value_customer: ["about_components", "Customer Focused"],
  about_values_grid: ["about_components", "Our Values"],
  testimonial_maria: ["about_components", "Maria Garcia \u2014 Testimonial"],
  testimonial_alex: ["about_components", "Alex Thompson \u2014 Testimonial"],
  about_testimonials: ["about_components", "Client Testimonials"],

  // ── Contact ──
  contact_hero: ["contact_components", "Hero Banner"],
  contact_form_item: ["contact_components", "Get In Touch Form"],
  faq_response: ["contact_components", "What is your typical response time?"],
  faq_consultation: [
    "contact_components",
    "Do you offer free consultations?",
  ],
  faq_timeline: [
    "contact_components",
    "What is the typical project timeline?",
  ],
  contact_faq: ["contact_components", "Frequently Asked Questions"],
};

// ═════════════════════════════════════════════════════════════════════
async function main() {
  console.log("📁 Organizing content and applying editor-friendly names\n");

  // ── Step 1: Create / rename collections ─────────────────────────────
  console.log("Step 1: Setting up collections...\n");

  const existing = await client.listCollections().toPromise();
  const existingCodenames = new Set(
    existing.data.collections.map((c) => c.codename)
  );
  console.log(
    `  Existing: ${[...existingCodenames].join(", ") || "(default only)"}`
  );

  const operations: any[] = [];

  for (const col of COLLECTIONS) {
    if (existingCodenames.has(col.codename)) {
      // Rename existing collection (e.g. "Home Components" → "Home")
      operations.push({
        op: "replace" as const,
        property_name: "name",
        value: col.name,
        reference: { codename: col.codename },
      });
    } else {
      operations.push({
        op: "addInto" as const,
        value: { name: col.name, codename: col.codename },
      });
    }
  }

  if (operations.length > 0) {
    try {
      await client.setCollections().withData(operations).toPromise();
      console.log(`  ✓ Applied ${operations.length} collection updates`);
    } catch (e: any) {
      console.error(`  Error updating collections: ${e.message}`);
      if (e.validationErrors?.length) {
        console.error(
          `  Details:`,
          JSON.stringify(e.validationErrors, null, 2)
        );
      }
    }
  }
  await delay(300);

  // ── Step 2: Move items + set friendly names ─────────────────────────
  console.log("\nStep 2: Moving items and setting friendly names...\n");

  let updated = 0;
  let errors = 0;

  for (const [codename, [collection, displayName]] of Object.entries(ITEMS)) {
    try {
      await client
        .upsertContentItem()
        .byItemCodename(codename)
        .withData({
          name: displayName,
          collection: { codename: collection },
        })
        .toPromise();
      console.log(`  ✓ ${displayName}`);
      updated++;
    } catch (e: any) {
      console.error(`  ✗ ${codename}: ${e.message}`);
      errors++;
    }
    await delay(80);
  }

  console.log(
    `\n✅ Done! Updated ${updated} items (${errors} errors).\n`
  );
  console.log("Your Kontent.ai dashboard now shows:");
  console.log("  📌 Global   — Site Settings, navigation links, Footer");
  console.log("  📄 Pages    — Home Page, Services Page, About Page, Contact Page");
  console.log("  📝 Blog     — blog posts with their actual titles");
  console.log("  🏠 Home     — Hero Banner, Why Choose Us, Our Mission, ...");
  console.log("  🔧 Services — Hero Banner, What We Offer, Pricing, ...");
  console.log("  ℹ️  About    — Hero Banner, Our Story, Our Values, ...");
  console.log("  📬 Contact  — Hero Banner, Get In Touch Form, FAQ");
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
