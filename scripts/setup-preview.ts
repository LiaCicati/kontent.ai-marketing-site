/**
 * Configure Kontent.ai preview URLs so editors can click "Preview"
 * in the CMS and see unpublished content on the Next.js site.
 *
 * Usage:
 *   SITE_URL=https://your-site.vercel.app npx tsx scripts/setup-preview.ts
 *
 * For local development:
 *   SITE_URL=http://localhost:3000 npx tsx scripts/setup-preview.ts
 *
 * Required env vars (in .env.local):
 *   KONTENT_PROJECT_ID
 *   KONTENT_MANAGEMENT_API_KEY
 *   KONTENT_PREVIEW_SECRET
 */
import { createManagementClient } from "@kontent-ai/management-sdk";
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

const ENVIRONMENT_ID = process.env.KONTENT_PROJECT_ID!;
const MANAGEMENT_API_KEY = process.env.KONTENT_MANAGEMENT_API_KEY!;
const PREVIEW_SECRET = process.env.KONTENT_PREVIEW_SECRET!;
const SITE_URL = process.env.SITE_URL;

if (!ENVIRONMENT_ID || !MANAGEMENT_API_KEY || !PREVIEW_SECRET) {
  console.error(
    "Missing required env vars: KONTENT_PROJECT_ID, KONTENT_MANAGEMENT_API_KEY, KONTENT_PREVIEW_SECRET"
  );
  process.exit(1);
}

if (!SITE_URL) {
  console.error(
    "Missing SITE_URL env var. Provide it as:\n" +
      "  SITE_URL=https://your-site.vercel.app npx tsx scripts/setup-preview.ts\n" +
      "  SITE_URL=http://localhost:3000 npx tsx scripts/setup-preview.ts"
  );
  process.exit(1);
}

// Remove trailing slash
const baseUrl = SITE_URL.replace(/\/$/, "");
const draftEndpoint = `${baseUrl}/api/draft?secret=${PREVIEW_SECRET}`;

const client = createManagementClient({
  environmentId: ENVIRONMENT_ID,
  apiKey: MANAGEMENT_API_KEY,
});

async function main() {
  console.log(`\nConfiguring preview URLs for: ${baseUrl}\n`);

  // Check if a "web" space exists for Web Spotlight
  const spaces = await client.listSpaces().toPromise();
  const webSpace = spaces.rawData.find(
    (s: { codename: string }) => s.codename === "web"
  );

  // Space domains for Web Spotlight iframe
  const space_domains = webSpace
    ? [{ space: { codename: "web" as const }, domain: baseUrl }]
    : [];

  // Preview URL patterns for each content type that has its own route.
  // We use {Codename} instead of {URLslug} so items with an empty slug
  // (e.g. the Home page) still get a working preview URL.
  const preview_url_patterns = [
    {
      // Pages (home, services, about, etc.)
      content_type: { codename: "page" as const },
      url_patterns: [
        {
          space: null,
          url_pattern: `${draftEndpoint}&codename={Codename}&type=page`,
        },
      ],
    },
    {
      // Blog posts live under /blog/{slug}
      content_type: { codename: "blog_post" as const },
      url_patterns: [
        {
          space: null,
          url_pattern: `${draftEndpoint}&codename={Codename}&type=blog_post`,
        },
      ],
    },
  ];

  try {
    await client
      .modifyPreviewConfiguration()
      .withData({
        space_domains,
        preview_url_patterns,
      })
      .toPromise();

    console.log("Preview URLs configured successfully!\n");
    console.log("Content type URL patterns:");
    console.log(
      `  page      → ${draftEndpoint}&codename={Codename}&type=page`
    );
    console.log(
      `  blog_post → ${draftEndpoint}&codename={Codename}&type=blog_post`
    );
    console.log(
      "\nEditors can now click 'Preview' in the Kontent.ai dashboard"
    );
    console.log("to see unpublished content on the site.\n");
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: unknown } };
    console.error("Failed to configure preview URLs:", err.message);
    if (err.response?.data) {
      console.error(JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
