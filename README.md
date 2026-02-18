# Kontent.ai Marketing Website

A modern marketing website built with **Next.js 15** (App Router, Server Components, TypeScript) and **Kontent.ai** headless CMS, styled with **Tailwind CSS 4**.

## Tech Stack

- **Next.js 15** — App Router, Server Components, ISR, Draft Mode
- **Kontent.ai** — Headless CMS with Delivery SDK and Management SDK
- **Tailwind CSS 4** — Utility-first styling
- **TypeScript** — Full type safety

## Features

- Modular page builder — editors stack components (Hero, Feature Grid, Pricing Table, etc.) via Kontent.ai linked items
- Dynamic catch-all routing resolves any CMS page by slug
- Draft Mode for previewing unpublished content
- ISR with 60-second revalidation
- Rich text rendering with Portable Text (embedded components, images, links)
- Mobile-responsive with hamburger navigation
- Blog index page
- Fully accessible (semantic HTML, ARIA attributes, keyboard navigation)

## Demo Pages

| Page | Route | Components |
|------|-------|------------|
| Home | `/` | Hero, Logo Cloud, Feature Grid, Text With Image, Testimonials, CTA |
| Services | `/services` | Hero, Feature Grid, Pricing Table, CTA |
| About | `/about` | Hero, Text With Image, Feature Grid, Testimonials |
| Contact | `/contact` | Hero, Contact Form, FAQ |
| Blog | `/blog` | Blog post listing |

## Getting Started

### 1. Create a Kontent.ai Project

1. Sign up at [kontent.ai](https://kontent.ai) and create a new project
2. Go to **Project Settings > API keys** and copy:
   - **Environment ID** (Project ID)
   - **Preview Delivery API key**
   - **Management API key**
3. Choose a secret string for preview mode (any random value)

### 2. Configure Environment Variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
KONTENT_PROJECT_ID=your_environment_id
KONTENT_PREVIEW_API_KEY=your_preview_delivery_api_key
KONTENT_MANAGEMENT_API_KEY=your_management_api_key
KONTENT_PREVIEW_SECRET=any_random_secret_string
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Setup Script

This creates all content types, demo content items, and publishes everything:

```bash
npm run setup
```

The script will:
- Create 21 content types (navigation, page components, blog posts, etc.)
- Mark component types (feature cards, pricing cards, etc.) as non-standalone
- Create demo content for all pages with realistic copy
- Publish all content items

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

## Preview / Draft Mode

To preview unpublished content changes from Kontent.ai:

### Enable Draft Mode

Navigate to:

```
http://localhost:3000/api/draft?secret=YOUR_PREVIEW_SECRET&slug=/
```

Replace `YOUR_PREVIEW_SECRET` with the value of `KONTENT_PREVIEW_SECRET` in your `.env.local`. The `slug` parameter controls which page to redirect to after enabling draft mode.

### Disable Draft Mode

Navigate to:

```
http://localhost:3000/api/disable-draft
```

### Kontent.ai Web Spotlight / Preview URLs

In your Kontent.ai project settings, configure the preview URL as:

```
https://your-domain.com/api/draft?secret=YOUR_PREVIEW_SECRET&slug={URLslug}
```

This allows editors to click "Preview" in Kontent.ai and see unpublished changes.

## Project Structure

```
src/
  app/
    [[...slug]]/page.tsx    # Dynamic catch-all route
    blog/page.tsx            # Blog index
    api/draft/route.ts       # Enable draft mode
    api/disable-draft/route.ts # Disable draft mode
    layout.tsx               # Root layout (fetches site config)
    globals.css              # Tailwind + rich text styles
  components/
    blocks/                  # CMS component renderers
      HeroBlock.tsx
      FeatureGridBlock.tsx
      TextWithImageBlock.tsx
      TestimonialsBlock.tsx
      CallToActionBlock.tsx
      PricingTableBlock.tsx
      ContactFormBlock.tsx
      LogoCloudBlock.tsx
      FAQBlock.tsx
      RichTextBlockBlock.tsx
      ComponentResolver.tsx  # Maps content types to React components
    layout/
      Header.tsx             # Site header with mobile menu
      Footer.tsx             # Site footer
    ui/
      RichText.tsx           # Rich text renderer (Portable Text)
  lib/
    kontent.ts               # Delivery client + query helpers
    models/
      index.ts               # TypeScript interfaces for all content types
scripts/
  setup-kontent.ts           # Seed script for content types + demo data
```

## Deployment

### Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo in [Vercel](https://vercel.com/new)
3. Add the environment variables (`KONTENT_PROJECT_ID`, `KONTENT_PREVIEW_API_KEY`, `KONTENT_PREVIEW_SECRET`) in Vercel project settings
4. Deploy

The `KONTENT_MANAGEMENT_API_KEY` is only needed for running the setup script locally and should NOT be added to Vercel.

## Content Modeling

All content types are created programmatically by the setup script. The page builder pattern uses a `Page` content type with a `body` field (linked items) that accepts any of the section component types. Editors drag and drop components to build pages.

### Component Types (used inside other types)

- **NavigationItem** — label, URL, optional children
- **FooterColumn** — title + links
- **FeatureCard** — icon, title, description
- **TestimonialCard** — quote, author name, role, avatar
- **PricingCard** — plan name, price, billing period, features, CTA, popularity flag
- **FAQItem** — question + answer

### Section Types (stackable on pages)

- **Hero** — headline, subheadline, CTA button, background image
- **FeatureGrid** — title, subtitle, array of feature cards
- **TextWithImage** — rich text content, image, layout (left/right)
- **Testimonials** — title + testimonial cards
- **CallToAction** — headline, body, button
- **PricingTable** — title, subtitle, pricing cards
- **ContactForm** — heading, description, success message
- **LogoCloud** — title + logo assets
- **FAQ** — title + FAQ items
- **RichTextBlock** — freeform rich text content
