import Image from "next/image";
import type { TextWithImage } from "@/lib/models";
import RichText from "@/components/ui/RichText";

interface TextWithImageBlockProps {
  data: TextWithImage;
}

export default function TextWithImageBlock({ data }: TextWithImageBlockProps) {
  const { content, image, layout } = data.elements;
  const img = image.value?.[0];
  const isImageLeft =
    layout.value?.[0]?.codename === "image_left";

  return (
    <section className="py-20 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`flex flex-col ${
            isImageLeft ? "lg:flex-row" : "lg:flex-row-reverse"
          } gap-12 items-center`}
        >
          {/* Image */}
          <div className="w-full lg:w-1/2">
            {img ? (
              <Image
                src={img.url}
                alt={img.description || ""}
                width={img.width ?? 600}
                height={img.height ?? 400}
                className="rounded-xl shadow-lg w-full h-auto"
              />
            ) : (
              <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 aspect-[4/3] flex items-center justify-center">
                <svg
                  className="h-16 w-16 text-primary/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="w-full lg:w-1/2">
            <div className="rich-text">
              <RichText content={content.value} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
