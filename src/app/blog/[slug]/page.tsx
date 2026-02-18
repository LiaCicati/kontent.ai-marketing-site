import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getBlogPost, getBlogPosts } from "@/lib/kontent";
import RichText from "@/components/ui/RichText";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    slug: post.elements.slug.value,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const draft = await draftMode();
  const post = await getBlogPost(resolvedParams.slug, draft.isEnabled);

  if (!post) return {};

  return {
    title: post.elements.title.value,
    description: post.elements.summary.value,
  };
}

export const revalidate = 60;

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  const draft = await draftMode();
  const post = await getBlogPost(resolvedParams.slug, draft.isEnabled);

  if (!post) {
    notFound();
  }

  const image = post.elements.image.value?.[0];
  const date = post.elements.publish_date.value
    ? new Date(post.elements.publish_date.value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main>
      {/* Hero */}
      <section className="bg-secondary text-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to Blog
          </Link>
          {date && (
            <time className="text-sm text-gray-400 block mb-3">{date}</time>
          )}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            {post.elements.title.value}
          </h1>
          {post.elements.summary.value && (
            <p className="mt-4 text-lg text-gray-300">
              {post.elements.summary.value}
            </p>
          )}
        </div>
      </section>

      {/* Featured image */}
      {image && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 -mt-8">
          <Image
            src={image.url}
            alt={image.description || post.elements.title.value}
            width={image.width ?? 900}
            height={image.height ?? 500}
            className="w-full rounded-xl shadow-lg"
            priority
          />
        </div>
      )}

      {/* Body */}
      <article className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 rich-text">
          <RichText
            content={post.elements.body.value}
            linkedItems={post.elements.body.linkedItems}
          />
        </div>
      </article>
    </main>
  );
}
