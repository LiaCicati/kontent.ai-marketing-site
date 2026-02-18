import Link from "next/link";
import type { PricingTable, PricingCard } from "@/lib/models";
import RichText from "@/components/ui/RichText";

interface PricingTableBlockProps {
  data: PricingTable;
}

export default function PricingTableBlock({ data }: PricingTableBlockProps) {
  const { title, subtitle, cards } = data.elements;
  const pricingCards = cards.linkedItems as PricingCard[];

  return (
    <section className="py-20 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
            {title.value}
          </h2>
          {subtitle.value && (
            <p className="text-lg text-muted">{subtitle.value}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingCards.map((card) => (
            <PricingCardItem key={card.system.codename} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCardItem({ card }: { card: PricingCard }) {
  const isPopular = card.elements.is_popular.value?.[0]?.codename === "yes";

  return (
    <div
      className={`relative rounded-xl p-8 flex flex-col ${
        isPopular
          ? "bg-primary text-white shadow-xl scale-105 border-2 border-primary"
          : "bg-white border border-border"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-sm font-semibold text-secondary">
          Most Popular
        </div>
      )}

      <h3
        className={`text-xl font-semibold mb-2 ${
          isPopular ? "text-white" : "text-secondary"
        }`}
      >
        {card.elements.plan_name.value}
      </h3>

      <div className="mb-6">
        <span
          className={`text-4xl font-bold ${
            isPopular ? "text-white" : "text-secondary"
          }`}
        >
          {card.elements.price.value}
        </span>
        <span
          className={`text-sm ${isPopular ? "text-white/70" : "text-muted"}`}
        >
          {card.elements.billing_period.value}
        </span>
      </div>

      <div
        className={`flex-1 mb-8 rich-text ${
          isPopular ? "[&_li]:text-white/90" : "[&_li]:text-muted"
        }`}
      >
        <RichText content={card.elements.feature_list.value} />
      </div>

      <Link
        href={card.elements.cta_url.value || "/contact"}
        className={`block text-center rounded-lg px-6 py-3 text-base font-semibold transition-colors ${
          isPopular
            ? "bg-white text-primary hover:bg-gray-50"
            : "bg-primary text-white hover:bg-primary-dark"
        }`}
      >
        {card.elements.cta_label.value}
      </Link>
    </div>
  );
}
