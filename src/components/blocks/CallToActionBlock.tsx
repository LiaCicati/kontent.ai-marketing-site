import Link from "next/link";
import type { CallToAction } from "@/lib/models";
import RichText from "@/components/ui/RichText";

interface CallToActionBlockProps {
  data: CallToAction;
}

export default function CallToActionBlock({ data }: CallToActionBlockProps) {
  const { headline, body, button_label, button_url } = data.elements;

  return (
    <section className="py-20 bg-primary" data-kontent-item-id={data.system.id}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2
          className="text-3xl md:text-4xl font-bold text-white mb-6"
          data-kontent-element-codename="headline"
        >
          {headline.value}
        </h2>
        <div
          className="text-lg text-white/80 mb-8 max-w-2xl mx-auto rich-text"
          data-kontent-element-codename="body"
        >
          <RichText content={body.value} />
        </div>
        {button_label.value && button_url.value && (
          <Link
            href={button_url.value}
            className="inline-flex items-center rounded-lg bg-white px-8 py-3 text-base font-semibold text-primary shadow-sm hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            data-kontent-element-codename="button_label"
          >
            {button_label.value}
          </Link>
        )}
      </div>
    </section>
  );
}
