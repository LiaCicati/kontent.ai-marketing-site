import Image from "next/image";
import type { FeatureGrid, FeatureCard } from "@/lib/models";
import RichText from "@/components/ui/RichText";

interface FeatureGridBlockProps {
  data: FeatureGrid;
}

export default function FeatureGridBlock({ data }: FeatureGridBlockProps) {
  const { title, subtitle, cards } = data.elements;
  const featureCards = cards.linkedItems as FeatureCard[];

  return (
    <section className="py-20 bg-white" data-kontent-item-id={data.system.id}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold text-secondary mb-4"
            data-kontent-element-codename="title"
          >
            {title.value}
          </h2>
          {subtitle.value && (
            <p className="text-lg text-muted" data-kontent-element-codename="subtitle">
              {subtitle.value}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureCards.map((card) => (
            <FeatureCardItem key={card.system.codename} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCardItem({ card }: { card: FeatureCard }) {
  const icon = card.elements.icon.value?.[0];

  return (
    <div
      className="group rounded-xl border border-border p-8 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
      data-kontent-item-id={card.system.id}
    >
      {icon && (
        <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
          <Image
            src={icon.url}
            alt={icon.description || ""}
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
        </div>
      )}
      {!icon && (
        <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
          <svg
            className="h-6 w-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          </svg>
        </div>
      )}
      <h3
        className="text-xl font-semibold text-secondary mb-3"
        data-kontent-element-codename="title"
      >
        {card.elements.title.value}
      </h3>
      <div className="text-muted" data-kontent-element-codename="description">
        <RichText content={card.elements.description.value} />
      </div>
    </div>
  );
}
