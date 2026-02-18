import Image from "next/image";
import Link from "next/link";
import type { Hero } from "@/lib/models";

interface HeroBlockProps {
  data: Hero;
}

export default function HeroBlock({ data }: HeroBlockProps) {
  const { headline, subheadline, cta_button_label, cta_button_url, background_image } =
    data.elements;

  const bgImage = background_image.value?.[0];

  return (
    <section
      className="relative overflow-hidden bg-secondary text-white"
      data-kontent-item-id={data.system.id}
    >
      {bgImage && (
        <Image
          src={bgImage.url}
          alt={bgImage.description || ""}
          fill
          className="object-cover opacity-20"
          priority
        />
      )}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="max-w-3xl">
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            data-kontent-element-codename="headline"
          >
            {headline.value}
          </h1>
          {subheadline.value && (
            <p
              className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl"
              data-kontent-element-codename="subheadline"
            >
              {subheadline.value}
            </p>
          )}
          {cta_button_label.value && cta_button_url.value && (
            <Link
              href={cta_button_url.value}
              className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-dark transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              data-kontent-element-codename="cta_button_label"
            >
              {cta_button_label.value}
              <svg
                className="ml-2 h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
