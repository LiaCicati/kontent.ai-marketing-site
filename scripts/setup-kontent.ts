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
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    });
}

const client = new ManagementClient({
  environmentId: process.env.KONTENT_PROJECT_ID!,
  apiKey: process.env.KONTENT_MANAGEMENT_API_KEY!,
});

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Helpers ──────────────────────────────────────────────────────────
async function addType(
  name: string,
  codename: string,
  elements: any[],
  isComponent = false
) {
  console.log(`  Creating content type: ${codename}`);
  try {
    await client
      .addContentType()
      .withData((builder) => ({
        name,
        codename,
        elements: elements.map((el) => {
          switch (el.type) {
            case "text":
              return builder.textElement(el);
            case "rich_text":
              return builder.richTextElement(el);
            case "asset":
              return builder.assetElement(el);
            case "modular_content":
              return builder.linkedItemsElement(el);
            case "multiple_choice":
              return builder.multipleChoiceElement(el);
            case "url_slug":
              return builder.urlSlugElement(el);
            case "date_time":
              return builder.dateTimeElement(el);
            default:
              return el;
          }
        }),
      }))
      .toPromise();
  } catch (e: any) {
    if (e?.response?.status === 409) {
      console.log(`    (already exists, skipping)`);
      return;
    }
    throw e;
  }
  await delay(200);

  if (isComponent) {
    try {
      await client
        .modifyContentType()
        .byTypeCodename(codename)
        .withData([{ op: "replace", path: "/content_component", value: true }])
        .toPromise();
      console.log(`    Marked as component`);
    } catch (e: any) {
      console.log(`    Warning: could not mark as component: ${e.message}`);
    }
    await delay(100);
  }
}

async function addItem(name: string, codename: string, typeCodename: string) {
  console.log(`  Creating item: ${codename}`);
  try {
    await client
      .addContentItem()
      .withData({ name, codename, type: { codename: typeCodename } })
      .toPromise();
  } catch (e: any) {
    if (e?.response?.status === 409) {
      console.log(`    (already exists, skipping)`);
    } else {
      throw e;
    }
  }
  await delay(100);
}

async function upsertVariant(codename: string, elements: any[]) {
  console.log(`  Setting content: ${codename}`);
  await client
    .upsertLanguageVariant()
    .byItemCodename(codename)
    .byLanguageCodename("default")
    .withData((builder) => ({
      elements: elements.map((el) => {
        if (el._type === "text") return builder.textElement(el);
        if (el._type === "rich_text") return builder.richTextElement(el);
        if (el._type === "linked_items") return builder.linkedItemsElement(el);
        if (el._type === "multiple_choice")
          return builder.multipleChoiceElement(el);
        if (el._type === "url_slug") return builder.urlSlugElement(el);
        if (el._type === "date_time") return builder.dateTimeElement(el);
        if (el._type === "asset") return builder.assetElement(el);
        return el;
      }),
    }))
    .toPromise();
  await delay(100);
}

async function publishItem(codename: string) {
  try {
    await client
      .publishLanguageVariant()
      .byItemCodename(codename)
      .byLanguageCodename("default")
      .withoutData()
      .toPromise();
  } catch (e: any) {
    console.log(`    Warning publishing ${codename}: ${e.message}`);
  }
  await delay(100);
}

// Element value helpers
const text = (codename: string, value: string) => ({
  _type: "text",
  element: { codename },
  value,
});
const richText = (codename: string, value: string) => ({
  _type: "rich_text",
  element: { codename },
  value,
});
const linkedItems = (codename: string, refs: string[]) => ({
  _type: "linked_items",
  element: { codename },
  value: refs.map((r) => ({ codename: r })),
});
const multiChoice = (codename: string, refs: string[]) => ({
  _type: "multiple_choice",
  element: { codename },
  value: refs.map((r) => ({ codename: r })),
});
const urlSlug = (codename: string, value: string) => ({
  _type: "url_slug",
  element: { codename },
  value,
  mode: "custom" as const,
});
const dateTime = (codename: string, value: string) => ({
  _type: "date_time",
  element: { codename },
  value,
  display_timezone: null,
});

