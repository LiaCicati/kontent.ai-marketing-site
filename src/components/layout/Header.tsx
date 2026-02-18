"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { NavigationItem as NavItemModel } from "@/lib/models";

interface HeaderProps {
  siteName: string;
  logoUrl?: string;
  items: NavItemModel[];
}

export default function Header({ siteName, logoUrl, items }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border">
      <nav
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {logoUrl && (
              <Image
                src={logoUrl}
                alt={siteName}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            )}
            <span className="text-xl font-bold text-secondary">
              {siteName}
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-8">
            {items.map((item) => (
              <li key={item.system.codename}>
                <NavLink item={item} />
              </li>
            ))}
          </ul>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-muted hover:text-secondary hover:bg-surface"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileOpen ? "max-h-96 pb-4" : "max-h-0"
          }`}
        >
          <ul className="space-y-1 pt-2">
            {items.map((item) => (
              <li key={item.system.codename}>
                <Link
                  href={item.elements.url.value}
                  className="block rounded-md px-3 py-2 text-base font-medium text-muted hover:bg-surface hover:text-secondary"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.elements.label.value}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}

function NavLink({ item }: { item: NavItemModel }) {
  const hasChildren =
    item.elements.children?.linkedItems &&
    item.elements.children.linkedItems.length > 0;

  if (!hasChildren) {
    return (
      <Link
        href={item.elements.url.value}
        className="text-sm font-medium text-muted hover:text-secondary transition-colors"
      >
        {item.elements.label.value}
      </Link>
    );
  }

  return (
    <div className="relative group">
      <Link
        href={item.elements.url.value}
        className="text-sm font-medium text-muted hover:text-secondary transition-colors"
      >
        {item.elements.label.value}
      </Link>
      <ul className="absolute left-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        {item.elements.children.linkedItems.map((child) => (
          <li key={child.system.codename}>
            <Link
              href={child.elements.url.value}
              className="block px-4 py-2 text-sm text-muted hover:bg-surface hover:text-secondary"
            >
              {child.elements.label.value}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
