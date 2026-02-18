import type { IContentItem } from "@kontent-ai/delivery-sdk";
import { contentTypes } from "@/lib/models";
import HeroBlock from "./HeroBlock";
import FeatureGridBlock from "./FeatureGridBlock";
import TextWithImageBlock from "./TextWithImageBlock";
import TestimonialsBlock from "./TestimonialsBlock";
import CallToActionBlock from "./CallToActionBlock";
import PricingTableBlock from "./PricingTableBlock";
import ContactFormBlock from "./ContactFormBlock";
import LogoCloudBlock from "./LogoCloudBlock";
import FAQBlock from "./FAQBlock";
import RichTextBlockBlock from "./RichTextBlockBlock";

interface ComponentResolverProps {
  items: IContentItem[];
  locale: string;
}

export default function ComponentResolver({ items, locale }: ComponentResolverProps) {
  return (
    <main>
      {items.map((item) => (
        <BlockRenderer key={item.system.id} item={item} locale={locale} />
      ))}
    </main>
  );
}

function BlockRenderer({ item, locale }: { item: IContentItem; locale: string }) {
  switch (item.system.type) {
    case contentTypes.hero:
      return <HeroBlock data={item as any} locale={locale} />;
    case contentTypes.feature_grid:
      return <FeatureGridBlock data={item as any} />;
    case contentTypes.text_with_image:
      return <TextWithImageBlock data={item as any} />;
    case contentTypes.testimonials:
      return <TestimonialsBlock data={item as any} />;
    case contentTypes.call_to_action:
      return <CallToActionBlock data={item as any} locale={locale} />;
    case contentTypes.pricing_table:
      return <PricingTableBlock data={item as any} locale={locale} />;
    case contentTypes.contact_form:
      return <ContactFormBlock data={item as any} />;
    case contentTypes.logo_cloud:
      return <LogoCloudBlock data={item as any} />;
    case contentTypes.faq:
      return <FAQBlock data={item as any} />;
    case contentTypes.rich_text_block:
      return <RichTextBlockBlock data={item as any} />;
    default:
      if (process.env.NODE_ENV === "development") {
        return (
          <div className="py-8 text-center text-sm text-muted bg-surface border-y border-border">
            Unknown component type: <code>{item.system.type}</code>
          </div>
        );
      }
      return null;
  }
}
