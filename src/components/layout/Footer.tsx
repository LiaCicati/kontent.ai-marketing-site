import Link from "next/link";
import type {
  Footer as FooterModel,
  FooterColumn,
  NavigationItem,
} from "@/lib/models";

interface FooterProps {
  footer: FooterModel | null;
  siteName: string;
}

export default function Footer({ footer, siteName }: FooterProps) {
  if (!footer) {
    return (
      <footer className="bg-secondary text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-light">
          &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
        </div>
      </footer>
    );
  }

  const columns = footer.elements.columns.linkedItems as FooterColumn[];
  const socialLinks =
    footer.elements.social_links.linkedItems as NavigationItem[];

  return (
    <footer className="bg-secondary text-white" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg font-bold mb-4">{siteName}</h3>
            {socialLinks.length > 0 && (
              <div className="flex gap-4 mt-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.system.codename}
                    href={link.elements.url.value}
                    className="text-muted-light hover:text-white transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.elements.label.value}
                  >
                    {link.elements.label.value}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Footer columns */}
          {columns.map((col) => (
            <div key={col.system.codename}>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">
                {col.elements.title.value}
              </h4>
              <ul className="space-y-2">
                {(col.elements.links.linkedItems as NavigationItem[]).map(
                  (link) => (
                    <li key={link.system.codename}>
                      <Link
                        href={link.elements.url.value}
                        className="text-sm text-muted-light hover:text-white transition-colors"
                      >
                        {link.elements.label.value}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-white/10 text-sm text-muted-light text-center">
          {footer.elements.copyright_text.value ||
            `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`}
        </div>
      </div>
    </footer>
  );
}
