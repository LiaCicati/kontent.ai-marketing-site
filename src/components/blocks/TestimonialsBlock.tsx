import Image from "next/image";
import type { Testimonials, TestimonialCard } from "@/lib/models";

interface TestimonialsBlockProps {
  data: Testimonials;
}

export default function TestimonialsBlock({ data }: TestimonialsBlockProps) {
  const { title, cards } = data.elements;
  const testimonialCards = cards.linkedItems as TestimonialCard[];

  return (
    <section className="py-20 bg-white" data-kontent-item-id={data.system.id}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          className="text-3xl md:text-4xl font-bold text-secondary text-center mb-16"
        >
          {title.value}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonialCards.map((card) => (
            <TestimonialCardItem key={card.system.codename} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCardItem({ card }: { card: TestimonialCard }) {
  const avatar = card.elements.avatar.value?.[0];

  return (
    <blockquote
      className="rounded-xl bg-surface p-8 border border-border"
      data-kontent-item-id={card.system.id}
    >
      <svg
        className="h-8 w-8 text-primary/30 mb-4"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
      </svg>
      <p
        className="text-lg text-secondary mb-6 italic"
      >
        &ldquo;{card.elements.quote.value}&rdquo;
      </p>
      <footer className="flex items-center gap-4">
        {avatar ? (
          <Image
            src={avatar.url}
            alt={card.elements.author_name.value}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {card.elements.author_name.value.charAt(0)}
          </div>
        )}
        <div>
          <cite
            className="not-italic font-semibold text-secondary block"
          >
            {card.elements.author_name.value}
          </cite>
          <span
            className="text-sm text-muted"
          >
            {card.elements.author_role.value}
          </span>
        </div>
      </footer>
    </blockquote>
  );
}
