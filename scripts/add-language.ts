/**
 * Add Romanian language to Kontent.ai project.
 * Usage: npx tsx scripts/add-language.ts
 */
import { createManagementClient } from "@kontent-ai/management-sdk";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
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

const client = createManagementClient({
  environmentId: process.env.KONTENT_PROJECT_ID!,
  apiKey: process.env.KONTENT_MANAGEMENT_API_KEY!,
});

async function main() {
  // Check existing languages
  const langs = await client.listLanguages().toPromise();
  console.log(
    "Existing languages:",
    langs.data.items.map((l) => `${l.codename} (${l.name})`)
  );

  const hasRo = langs.data.items.some((l) => l.codename === "ro");
  if (hasRo) {
    console.log("Romanian already exists, skipping.");
    return;
  }

  // Add Romanian with English as fallback
  await client
    .addLanguage()
    .withData({
      name: "Romanian",
      codename: "ro",
      is_active: true,
      fallback_language: { codename: "default" },
    })
    .toPromise();

  console.log("Romanian language added successfully!");
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