// ═════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════
async function main() {
  console.log("🚀 Kontent.ai Setup Script\n");

  // ── Step 1: Create Content Types ─────────────────────────────────
  console.log("Step 1: Creating content types...\n");

  // 1. navigation_item (component)
  await addType(
    "Navigation Item",
    "navigation_item",
    [
      { name: "Label", codename: "label", type: "text", is_required: true },
      { name: "URL", codename: "url", type: "text", is_required: true },
    ],
    true
  );

  // Now add self-referencing children after creation
  try {
    await client
      .modifyContentType()
      .byTypeCodename("navigation_item")
      .withData([
        {
          op: "addInto",
          path: "/elements",
          value: {
            name: "Children",
            codename: "children",
            type: "modular_content",
            allowed_content_types: [{ codename: "navigation_item" }],
          },
        },
      ])
      .toPromise();
  } catch (e: any) {
    if (!e?.message?.includes("already")) {
      console.log(`    Note: children element: ${e.message}`);
    }
  }
  await delay(200);

  // 2. footer_column (component)
  await addType(
    "Footer Column",
    "footer_column",
    [
      { name: "Title", codename: "title", type: "text", is_required: true },
      {
        name: "Links",
        codename: "links",
        type: "modular_content",
        allowed_content_types: [{ codename: "navigation_item" }],
      },
    ],
    true
  );

  // 3. feature_card (component)
  await addType(
    "Feature Card",
    "feature_card",
    [
      { name: "Icon", codename: "icon", type: "asset" },
      { name: "Title", codename: "title", type: "text", is_required: true },
      { name: "Description", codename: "description", type: "rich_text" },
    ],
    true
  );

  // 4. testimonial_card (component)
  await addType(
    "Testimonial Card",
    "testimonial_card",
    [
      { name: "Quote", codename: "quote", type: "text", is_required: true },
      {
        name: "Author Name",
        codename: "author_name",
        type: "text",
        is_required: true,
      },
      { name: "Author Role", codename: "author_role", type: "text" },
      { name: "Avatar", codename: "avatar", type: "asset" },
    ],
    true
  );

  // 5. pricing_card (component)
  await addType(
    "Pricing Card",
    "pricing_card",
    [
      {
        name: "Plan Name",
        codename: "plan_name",
        type: "text",
        is_required: true,
      },
      { name: "Price", codename: "price", type: "text", is_required: true },
      { name: "Billing Period", codename: "billing_period", type: "text" },
      { name: "Feature List", codename: "feature_list", type: "rich_text" },
      { name: "CTA Label", codename: "cta_label", type: "text" },
      { name: "CTA URL", codename: "cta_url", type: "text" },
      {
        name: "Is Popular",
        codename: "is_popular",
        type: "multiple_choice",
        mode: "single" as const,
        options: [
          { name: "Yes", codename: "yes" },
          { name: "No", codename: "no" },
        ],
      },
    ],
    true
  );

  // 6. faq_item (component)
  await addType(
    "FAQ Item",
    "faq_item",
    [
      {
        name: "Question",
        codename: "question",
        type: "text",
        is_required: true,
      },
      { name: "Answer", codename: "answer", type: "rich_text" },
    ],
    true
  );

  // ── Standalone content types ─────────────────────────────────────

  // 7. navigation
  await addType("Navigation", "navigation", [
    { name: "Logo", codename: "logo", type: "asset" },
    {
      name: "Items",
      codename: "items",
      type: "modular_content",
      allowed_content_types: [{ codename: "navigation_item" }],
    },
  ]);

  // 8. footer
  await addType("Footer", "footer", [
    {
      name: "Columns",
      codename: "columns",
      type: "modular_content",
      allowed_content_types: [{ codename: "footer_column" }],
    },
    { name: "Copyright Text", codename: "copyright_text", type: "text" },
    {
      name: "Social Links",
      codename: "social_links",
      type: "modular_content",
      allowed_content_types: [{ codename: "navigation_item" }],
    },
  ]);

  // 9. hero
  await addType("Hero", "hero", [
    { name: "Headline", codename: "headline", type: "text", is_required: true },
    { name: "Subheadline", codename: "subheadline", type: "text" },
    { name: "CTA Button Label", codename: "cta_button_label", type: "text" },
    { name: "CTA Button URL", codename: "cta_button_url", type: "text" },
    { name: "Background Image", codename: "background_image", type: "asset" },
  ]);

  // 10. feature_grid
  await addType("Feature Grid", "feature_grid", [
    { name: "Title", codename: "title", type: "text", is_required: true },
    { name: "Subtitle", codename: "subtitle", type: "text" },
    {
      name: "Cards",
      codename: "cards",
      type: "modular_content",
      allowed_content_types: [{ codename: "feature_card" }],
    },
  ]);

  // 11. text_with_image
  await addType("Text With Image", "text_with_image", [
    { name: "Content", codename: "content", type: "rich_text" },
    { name: "Image", codename: "image", type: "asset" },
    {
      name: "Layout",
      codename: "layout",
      type: "multiple_choice",
      mode: "single" as const,
      options: [
        { name: "Image Left", codename: "image_left" },
        { name: "Image Right", codename: "image_right" },
      ],
    },
  ]);

  // 12. testimonials
  await addType("Testimonials", "testimonials", [
    { name: "Title", codename: "title", type: "text", is_required: true },
    {
      name: "Cards",
      codename: "cards",
      type: "modular_content",
      allowed_content_types: [{ codename: "testimonial_card" }],
    },
  ]);

  // 13. call_to_action
  await addType("Call To Action", "call_to_action", [
    { name: "Headline", codename: "headline", type: "text", is_required: true },
    { name: "Body", codename: "body", type: "rich_text" },
    { name: "Button Label", codename: "button_label", type: "text" },
    { name: "Button URL", codename: "button_url", type: "text" },
  ]);

  // 14. pricing_table
  await addType("Pricing Table", "pricing_table", [
    { name: "Title", codename: "title", type: "text", is_required: true },
    { name: "Subtitle", codename: "subtitle", type: "text" },
    {
      name: "Cards",
      codename: "cards",
      type: "modular_content",
      allowed_content_types: [{ codename: "pricing_card" }],
    },
  ]);

  // 15. contact_form
  await addType("Contact Form", "contact_form", [
    { name: "Heading", codename: "heading", type: "text", is_required: true },
    { name: "Description", codename: "description", type: "rich_text" },
    { name: "Success Message", codename: "success_message", type: "text" },
  ]);

  // 16. logo_cloud
  await addType("Logo Cloud", "logo_cloud", [
    { name: "Title", codename: "title", type: "text" },
    { name: "Logos", codename: "logos", type: "asset" },
  ]);

  // 17. faq
  await addType("FAQ", "faq", [
    { name: "Title", codename: "title", type: "text", is_required: true },
    {
      name: "Items",
      codename: "items",
      type: "modular_content",
      allowed_content_types: [{ codename: "faq_item" }],
    },
  ]);

  // 18. rich_text_block
  await addType("Rich Text Block", "rich_text_block", [
    { name: "Body", codename: "body", type: "rich_text" },
  ]);

  // 19. site_config
  await addType("Site Config", "site_config", [
    {
      name: "Site Name",
      codename: "site_name",
      type: "text",
      is_required: true,
    },
    { name: "Logo", codename: "logo", type: "asset" },
    {
      name: "Header Navigation",
      codename: "header_navigation",
      type: "modular_content",
      allowed_content_types: [{ codename: "navigation_item" }],
    },
    {
      name: "Footer",
      codename: "footer",
      type: "modular_content",
      allowed_content_types: [{ codename: "footer" }],
    },
  ]);

  // 20. page
  await addType("Page", "page", [
    { name: "Title", codename: "title", type: "text", is_required: true },
    {
      name: "Slug",
      codename: "slug",
      type: "url_slug",
      depends_on: { element: { codename: "title" } },
    },
    { name: "Meta Description", codename: "meta_description", type: "text" },
    {
      name: "Body",
      codename: "body",
      type: "modular_content",
      allowed_content_types: [
        { codename: "hero" },
        { codename: "feature_grid" },
        { codename: "text_with_image" },
        { codename: "testimonials" },
        { codename: "call_to_action" },
        { codename: "pricing_table" },
        { codename: "contact_form" },
        { codename: "logo_cloud" },
        { codename: "faq" },
        { codename: "rich_text_block" },
      ],
    },
  ]);

  // 21. blog_post
  await addType("Blog Post", "blog_post", [
    { name: "Title", codename: "title", type: "text", is_required: true },
    {
      name: "Slug",
      codename: "slug",
      type: "url_slug",
      depends_on: { element: { codename: "title" } },
    },
    { name: "Summary", codename: "summary", type: "text" },
    { name: "Body", codename: "body", type: "rich_text" },
    { name: "Image", codename: "image", type: "asset" },
    { name: "Publish Date", codename: "publish_date", type: "date_time" },
  ]);

  console.log("\n✅ All content types created!\n");

  // ── Step 2: Create Content Items ─────────────────────────────────
  console.log("Step 2: Creating content items...\n");

  // Navigation items
  const navItemNames = [
    ["Home", "nav_home"],
    ["Services", "nav_services"],
    ["About", "nav_about"],
    ["Contact", "nav_contact"],
    ["Blog", "nav_blog"],
  ];
  for (const [name, codename] of navItemNames) {
    await addItem(name, codename, "navigation_item");
  }

  // Footer columns
  await addItem("Company", "footer_col_company", "footer_column");
  await addItem("Resources", "footer_col_resources", "footer_column");

  // Footer
  await addItem("Site Footer", "site_footer", "footer");

  // Site config
  await addItem("Site Config", "site_config_item", "site_config");

  // ─── Home page components ────────────────────────────────────────
  await addItem("Home Hero", "home_hero", "hero");
  await addItem("Home Logo Cloud", "home_logo_cloud", "logo_cloud");
  await addItem("Feature: Lightning Fast", "feature_speed", "feature_card");
  await addItem("Feature: Enterprise Security", "feature_secure", "feature_card");
  await addItem("Feature: Infinite Scale", "feature_scale", "feature_card");
  await addItem("Home Feature Grid", "home_feature_grid", "feature_grid");
  await addItem("Home Text With Image", "home_text_image", "text_with_image");
  await addItem("Testimonial: Sarah Chen", "testimonial_sarah", "testimonial_card");
  await addItem("Testimonial: James Wilson", "testimonial_james", "testimonial_card");
  await addItem("Home Testimonials", "home_testimonials", "testimonials");
  await addItem("Home CTA", "home_cta", "call_to_action");
  await addItem("Home", "page_home", "page");

  // ─── Services page components ────────────────────────────────────
  await addItem("Services Hero", "services_hero", "hero");
  await addItem("Service: Web Development", "service_web", "feature_card");
  await addItem("Service: Mobile Development", "service_mobile", "feature_card");
  await addItem("Service: Cloud Solutions", "service_cloud", "feature_card");
  await addItem("Services Feature Grid", "services_feature_grid", "feature_grid");
  await addItem("Pricing: Starter", "pricing_starter", "pricing_card");
  await addItem("Pricing: Professional", "pricing_pro", "pricing_card");
  await addItem("Pricing: Enterprise", "pricing_enterprise", "pricing_card");
  await addItem("Services Pricing Table", "services_pricing", "pricing_table");
  await addItem("Services CTA", "services_cta", "call_to_action");
  await addItem("Services", "page_services", "page");

  // ─── About page components ──────────────────────────────────────
  await addItem("About Hero", "about_hero", "hero");
  await addItem("About Text With Image", "about_text_image", "text_with_image");
  await addItem("Value: Innovation First", "value_innovation", "feature_card");
  await addItem("Value: Quality Obsessed", "value_quality", "feature_card");
  await addItem("Value: Customer Focused", "value_customer", "feature_card");
  await addItem("About Values Grid", "about_values_grid", "feature_grid");
  await addItem("Testimonial: Maria Garcia", "testimonial_maria", "testimonial_card");
  await addItem("Testimonial: Alex Thompson", "testimonial_alex", "testimonial_card");
  await addItem("About Testimonials", "about_testimonials", "testimonials");
  await addItem("About", "page_about", "page");

  // ─── Contact page components ─────────────────────────────────────
  await addItem("Contact Hero", "contact_hero", "hero");
  await addItem("Contact Form", "contact_form_item", "contact_form");
  await addItem("FAQ: Response Time", "faq_response", "faq_item");
  await addItem("FAQ: Free Consultation", "faq_consultation", "faq_item");
  await addItem("FAQ: Project Timeline", "faq_timeline", "faq_item");
  await addItem("Contact FAQ", "contact_faq", "faq");
  await addItem("Contact", "page_contact", "page");

  // ─── Blog posts ──────────────────────────────────────────────────
  await addItem("The Future of Web Development", "blog_future_web", "blog_post");
  await addItem("Cloud Migration Best Practices", "blog_cloud_migration", "blog_post");
  await addItem("Building Design Systems That Scale", "blog_design_systems", "blog_post");

  console.log("\n✅ All content items created!\n");

  // ── Step 3: Upsert Language Variants (set content) ───────────────
  console.log("Step 3: Setting content values...\n");

  // Nav items
  await upsertVariant("nav_home", [text("label", "Home"), text("url", "/")]);
  await upsertVariant("nav_services", [text("label", "Services"), text("url", "/services")]);
  await upsertVariant("nav_about", [text("label", "About"), text("url", "/about")]);
  await upsertVariant("nav_contact", [text("label", "Contact"), text("url", "/contact")]);
  await upsertVariant("nav_blog", [text("label", "Blog"), text("url", "/blog")]);

  // Footer columns
  await upsertVariant("footer_col_company", [
    text("title", "Company"),
    linkedItems("links", ["nav_about", "nav_services", "nav_contact"]),
  ]);
  await upsertVariant("footer_col_resources", [
    text("title", "Resources"),
    linkedItems("links", ["nav_blog"]),
  ]);

  // Footer
  await upsertVariant("site_footer", [
    linkedItems("columns", ["footer_col_company", "footer_col_resources"]),
    text("copyright_text", "© 2024 Acme Inc. All rights reserved."),
    linkedItems("social_links", []),
  ]);

  // Site config
  await upsertVariant("site_config_item", [
    text("site_name", "Acme Inc."),
    linkedItems("header_navigation", [
      "nav_home",
      "nav_services",
      "nav_about",
      "nav_contact",
      "nav_blog",
    ]),
    linkedItems("footer", ["site_footer"]),
  ]);

  // ─── Home page content ───────────────────────────────────────────
  await upsertVariant("home_hero", [
    text("headline", "Build Something Amazing"),
    text(
      "subheadline",
      "We help businesses transform their digital presence with cutting-edge solutions."
    ),
    text("cta_button_label", "Get Started"),
    text("cta_button_url", "/contact"),
  ]);

  await upsertVariant("home_logo_cloud", [
    text("title", "Trusted by Industry Leaders"),
  ]);

  await upsertVariant("feature_speed", [
    text("title", "Lightning Fast"),
    richText(
      "description",
      "<p>Our optimized infrastructure ensures your applications load in milliseconds, not seconds.</p>"
    ),
  ]);
  await upsertVariant("feature_secure", [
    text("title", "Enterprise Security"),
    richText(
      "description",
      "<p>Bank-grade encryption and security protocols protect your data around the clock.</p>"
    ),
  ]);
  await upsertVariant("feature_scale", [
    text("title", "Infinite Scale"),
    richText(
      "description",
      "<p>From startup to enterprise, our platform grows seamlessly with your business needs.</p>"
    ),
  ]);

  await upsertVariant("home_feature_grid", [
    text("title", "Why Choose Us"),
    text("subtitle", "Everything you need to succeed in the digital world"),
    linkedItems("cards", ["feature_speed", "feature_secure", "feature_scale"]),
  ]);

  await upsertVariant("home_text_image", [
    richText(
      "content",
      "<h2>Our Mission</h2><p>We believe technology should empower, not complicate. Our team of experts works tirelessly to deliver solutions that are both powerful and intuitive.</p><p>Since 2015, we've helped over 500 businesses achieve their digital transformation goals.</p>"
    ),
    multiChoice("layout", ["image_right"]),
  ]);

  await upsertVariant("testimonial_sarah", [
    text(
      "quote",
      "Working with Acme transformed our entire workflow. The results exceeded our expectations."
    ),
    text("author_name", "Sarah Chen"),
    text("author_role", "CTO, TechForward"),
  ]);
  await upsertVariant("testimonial_james", [
    text(
      "quote",
      "The team's expertise and dedication made all the difference. Highly recommended!"
    ),
    text("author_name", "James Wilson"),
    text("author_role", "CEO, StartupHub"),
  ]);

  await upsertVariant("home_testimonials", [
    text("title", "What Our Clients Say"),
    linkedItems("cards", ["testimonial_sarah", "testimonial_james"]),
  ]);

  await upsertVariant("home_cta", [
    text("headline", "Ready to Get Started?"),
    richText(
      "body",
      "<p>Join thousands of businesses already using our platform to grow their digital presence.</p>"
    ),
    text("button_label", "Start Free Trial"),
    text("button_url", "/contact"),
  ]);

  await upsertVariant("page_home", [
    text("title", "Home"),
    urlSlug("slug", ""),
    text(
      "meta_description",
      "Acme Inc. - Build something amazing with our cutting-edge digital solutions."
    ),
    linkedItems("body", [
      "home_hero",
      "home_logo_cloud",
      "home_feature_grid",
      "home_text_image",
      "home_testimonials",
      "home_cta",
    ]),
  ]);

  // ─── Services page content ───────────────────────────────────────
  await upsertVariant("services_hero", [
    text("headline", "Our Services"),
    text(
      "subheadline",
      "Comprehensive solutions tailored to your business needs"
    ),
  ]);

  await upsertVariant("service_web", [
    text("title", "Web Development"),
    richText(
      "description",
      "<p>Custom web applications built with modern technologies and best practices.</p>"
    ),
  ]);
  await upsertVariant("service_mobile", [
    text("title", "Mobile Development"),
    richText(
      "description",
      "<p>Native and cross-platform mobile apps that delight users on every device.</p>"
    ),
  ]);
  await upsertVariant("service_cloud", [
    text("title", "Cloud Solutions"),
    richText(
      "description",
      "<p>Scalable cloud infrastructure and migration services for modern businesses.</p>"
    ),
  ]);

  await upsertVariant("services_feature_grid", [
    text("title", "What We Offer"),
    text("subtitle", "Full-stack digital solutions"),
    linkedItems("cards", ["service_web", "service_mobile", "service_cloud"]),
  ]);

  await upsertVariant("pricing_starter", [
    text("plan_name", "Starter"),
    text("price", "$29"),
    text("billing_period", "/month"),
    richText(
      "feature_list",
      "<ul><li>5 Projects</li><li>10GB Storage</li><li>Email Support</li><li>Basic Analytics</li></ul>"
    ),
    text("cta_label", "Get Started"),
    text("cta_url", "/contact"),
    multiChoice("is_popular", ["no"]),
  ]);
  await upsertVariant("pricing_pro", [
    text("plan_name", "Professional"),
    text("price", "$79"),
    text("billing_period", "/month"),
    richText(
      "feature_list",
      "<ul><li>Unlimited Projects</li><li>100GB Storage</li><li>Priority Support</li><li>Advanced Analytics</li><li>Custom Integrations</li></ul>"
    ),
    text("cta_label", "Get Started"),
    text("cta_url", "/contact"),
    multiChoice("is_popular", ["yes"]),
  ]);
  await upsertVariant("pricing_enterprise", [
    text("plan_name", "Enterprise"),
    text("price", "$199"),
    text("billing_period", "/month"),
    richText(
      "feature_list",
      "<ul><li>Unlimited Everything</li><li>1TB Storage</li><li>24/7 Dedicated Support</li><li>Custom Development</li><li>SLA Guarantee</li></ul>"
    ),
    text("cta_label", "Contact Sales"),
    text("cta_url", "/contact"),
    multiChoice("is_popular", ["no"]),
  ]);

  await upsertVariant("services_pricing", [
    text("title", "Simple, Transparent Pricing"),
    text("subtitle", "Choose the plan that fits your needs"),
    linkedItems("cards", [
      "pricing_starter",
      "pricing_pro",
      "pricing_enterprise",
    ]),
  ]);

  await upsertVariant("services_cta", [
    text("headline", "Need a Custom Solution?"),
    richText(
      "body",
      "<p>Our team can build a tailored package that meets your specific requirements.</p>"
    ),
    text("button_label", "Talk to Sales"),
    text("button_url", "/contact"),
  ]);

  await upsertVariant("page_services", [
    text("title", "Services"),
    urlSlug("slug", "services"),
    text(
      "meta_description",
      "Explore our comprehensive range of digital services."
    ),
    linkedItems("body", [
      "services_hero",
      "services_feature_grid",
      "services_pricing",
      "services_cta",
    ]),
  ]);

  // ─── About page content ──────────────────────────────────────────
  await upsertVariant("about_hero", [
    text("headline", "About Acme Inc."),
    text("subheadline", "Passionate about technology, driven by results"),
  ]);

  await upsertVariant("about_text_image", [
    richText(
      "content",
      "<h2>Our Story</h2><p>Founded in 2015, Acme Inc. started with a simple mission: make technology accessible to businesses of all sizes.</p><p>Today, we're a team of over 100 engineers, designers, and strategists working across three continents to deliver exceptional digital experiences.</p>"
    ),
    multiChoice("layout", ["image_left"]),
  ]);

  await upsertVariant("value_innovation", [
    text("title", "Innovation First"),
    richText(
      "description",
      "<p>We embrace new technologies and approaches to stay ahead of the curve.</p>"
    ),
  ]);
  await upsertVariant("value_quality", [
    text("title", "Quality Obsessed"),
    richText(
      "description",
      "<p>Every line of code, every pixel, and every interaction is crafted with care.</p>"
    ),
  ]);
  await upsertVariant("value_customer", [
    text("title", "Customer Focused"),
    richText(
      "description",
      "<p>Your success is our success. We measure our performance by your results.</p>"
    ),
  ]);

  await upsertVariant("about_values_grid", [
    text("title", "Our Values"),
    text("subtitle", "The principles that guide everything we do"),
    linkedItems("cards", [
      "value_innovation",
      "value_quality",
      "value_customer",
    ]),
  ]);

  await upsertVariant("testimonial_maria", [
    text(
      "quote",
      "Acme's team feels like an extension of our own. They truly understand our business."
    ),
    text("author_name", "Maria Garcia"),
    text("author_role", "VP Product, DataFlow"),
  ]);
  await upsertVariant("testimonial_alex", [
    text(
      "quote",
      "The ROI we've seen since partnering with Acme has been remarkable."
    ),
    text("author_name", "Alex Thompson"),
    text("author_role", "Director of Engineering, CloudBase"),
  ]);

  await upsertVariant("about_testimonials", [
    text("title", "Trusted by Leading Companies"),
    linkedItems("cards", ["testimonial_maria", "testimonial_alex"]),
  ]);

  await upsertVariant("page_about", [
    text("title", "About"),
    urlSlug("slug", "about"),
    text(
      "meta_description",
      "Learn about Acme Inc. and our mission to empower businesses."
    ),
    linkedItems("body", [
      "about_hero",
      "about_text_image",
      "about_values_grid",
      "about_testimonials",
    ]),
  ]);

  // ─── Contact page content ────────────────────────────────────────
  await upsertVariant("contact_hero", [
    text("headline", "Get in Touch"),
    text("subheadline", "We'd love to hear from you"),
  ]);

  await upsertVariant("contact_form_item", [
    text("heading", "Send Us a Message"),
    richText(
      "description",
      "<p>Fill out the form below and we'll get back to you within 24 hours.</p>"
    ),
    text("success_message", "Thank you! We'll be in touch soon."),
  ]);

  await upsertVariant("faq_response", [
    text("question", "What is your typical response time?"),
    richText(
      "answer",
      "<p>We aim to respond to all inquiries within 24 business hours.</p>"
    ),
  ]);
  await upsertVariant("faq_consultation", [
    text("question", "Do you offer free consultations?"),
    richText(
      "answer",
      "<p>Yes! We offer a complimentary 30-minute consultation to discuss your project needs.</p>"
    ),
  ]);
  await upsertVariant("faq_timeline", [
    text("question", "What is the typical project timeline?"),
    richText(
      "answer",
      "<p>Project timelines vary based on scope and complexity. A typical project takes 4-12 weeks from kickoff to launch.</p>"
    ),
  ]);

  await upsertVariant("contact_faq", [
    text("title", "Frequently Asked Questions"),
    linkedItems("items", ["faq_response", "faq_consultation", "faq_timeline"]),
  ]);

  await upsertVariant("page_contact", [
    text("title", "Contact"),
    urlSlug("slug", "contact"),
    text(
      "meta_description",
      "Contact Acme Inc. for a free consultation."
    ),
    linkedItems("body", ["contact_hero", "contact_form_item", "contact_faq"]),
  ]);

  // ─── Blog posts ──────────────────────────────────────────────────
  await upsertVariant("blog_future_web", [
    text("title", "The Future of Web Development"),
    urlSlug("slug", "future-of-web-development"),
    text(
      "summary",
      "Exploring the latest trends shaping the future of web development."
    ),
    richText(
      "body",
      "<h2>The Future of Web Development</h2><p>The web development landscape is evolving rapidly. From AI-powered tools to edge computing, new technologies are reshaping how we build and deploy applications.</p><p>In this article, we explore the key trends that will define the next decade of web development.</p>"
    ),
    dateTime("publish_date", "2024-01-15T00:00:00Z"),
  ]);
  await upsertVariant("blog_cloud_migration", [
    text("title", "Cloud Migration Best Practices"),
    urlSlug("slug", "cloud-migration-best-practices"),
    text(
      "summary",
      "A comprehensive guide to migrating your infrastructure to the cloud."
    ),
    richText(
      "body",
      "<h2>Cloud Migration Best Practices</h2><p>Moving to the cloud is one of the most impactful decisions a business can make. But without proper planning, it can also be one of the most challenging.</p><p>Follow these best practices to ensure a smooth and successful cloud migration.</p>"
    ),
    dateTime("publish_date", "2024-01-10T00:00:00Z"),
  ]);
  await upsertVariant("blog_design_systems", [
    text("title", "Building Design Systems That Scale"),
    urlSlug("slug", "building-design-systems-that-scale"),
    text(
      "summary",
      "How to create and maintain design systems for growing organizations."
    ),
    richText(
      "body",
      "<h2>Building Design Systems That Scale</h2><p>Design systems are the backbone of consistent, efficient product development. But building one that scales requires careful planning and ongoing investment.</p><p>Here's how we approach design systems at Acme Inc.</p>"
    ),
    dateTime("publish_date", "2024-01-05T00:00:00Z"),
  ]);

  console.log("\n✅ All content values set!\n");

  // ── Step 4: Publish all items ────────────────────────────────────
  console.log("Step 4: Publishing all content items...\n");

  const allItems = [
    // Nav items
    "nav_home", "nav_services", "nav_about", "nav_contact", "nav_blog",
    // Footer
    "footer_col_company", "footer_col_resources", "site_footer",
    // Site config
    "site_config_item",
    // Home components
    "home_hero", "home_logo_cloud",
    "feature_speed", "feature_secure", "feature_scale",
    "home_feature_grid", "home_text_image",
    "testimonial_sarah", "testimonial_james",
    "home_testimonials", "home_cta",
    "page_home",
    // Services components
    "services_hero",
    "service_web", "service_mobile", "service_cloud",
    "services_feature_grid",
    "pricing_starter", "pricing_pro", "pricing_enterprise",
    "services_pricing", "services_cta",
    "page_services",
    // About components
    "about_hero", "about_text_image",
    "value_innovation", "value_quality", "value_customer",
    "about_values_grid",
    "testimonial_maria", "testimonial_alex",
    "about_testimonials",
    "page_about",
    // Contact components
    "contact_hero", "contact_form_item",
    "faq_response", "faq_consultation", "faq_timeline",
    "contact_faq",
    "page_contact",
    // Blog posts
    "blog_future_web", "blog_cloud_migration", "blog_design_systems",
  ];

  for (const codename of allItems) {
    await publishItem(codename);
  }

  console.log("\n🎉 Setup complete! All content types and demo content have been created and published.");
  console.log("You can now run 'npm run dev' to start the development server.\n");
}

main().catch((err) => {
  console.error("❌ Setup failed:", err);
  process.exit(1);
});
