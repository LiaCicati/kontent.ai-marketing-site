/**
 * Create Romanian translations for all content items in the Kontent.ai project.
 *
 * This script:
 * 1. Lists all content items
 * 2. Gets their default language variants
 * 3. Upserts Romanian (ro) language variants with translated content
 * 4. Publishes each Romanian variant
 *
 * Run: npx tsx scripts/add-translations.ts
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

// ── Element helpers (with _type markers for builder dispatch) ────────
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

// ── Map element to correct builder method ────────────────────────────
function mapElement(builder: any, el: any) {
  switch (el._type) {
    case "text":
      return builder.textElement(el);
    case "rich_text":
      return builder.richTextElement(el);
    case "linked_items":
      return builder.linkedItemsElement(el);
    case "multiple_choice":
      return builder.multipleChoiceElement(el);
    case "url_slug":
      return builder.urlSlugElement(el);
    case "date_time":
      return builder.dateTimeElement(el);
    case "asset":
      return builder.assetElement(el);
    default:
      return el;
  }
}

// ── Upsert + publish helper ──────────────────────────────────────────
async function upsertRoVariant(codename: string, elements: any[]) {
  console.log(`  Upserting Romanian variant: ${codename}`);
  try {
    await client
      .upsertLanguageVariant()
      .byItemCodename(codename)
      .byLanguageCodename("ro")
      .withData((builder) => ({
        elements: elements.map((el) => mapElement(builder, el)),
      }))
      .toPromise();
  } catch (e: any) {
    if (
      e.message?.includes("published") ||
      e.message?.includes("new version")
    ) {
      console.log(`    (creating new version for ${codename})`);
      try {
        await client
          .createNewVersionOfLanguageVariant()
          .byItemCodename(codename)
          .byLanguageCodename("ro")
          .toPromise();
        await delay(150);
        await client
          .upsertLanguageVariant()
          .byItemCodename(codename)
          .byLanguageCodename("ro")
          .withData((builder) => ({
            elements: elements.map((el) => mapElement(builder, el)),
          }))
          .toPromise();
      } catch (retryErr: any) {
        console.error(`    ERROR retry ${codename}: ${retryErr.message}`);
        if (retryErr.validationErrors?.length) {
          console.error(JSON.stringify(retryErr.validationErrors, null, 2));
        }
        return false;
      }
    } else {
      console.error(`    ERROR ${codename}: ${e.message}`);
      if (e.validationErrors?.length) {
        console.error(JSON.stringify(e.validationErrors, null, 2));
      }
      return false;
    }
  }
  await delay(150);

  // Publish
  try {
    await client
      .publishLanguageVariant()
      .byItemCodename(codename)
      .byLanguageCodename("ro")
      .withoutData()
      .toPromise();
    console.log(`    Published ${codename} (ro)`);
  } catch (e: any) {
    console.log(`    Warning publishing ${codename}: ${e.message}`);
  }
  await delay(150);
  return true;
}

// ═════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════
async function main() {
  console.log("Adding Romanian translations for all content items\n");

  // Verify Romanian language exists
  const langs = await client.listLanguages().toPromise();
  const hasRo = langs.data.items.some((l) => l.codename === "ro");
  if (!hasRo) {
    console.error(
      "Romanian language (ro) not found in project. Run add-language.ts first."
    );
    process.exit(1);
  }
  console.log("Romanian language found. Starting translations...\n");

  let success = 0;
  let errors = 0;

  async function track(codename: string, elements: any[]) {
    const ok = await upsertRoVariant(codename, elements);
    if (ok) success++;
    else errors++;
  }

  // ─── Navigation Items ───────────────────────────────────────────────
  console.log("--- Navigation Items ---\n");

  await track("nav_home", [
    text("label", "Acasa"),
    text("url", "/"),
  ]);

  await track("nav_services", [
    text("label", "Servicii"),
    text("url", "/services"),
  ]);

  await track("nav_about", [
    text("label", "Despre noi"),
    text("url", "/about"),
  ]);

  await track("nav_contact", [
    text("label", "Contact"),
    text("url", "/contact"),
  ]);

  await track("nav_blog", [
    text("label", "Blog"),
    text("url", "/blog"),
  ]);

  // ─── Footer Columns ────────────────────────────────────────────────
  console.log("\n--- Footer ---\n");

  await track("footer_col_company", [
    text("title", "Companie"),
    linkedItems("links", ["nav_about", "nav_services", "nav_contact"]),
  ]);

  await track("footer_col_resources", [
    text("title", "Resurse"),
    linkedItems("links", ["nav_blog"]),
  ]);

  await track("site_footer", [
    linkedItems("columns", ["footer_col_company", "footer_col_resources"]),
    text("copyright_text", "\u00a9 2024 Acme Inc. Toate drepturile rezervate."),
    linkedItems("social_links", []),
  ]);

  // ─── Site Config ───────────────────────────────────────────────────
  console.log("\n--- Site Config ---\n");

  await track("site_config_item", [
    text("site_name", "Acme Inc."),
    linkedItems("header_navigation", [
      "nav_home",
      "nav_services",
      "nav_about",
      "nav_contact",
      "nav_blog",
    ]),
    linkedItems("footer", ["site_footer"]),
    text("blog_heading", "Blog"),
    text("blog_subtitle", "Perspective, tutoriale si noutati de la echipa noastra."),
    text("blog_empty_message", "Nu exista articole momentan."),
    text("back_to_blog_label", "Inapoi la blog"),
  ]);

  // ─── Home Page Content ─────────────────────────────────────────────
  console.log("\n--- Home Page ---\n");

  await track("home_hero", [
    text("headline", "Construieste ceva extraordinar"),
    text(
      "subheadline",
      "Ajutam afacerile sa isi transforme prezenta digitala cu solutii de ultima generatie."
    ),
    text("cta_button_label", "Incepe acum"),
    text("cta_button_url", "/contact"),
  ]);

  await track("home_logo_cloud", [
    text("title", "Cu increderea liderilor din industrie"),
  ]);

  await track("feature_speed", [
    text("title", "Viteza fulgeratoare"),
    richText(
      "description",
      "<p>Infrastructura noastra optimizata asigura incarcarea aplicatiilor in milisecunde, nu in secunde.</p>"
    ),
  ]);

  await track("feature_secure", [
    text("title", "Securitate de nivel enterprise"),
    richText(
      "description",
      "<p>Criptare si protocoale de securitate de nivel bancar protejeaza datele dumneavoastra non-stop.</p>"
    ),
  ]);

  await track("feature_scale", [
    text("title", "Scalabilitate nelimitata"),
    richText(
      "description",
      "<p>De la startup la enterprise, platforma noastra creste fara probleme odata cu nevoile afacerii dumneavoastra.</p>"
    ),
  ]);

  await track("home_feature_grid", [
    text("title", "De ce sa ne alegeti"),
    text("subtitle", "Tot ce aveti nevoie pentru a reusi in lumea digitala"),
    linkedItems("cards", ["feature_speed", "feature_secure", "feature_scale"]),
  ]);

  await track("home_text_image", [
    richText(
      "content",
      "<h2>Misiunea noastra</h2><p>Credem ca tehnologia trebuie sa simplifice, nu sa complice. Echipa noastra de experti lucreaza neobosit pentru a livra solutii puternice si intuitive.</p><p>Din 2015, am ajutat peste 500 de afaceri sa isi atinga obiectivele de transformare digitala.</p>"
    ),
    multiChoice("layout", ["image_right"]),
  ]);

  await track("testimonial_sarah", [
    text(
      "quote",
      "Colaborarea cu Acme ne-a transformat intregul flux de lucru. Rezultatele au depasit asteptarile noastre."
    ),
    text("author_name", "Sarah Chen"),
    text("author_role", "CTO, TechForward"),
  ]);

  await track("testimonial_james", [
    text(
      "quote",
      "Expertiza si dedicarea echipei au facut toata diferenta. Recomand cu caldura!"
    ),
    text("author_name", "James Wilson"),
    text("author_role", "CEO, StartupHub"),
  ]);

  await track("home_testimonials", [
    text("title", "Ce spun clientii nostri"),
    linkedItems("cards", ["testimonial_sarah", "testimonial_james"]),
  ]);

  await track("home_cta", [
    text("headline", "Sunteti gata sa incepeti?"),
    richText(
      "body",
      "<p>Alaturati-va miilor de afaceri care folosesc deja platforma noastra pentru a-si dezvolta prezenta digitala.</p>"
    ),
    text("button_label", "Incepe perioada de proba gratuita"),
    text("button_url", "/contact"),
  ]);

  await track("page_home", [
    text("title", "Acasa"),
    urlSlug("slug", ""),
    text(
      "meta_description",
      "Acme Inc. - Construieste ceva extraordinar cu solutiile noastre digitale de ultima generatie."
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

  // ─── Services Page Content ─────────────────────────────────────────
  console.log("\n--- Services Page ---\n");

  await track("services_hero", [
    text("headline", "Serviciile noastre"),
    text(
      "subheadline",
      "Solutii complete adaptate nevoilor afacerii dumneavoastra"
    ),
  ]);

  await track("service_web", [
    text("title", "Dezvoltare web"),
    richText(
      "description",
      "<p>Aplicatii web personalizate construite cu tehnologii moderne si cele mai bune practici.</p>"
    ),
  ]);

  await track("service_mobile", [
    text("title", "Dezvoltare mobila"),
    richText(
      "description",
      "<p>Aplicatii mobile native si cross-platform care incanta utilizatorii pe fiecare dispozitiv.</p>"
    ),
  ]);

  await track("service_cloud", [
    text("title", "Solutii cloud"),
    richText(
      "description",
      "<p>Infrastructura cloud scalabila si servicii de migrare pentru afaceri moderne.</p>"
    ),
  ]);

  await track("services_feature_grid", [
    text("title", "Ce oferim"),
    text("subtitle", "Solutii digitale complete"),
    linkedItems("cards", ["service_web", "service_mobile", "service_cloud"]),
  ]);

  await track("pricing_starter", [
    text("plan_name", "Starter"),
    text("price", "$29"),
    text("billing_period", "/luna"),
    richText(
      "feature_list",
      "<ul><li>5 proiecte</li><li>10GB spatiu de stocare</li><li>Suport prin email</li><li>Analiza de baza</li></ul>"
    ),
    text("cta_label", "Incepe acum"),
    text("cta_url", "/contact"),
    multiChoice("is_popular", ["no"]),
  ]);

  await track("pricing_pro", [
    text("plan_name", "Profesional"),
    text("price", "$79"),
    text("billing_period", "/luna"),
    richText(
      "feature_list",
      "<ul><li>Proiecte nelimitate</li><li>100GB spatiu de stocare</li><li>Suport prioritar</li><li>Analiza avansata</li><li>Integrari personalizate</li></ul>"
    ),
    text("cta_label", "Incepe acum"),
    text("cta_url", "/contact"),
    multiChoice("is_popular", ["yes"]),
    text("popular_badge_label", "Cel mai popular"),
  ]);

  await track("pricing_enterprise", [
    text("plan_name", "Enterprise"),
    text("price", "$199"),
    text("billing_period", "/luna"),
    richText(
      "feature_list",
      "<ul><li>Totul nelimitat</li><li>1TB spatiu de stocare</li><li>Suport dedicat 24/7</li><li>Dezvoltare personalizata</li><li>Garantie SLA</li></ul>"
    ),
    text("cta_label", "Contacteaza vanzarile"),
    text("cta_url", "/contact"),
    multiChoice("is_popular", ["no"]),
  ]);

  await track("services_pricing", [
    text("title", "Preturi simple si transparente"),
    text("subtitle", "Alege planul care se potriveste nevoilor tale"),
    linkedItems("cards", [
      "pricing_starter",
      "pricing_pro",
      "pricing_enterprise",
    ]),
  ]);

  await track("services_cta", [
    text("headline", "Ai nevoie de o solutie personalizata?"),
    richText(
      "body",
      "<p>Echipa noastra poate construi un pachet adaptat cerintelor dumneavoastra specifice.</p>"
    ),
    text("button_label", "Vorbeste cu echipa de vanzari"),
    text("button_url", "/contact"),
  ]);

  await track("page_services", [
    text("title", "Servicii"),
    urlSlug("slug", "services"),
    text(
      "meta_description",
      "Descopera gama noastra completa de servicii digitale."
    ),
    linkedItems("body", [
      "services_hero",
      "services_feature_grid",
      "services_pricing",
      "services_cta",
    ]),
  ]);

  // ─── About Page Content ────────────────────────────────────────────
  console.log("\n--- About Page ---\n");

  await track("about_hero", [
    text("headline", "Despre Acme Inc."),
    text("subheadline", "Pasionati de tehnologie, motivati de rezultate"),
  ]);

  await track("about_text_image", [
    richText(
      "content",
      "<h2>Povestea noastra</h2><p>Fondata in 2015, Acme Inc. a pornit cu o misiune simpla: sa faca tehnologia accesibila afacerilor de toate dimensiunile.</p><p>Astazi, suntem o echipa de peste 100 de ingineri, designeri si strategi care lucreaza pe trei continente pentru a livra experiente digitale exceptionale.</p>"
    ),
    multiChoice("layout", ["image_left"]),
  ]);

  await track("value_innovation", [
    text("title", "Inovatie pe primul loc"),
    richText(
      "description",
      "<p>Adoptam tehnologii si abordari noi pentru a ramane in fata competitiei.</p>"
    ),
  ]);

  await track("value_quality", [
    text("title", "Obsedati de calitate"),
    richText(
      "description",
      "<p>Fiecare linie de cod, fiecare pixel si fiecare interactiune este realizata cu grija.</p>"
    ),
  ]);

  await track("value_customer", [
    text("title", "Orientati catre client"),
    richText(
      "description",
      "<p>Succesul dumneavoastra este succesul nostru. Ne masuram performanta dupa rezultatele dumneavoastra.</p>"
    ),
  ]);

  await track("about_values_grid", [
    text("title", "Valorile noastre"),
    text("subtitle", "Principiile care ghideaza tot ceea ce facem"),
    linkedItems("cards", [
      "value_innovation",
      "value_quality",
      "value_customer",
    ]),
  ]);

  await track("testimonial_maria", [
    text(
      "quote",
      "Echipa Acme pare o extensie a propriei noastre echipe. Inteleg cu adevarat afacerea noastra."
    ),
    text("author_name", "Maria Garcia"),
    text("author_role", "VP Produs, DataFlow"),
  ]);

  await track("testimonial_alex", [
    text(
      "quote",
      "Rentabilitatea investitiei de cand colaboram cu Acme a fost remarcabila."
    ),
    text("author_name", "Alex Thompson"),
    text("author_role", "Director Inginerie, CloudBase"),
  ]);

  await track("about_testimonials", [
    text("title", "Cu increderea companiilor de top"),
    linkedItems("cards", ["testimonial_maria", "testimonial_alex"]),
  ]);

  await track("page_about", [
    text("title", "Despre noi"),
    urlSlug("slug", "about"),
    text(
      "meta_description",
      "Aflati despre Acme Inc. si misiunea noastra de a imputernici afacerile."
    ),
    linkedItems("body", [
      "about_hero",
      "about_text_image",
      "about_values_grid",
      "about_testimonials",
    ]),
  ]);

  // ─── Contact Page Content ──────────────────────────────────────────
  console.log("\n--- Contact Page ---\n");

  await track("contact_hero", [
    text("headline", "Contacteaza-ne"),
    text("subheadline", "Ne-ar placea sa auzim de la tine"),
  ]);

  await track("contact_form_item", [
    text("heading", "Trimite-ne un mesaj"),
    richText(
      "description",
      "<p>Completeaza formularul de mai jos si iti vom raspunde in 24 de ore.</p>"
    ),
    text("success_message", "Multumim! Te vom contacta in curand."),
    text("name_label", "Nume"),
    text("name_placeholder", "Numele tau"),
    text("email_label", "Email"),
    text("email_placeholder", "tu@exemplu.com"),
    text("subject_label", "Subiect"),
    text("subject_placeholder", "Cu ce te putem ajuta?"),
    text("message_label", "Mesaj"),
    text("message_placeholder", "Spune-ne despre proiectul tau..."),
    text("submit_button_label", "Trimite mesajul"),
  ]);

  await track("faq_response", [
    text("question", "Care este timpul tipic de raspuns?"),
    richText(
      "answer",
      "<p>Ne propunem sa raspundem la toate solicitarile in 24 de ore lucratoare.</p>"
    ),
  ]);

  await track("faq_consultation", [
    text("question", "Oferiti consultatii gratuite?"),
    richText(
      "answer",
      "<p>Da! Oferim o consultatie gratuita de 30 de minute pentru a discuta nevoile proiectului dumneavoastra.</p>"
    ),
  ]);

  await track("faq_timeline", [
    text("question", "Care este durata tipica a unui proiect?"),
    richText(
      "answer",
      "<p>Durata proiectelor variaza in functie de amploare si complexitate. Un proiect tipic dureaza intre 4 si 12 saptamani de la incepere pana la lansare.</p>"
    ),
  ]);

  await track("contact_faq", [
    text("title", "Intrebari frecvente"),
    linkedItems("items", ["faq_response", "faq_consultation", "faq_timeline"]),
  ]);

  await track("page_contact", [
    text("title", "Contact"),
    urlSlug("slug", "contact"),
    text(
      "meta_description",
      "Contacteaza Acme Inc. pentru o consultatie gratuita."
    ),
    linkedItems("body", ["contact_hero", "contact_form_item", "contact_faq"]),
  ]);

  // ─── Blog Posts ────────────────────────────────────────────────────
  console.log("\n--- Blog Posts ---\n");

  await track("blog_future_web", [
    text("title", "Viitorul dezvoltarii web"),
    urlSlug("slug", "future-of-web-development"),
    text(
      "summary",
      "Exploram cele mai noi tendinte care modeleaza viitorul dezvoltarii web."
    ),
    richText(
      "body",
      "<h2>Viitorul dezvoltarii web</h2><p>Peisajul dezvoltarii web evolueaza rapid. De la instrumente bazate pe inteligenta artificiala pana la edge computing, noile tehnologii remodeleaza modul in care construim si implementam aplicatii.</p><p>In acest articol, exploram tendintele cheie care vor defini urmatorul deceniu al dezvoltarii web.</p>"
    ),
    dateTime("publish_date", "2024-01-15T00:00:00Z"),
  ]);

  await track("blog_cloud_migration", [
    text("title", "Cele mai bune practici pentru migrarea in cloud"),
    urlSlug("slug", "cloud-migration-best-practices"),
    text(
      "summary",
      "Un ghid complet pentru migrarea infrastructurii in cloud."
    ),
    richText(
      "body",
      "<h2>Cele mai bune practici pentru migrarea in cloud</h2><p>Trecerea la cloud este una dintre cele mai importante decizii pe care le poate lua o afacere. Dar fara o planificare adecvata, poate fi si una dintre cele mai provocatoare.</p><p>Urmati aceste bune practici pentru a asigura o migrare in cloud lin si de succes.</p>"
    ),
    dateTime("publish_date", "2024-01-10T00:00:00Z"),
  ]);

  await track("blog_design_systems", [
    text("title", "Construirea sistemelor de design scalabile"),
    urlSlug("slug", "building-design-systems-that-scale"),
    text(
      "summary",
      "Cum sa creezi si sa intretii sisteme de design pentru organizatii in crestere."
    ),
    richText(
      "body",
      "<h2>Construirea sistemelor de design scalabile</h2><p>Sistemele de design sunt coloana vertebrala a dezvoltarii consistente si eficiente a produselor. Dar construirea unuia care sa se scaleze necesita o planificare atenta si o investitie continua.</p><p>Iata cum abordam sistemele de design la Acme Inc.</p>"
    ),
    dateTime("publish_date", "2024-01-05T00:00:00Z"),
  ]);

  // ─── Summary ───────────────────────────────────────────────────────
  console.log("\n========================================");
  console.log(`  Translations complete!`);
  console.log(`  Success: ${success}`);
  console.log(`  Errors:  ${errors}`);
  console.log("========================================\n");
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
