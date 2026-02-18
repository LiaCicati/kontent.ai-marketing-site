import Image from "next/image";
import type { LogoCloud } from "@/lib/models";

interface LogoCloudBlockProps {
  data: LogoCloud;
}

export default function LogoCloudBlock({ data }: LogoCloudBlockProps) {
  const { title, logos } = data.elements;
  const logoAssets = logos.value ?? [];

  return (
    <section className="py-16 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {title.value && (
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-muted mb-8">
            {title.value}
          </p>
        )}
        {logoAssets.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {logoAssets.map((logo) => (
              <Image
                key={logo.url}
                src={logo.url}
                alt={logo.description || "Partner logo"}
                width={120}
                height={48}
                className="h-10 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {["Acme Corp", "GlobalTech", "InnovateCo", "DataFlow", "CloudBase"].map(
              (name) => (
                <div
                  key={name}
                  className="h-10 px-6 flex items-center rounded bg-border/50 text-muted text-sm font-medium"
                >
                  {name}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
