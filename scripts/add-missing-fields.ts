/**
 * Add missing CMS fields so editors can control ALL text on the website.
 *
 * Fields added:
 *   contact_form  → name_label, name_placeholder, email_label, email_placeholder,
 *                   subject_label, subject_placeholder, message_label,
 *                   message_placeholder, submit_button_label
 *   pricing_card  → popular_badge_label
 *   site_config   → blog_heading, blog_subtitle, blog_empty_message, back_to_blog_label
 *
 * Run: npx tsx scripts/add-missing-fields.ts
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

async function addElement(
  typeCodename: string,
  element: { name: string; codename: string; type: string }
) {
  try {
    await client
      .modifyContentType()
      .byTypeCodename(typeCodename)
      .withData([
        {
          op: "addInto",
          path: "/elements",
          value: element,
        },
      ])
      .toPromise();
    console.log(`  ✓ ${typeCodename} → ${element.codename}`);
  } catch (e: any) {
    if (e.message?.includes("already") || e.message?.includes("not unique")) {
      console.log(`  ○ ${typeCodename} → ${element.codename} (already exists)`);
    } else {
      console.error(
        `  ✗ ${typeCodename} → ${element.codename}: ${e.message}`
      );
    }
  }
  await delay(150);
}

// ═════════════════════════════════════════════════════════════════════
async function main() {
  console.log("🔧 Adding missing CMS fields\n");

  // ── Contact Form fields ─────────────────────────────────────────────
  console.log("Contact Form — adding form field labels & placeholders:\n");

  const contactFields = [
    { name: "Name Label", codename: "name_label", type: "text" },
    { name: "Name Placeholder", codename: "name_placeholder", type: "text" },
    { name: "Email Label", codename: "email_label", type: "text" },
    { name: "Email Placeholder", codename: "email_placeholder", type: "text" },
    { name: "Subject Label", codename: "subject_label", type: "text" },
    {
      name: "Subject Placeholder",
      codename: "subject_placeholder",
      type: "text",
    },
    { name: "Message Label", codename: "message_label", type: "text" },
    {
      name: "Message Placeholder",
      codename: "message_placeholder",
      type: "text",
    },
    {
      name: "Submit Button Label",
      codename: "submit_button_label",
      type: "text",
    },
  ];

  for (const field of contactFields) {
    await addElement("contact_form", field);
  }

  // ── Pricing Card — popular badge label ──────────────────────────────
  console.log("\nPricing Card — adding popular badge label:\n");

  await addElement("pricing_card", {
    name: "Popular Badge Label",
    codename: "popular_badge_label",
    type: "text",
  });

  // ── Site Config — blog page fields ──────────────────────────────────
  console.log("\nSite Config — adding blog page & navigation labels:\n");

  const siteConfigFields = [
    { name: "Blog Heading", codename: "blog_heading", type: "text" },
    { name: "Blog Subtitle", codename: "blog_subtitle", type: "text" },
    {
      name: "Blog Empty Message",
      codename: "blog_empty_message",
      type: "text",
    },
    {
      name: "Back to Blog Label",
      codename: "back_to_blog_label",
      type: "text",
    },
  ];

  for (const field of siteConfigFields) {
    await addElement("site_config", field);
  }

  // ── Now seed the new fields with content ────────────────────────────
  console.log("\n📝 Seeding new fields with content...\n");

  // Detect language
  let languageCodename = "default";
  try {
    const langs = await client.listLanguages().toPromise();
    if (langs.data.items.length > 0) {
      languageCodename = langs.data.items[0].codename;
    }
  } catch {
    // use default
  }

  // Helper to create new version if published
  async function safeUpsertVariant(codename: string, elements: any[]) {
    try {
      await client
        .upsertLanguageVariant()
        .byItemCodename(codename)
        .byLanguageCodename(languageCodename)
        .withData((builder) => ({
          elements: elements.map((el) => builder.textElement(el)),
        }))
        .toPromise();
      console.log(`  ✓ ${codename}`);
    } catch (e: any) {
      if (
        e.message?.includes("published") ||
        e.message?.includes("new version")
      ) {
        // Create new version and retry
        await client
          .createNewVersionOfLanguageVariant()
          .byItemCodename(codename)
          .byLanguageCodename(languageCodename)
          .toPromise();
        await delay(100);
        await client
          .upsertLanguageVariant()
          .byItemCodename(codename)
          .byLanguageCodename(languageCodename)
          .withData((builder) => ({
            elements: elements.map((el) => builder.textElement(el)),
          }))
          .toPromise();
        console.log(`  ✓ ${codename} (new version)`);
      } else {
        console.error(`  ✗ ${codename}: ${e.message}`);
      }
    }
    await delay(100);
  }

  // Contact form content
  await safeUpsertVariant("contact_form_item", [
    { element: { codename: "name_label" }, value: "Name" },
    { element: { codename: "name_placeholder" }, value: "Your name" },
    { element: { codename: "email_label" }, value: "Email" },
    { element: { codename: "email_placeholder" }, value: "you@example.com" },
    { element: { codename: "subject_label" }, value: "Subject" },
    {
      element: { codename: "subject_placeholder" },
      value: "How can we help?",
    },
    { element: { codename: "message_label" }, value: "Message" },
    {
      element: { codename: "message_placeholder" },
      value: "Tell us about your project...",
    },
    { element: { codename: "submit_button_label" }, value: "Send Message" },
  ]);

  // Pricing card — popular badge
  await safeUpsertVariant("pricing_pro", [
    { element: { codename: "popular_badge_label" }, value: "Most Popular" },
  ]);

  // Site config — blog labels
  await safeUpsertVariant("site_config_item", [
    { element: { codename: "blog_heading" }, value: "Blog" },
    {
      element: { codename: "blog_subtitle" },
      value: "Insights, tutorials, and updates from our team.",
    },
    {
      element: { codename: "blog_empty_message" },
      value: "No blog posts yet. Check back soon!",
    },
    { element: { codename: "back_to_blog_label" }, value: "Back to Blog" },
  ]);

  // ── Re-publish updated items ────────────────────────────────────────
  console.log("\n📤 Publishing updated items...\n");

  for (const codename of [
    "contact_form_item",
    "pricing_pro",
    "site_config_item",
  ]) {
    try {
      await client
        .publishLanguageVariant()
        .byItemCodename(codename)
        .byLanguageCodename(languageCodename)
        .withoutData()
        .toPromise();
      console.log(`  ✓ Published ${codename}`);
    } catch (e: any) {
      console.log(`  ○ ${codename}: ${e.message}`);
    }
    await delay(100);
  }

  console.log("\n✅ All done! New fields added and seeded.");
  console.log(
    "   Editors can now control all text on the website from the CMS."
  );
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
