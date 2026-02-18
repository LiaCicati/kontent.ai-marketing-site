import Link from "next/link";
import type { CallToAction } from "@/lib/models";
import RichText from "@/components/ui/RichText";
import { localizeHref } from "@/lib/i18n";

interface CallToActionBlockProps {
  data: CallToAction;
  locale: string;
}

export default function CallToActionBlock({ data, locale }: CallToActionBlockProps) {
  const { headline, body, button_label, button_url } = data.elements;

  return (
    <section className="py-20 bg-primary" data-kontent-item-id={data.system.id}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2
          className="text-3xl md:text-4xl font-bold text-white mb-6"
        >
          {headline.value}
        </h2>
        <div
          className="text-lg text-white/80 mb-8 max-w-2xl mx-auto rich-text"
        >
          <RichText content={body.value} locale={locale} />
        </div>
        {button_label.value && button_url.value && (
          <Link
            href={localizeHref(button_url.value, locale)}
            className="inline-flex items-center rounded-lg bg-white px-8 py-3 text-base font-semibold text-primary shadow-sm hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {button_label.value}
          </Link>
        )}
      </div>
    </section>
  );
}
