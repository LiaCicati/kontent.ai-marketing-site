"use client";

import { useMemo } from "react";
import {
  transformToPortableText,
} from "@kontent-ai/rich-text-resolver";
import {
  PortableText,
  ImageComponent,
  TableComponent,
} from "@kontent-ai/rich-text-resolver-react";
import type { PortableTextReactResolvers } from "@kontent-ai/rich-text-resolver-react";
import type { IContentItem } from "@kontent-ai/delivery-sdk";

interface RichTextProps {
  content: string;
  linkedItems?: IContentItem[];
}

export default function RichText({ content, linkedItems }: RichTextProps) {
  const portableText = useMemo(() => {
    if (!content) return [];
    try {
      return transformToPortableText(content);
    } catch {
      return [];
    }
  }, [content]);

  const resolvers: PortableTextReactResolvers = useMemo(
    () => ({
      types: {
        componentOrItem: ({ value }) => {
          if (!linkedItems) return null;
          const item = linkedItems.find(
            (li) => li.system.codename === value?.componentOrItem?._ref
          );
          if (!item) return null;
          return (
            <div className="my-4 p-4 rounded-lg bg-surface border border-border">
              <p className="text-sm text-muted">
                [Embedded: {item.system.type} — {item.system.name}]
              </p>
            </div>
          );
        },
        table: ({ value }) => <TableComponent {...value} />,
        image: ({ value }) => <ImageComponent {...value} />,
      },
      marks: {
        link: ({ value, children }) => (
          <a
            href={value?.href}
            rel={value?.rel}
            title={value?.title}
            target={value?.["data-new-window"] === "true" ? "_blank" : undefined}
          >
            {children}
          </a>
        ),
        contentItemLink: ({ value, children }) => {
          const item = linkedItems?.find(
            (li) => li.system.id === value?.contentItemLink?._ref
          );
          return (
            <a href={item ? `/${item.system.codename}` : "#"}>
              {children}
            </a>
          );
        },
      },
    }),
    [linkedItems]
  );

  if (!content) return null;

  // If it's simple HTML without portable text features, render directly
  if (portableText.length === 0) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return <PortableText value={portableText} components={resolvers} />;
}
