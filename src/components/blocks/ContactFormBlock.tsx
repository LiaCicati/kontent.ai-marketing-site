"use client";

import { useState } from "react";
import type { ContactForm } from "@/lib/models";
import RichText from "@/components/ui/RichText";

interface ContactFormBlockProps {
  data: ContactForm;
}

export default function ContactFormBlock({ data }: ContactFormBlockProps) {
  const {
    heading,
    description,
    success_message,
    name_label,
    name_placeholder,
    email_label,
    email_placeholder,
    subject_label,
    subject_placeholder,
    message_label,
    message_placeholder,
    submit_button_label,
  } = data.elements;
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
          {heading.value}
        </h2>
        <div className="text-muted mb-8 rich-text">
          <RichText content={description.value} />
        </div>

        {submitted ? (
          <div
            className="rounded-xl bg-green-50 border border-green-200 p-8 text-center"
            role="status"
          >
            <svg
              className="mx-auto h-12 w-12 text-green-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-medium text-green-800">
              {success_message.value}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  {name_label.value}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-secondary placeholder-muted-light focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder={name_placeholder.value}
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  {email_label.value}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-secondary placeholder-muted-light focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder={email_placeholder.value}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-secondary mb-1"
              >
                {subject_label.value}
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                className="w-full rounded-lg border border-border px-4 py-2.5 text-secondary placeholder-muted-light focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder={subject_placeholder.value}
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-secondary mb-1"
              >
                {message_label.value}
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                className="w-full rounded-lg border border-border px-4 py-2.5 text-secondary placeholder-muted-light focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-y"
                placeholder={message_placeholder.value}
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto rounded-lg bg-primary px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-dark transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {submit_button_label.value}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
