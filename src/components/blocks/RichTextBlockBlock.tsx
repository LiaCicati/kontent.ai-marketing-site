import type { RichTextBlock } from "@/lib/models";
import RichText from "@/components/ui/RichText";

interface RichTextBlockBlockProps {
  data: RichTextBlock;
}

export default function RichTextBlockBlock({ data }: RichTextBlockBlockProps) {
  return (
    <section className="py-16 bg-white" data-kontent-item-id={data.system.id}>
      <div
        className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 rich-text"
      >
        <RichText
          content={data.elements.body.value}
          linkedItems={data.elements.body.linkedItems}
        />
      </div>
    </section>
  );
}
