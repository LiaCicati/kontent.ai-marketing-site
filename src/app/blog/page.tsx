import { draftMode } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getBlogPosts, getSiteConfig } from "@/lib/kontent";

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  return {
    title: siteConfig?.elements.blog_heading.value || "Blog",
    description: siteConfig?.elements.blog_subtitle.value || "",
  };
}

export const revalidate = 60;

export default async function BlogPage() {
  const draft = await draftMode();
  const [posts, siteConfig] = await Promise.all([
    getBlogPosts(draft.isEnabled),
    getSiteConfig(draft.isEnabled),
  ]);

  const heading = siteConfig?.elements.blog_heading.value || "Blog";
  const subtitle = siteConfig?.elements.blog_subtitle.value || "";
  const emptyMessage = siteConfig?.elements.blog_empty_message.value || "";

  return (
    <main>
      {/* Hero */}
      <section className="bg-secondary text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {heading}
          </h1>
          {subtitle && (
            <p className="text-lg text-gray-300 max-w-2xl">{subtitle}</p>
          )}
        </div>
      </section>

      {/* Posts grid */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <p className="text-center text-muted text-lg">{emptyMessage}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => {
                const image = post.elements.image.value?.[0];
                const date = post.elements.publish_date.value
                  ? new Date(
                      post.elements.publish_date.value
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : null;

                return (
                  <article
                    key={post.system.codename}
                    className="group rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
                    data-kontent-item-id={post.system.id}
                  >
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.description || post.elements.title.value}
                        width={400}
                        height={225}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <svg
                          className="h-10 w-10 text-primary/30"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="p-6">
                      {date && (
                        <time className="text-sm text-muted mb-2 block">
                          {date}
                        </time>
                      )}
                      <h2
                        className="text-xl font-semibold text-secondary mb-2 group-hover:text-primary transition-colors"
                        data-kontent-element-codename="title"
                      >
                        <Link href={`/blog/${post.elements.slug.value}`}>
                          {post.elements.title.value}
                        </Link>
                      </h2>
                      {post.elements.summary.value && (
                        <p
                          className="text-muted line-clamp-3"
                          data-kontent-element-codename="summary"
                        >
                          {post.elements.summary.value}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
