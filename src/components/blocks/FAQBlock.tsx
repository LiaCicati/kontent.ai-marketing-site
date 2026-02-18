"use client";

import { useState } from "react";
import type { FAQ, FAQItem } from "@/lib/models";
import RichText from "@/components/ui/RichText";

interface FAQBlockProps {
  data: FAQ;
}

export default function FAQBlock({ data }: FAQBlockProps) {
  const { title, items } = data.elements;
  const faqItems = items.linkedItems as FAQItem[];

  return (
    <section className="py-20 bg-surface">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-secondary text-center mb-12">
          {title.value}
        </h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <AccordionItem key={item.system.codename} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AccordionItem({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-white overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between px-6 py-4 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-base font-medium text-secondary">
          {item.elements.question.value}
        </span>
        <svg
          className={`h-5 w-5 shrink-0 text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-96 pb-4" : "max-h-0"
        }`}
      >
        <div className="px-6 text-muted rich-text">
          <RichText content={item.elements.answer.value} />
        </div>
      </div>
    </div>
  );
}
