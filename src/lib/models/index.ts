import type { Elements, IContentItem } from "@kontent-ai/delivery-sdk";

// ─── Navigation ──────────────────────────────────────────────────────
export interface NavigationItem extends IContentItem<{
  label: Elements.TextElement;
  url: Elements.TextElement;
  children: Elements.LinkedItemsElement<NavigationItem>;
}> {}

export interface Navigation extends IContentItem<{
  logo: Elements.AssetsElement;
  items: Elements.LinkedItemsElement<NavigationItem>;
}> {}

export interface FooterColumn extends IContentItem<{
  title: Elements.TextElement;
  links: Elements.LinkedItemsElement<NavigationItem>;
}> {}

export interface Footer extends IContentItem<{
  columns: Elements.LinkedItemsElement<FooterColumn>;
  copyright_text: Elements.TextElement;
  social_links: Elements.LinkedItemsElement<NavigationItem>;
}> {}

// ─── Site Config (singleton) ─────────────────────────────────────────
export interface SiteConfig extends IContentItem<{
  site_name: Elements.TextElement;
  logo: Elements.AssetsElement;
  header_navigation: Elements.LinkedItemsElement<NavigationItem>;
  footer: Elements.LinkedItemsElement<Footer>;
}> {}

// ─── Component Content Types ─────────────────────────────────────────
export interface Hero extends IContentItem<{
  headline: Elements.TextElement;
  subheadline: Elements.TextElement;
  cta_button_label: Elements.TextElement;
  cta_button_url: Elements.TextElement;
  background_image: Elements.AssetsElement;
}> {}

export interface FeatureCard extends IContentItem<{
  icon: Elements.AssetsElement;
  title: Elements.TextElement;
  description: Elements.RichTextElement;
}> {}

export interface FeatureGrid extends IContentItem<{
  title: Elements.TextElement;
  subtitle: Elements.TextElement;
  cards: Elements.LinkedItemsElement<FeatureCard>;
}> {}

export interface TextWithImage extends IContentItem<{
  content: Elements.RichTextElement;
  image: Elements.AssetsElement;
  layout: Elements.MultipleChoiceElement;
}> {}

export interface TestimonialCard extends IContentItem<{
  quote: Elements.TextElement;
  author_name: Elements.TextElement;
  author_role: Elements.TextElement;
  avatar: Elements.AssetsElement;
}> {}

export interface Testimonials extends IContentItem<{
  title: Elements.TextElement;
  cards: Elements.LinkedItemsElement<TestimonialCard>;
}> {}

export interface CallToAction extends IContentItem<{
  headline: Elements.TextElement;
  body: Elements.RichTextElement;
  button_label: Elements.TextElement;
  button_url: Elements.TextElement;
}> {}

export interface PricingCard extends IContentItem<{
  plan_name: Elements.TextElement;
  price: Elements.TextElement;
  billing_period: Elements.TextElement;
  feature_list: Elements.RichTextElement;
  cta_label: Elements.TextElement;
  cta_url: Elements.TextElement;
  is_popular: Elements.MultipleChoiceElement;
}> {}

export interface PricingTable extends IContentItem<{
  title: Elements.TextElement;
  subtitle: Elements.TextElement;
  cards: Elements.LinkedItemsElement<PricingCard>;
}> {}

export interface ContactForm extends IContentItem<{
  heading: Elements.TextElement;
  description: Elements.RichTextElement;
  success_message: Elements.TextElement;
}> {}

export interface LogoCloud extends IContentItem<{
  title: Elements.TextElement;
  logos: Elements.AssetsElement;
}> {}

export interface FAQItem extends IContentItem<{
  question: Elements.TextElement;
  answer: Elements.RichTextElement;
}> {}

export interface FAQ extends IContentItem<{
  title: Elements.TextElement;
  items: Elements.LinkedItemsElement<FAQItem>;
}> {}

export interface RichTextBlock extends IContentItem<{
  body: Elements.RichTextElement;
}> {}

// ─── Page ────────────────────────────────────────────────────────────
export interface Page extends IContentItem<{
  title: Elements.TextElement;
  slug: Elements.UrlSlugElement;
  meta_description: Elements.TextElement;
  body: Elements.LinkedItemsElement;
}> {}

// ─── Blog Post ───────────────────────────────────────────────────────
export interface BlogPost extends IContentItem<{
  title: Elements.TextElement;
  slug: Elements.UrlSlugElement;
  summary: Elements.TextElement;
  body: Elements.RichTextElement;
  image: Elements.AssetsElement;
  publish_date: Elements.DateTimeElement;
}> {}

// ─── Content type codenames ──────────────────────────────────────────
export const contentTypes = {
  navigation_item: "navigation_item",
  navigation: "navigation",
  footer_column: "footer_column",
  footer: "footer",
  site_config: "site_config",
  hero: "hero",
  feature_card: "feature_card",
  feature_grid: "feature_grid",
  text_with_image: "text_with_image",
  testimonial_card: "testimonial_card",
  testimonials: "testimonials",
  call_to_action: "call_to_action",
  pricing_card: "pricing_card",
  pricing_table: "pricing_table",
  contact_form: "contact_form",
  logo_cloud: "logo_cloud",
  faq_item: "faq_item",
  faq: "faq",
  rich_text_block: "rich_text_block",
  page: "page",
  blog_post: "blog_post",
} as const;
