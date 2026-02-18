"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import KontentSmartLink from "@kontent-ai/smart-link";

const kontentLangToLocale: Record<string, string> = {
  default: "en",
  ro: "ro",
};

interface SmartLinkProviderProps {
  languageCodename?: string;
}

export default function SmartLinkProvider({
  languageCodename = "default",
}: SmartLinkProviderProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const instance = KontentSmartLink.initialize({
      defaultDataAttributes: {
        environmentId: process.env.NEXT_PUBLIC_KONTENT_ENVIRONMENT_ID!,
        languageCodename,
      },
    });

    // Listen for Web Spotlight refresh messages to detect language switches.
    // When an editor changes the language dropdown, Web Spotlight sends a
    // refresh with the new languageCodename. We navigate to the matching
    // locale URL so the preview iframe reflects the correct language.
    function handleMessage(event: MessageEvent) {
      if (typeof event.data !== "string") return;
      try {
        const msg = JSON.parse(event.data);
        if (
          msg?.type === "kontent-smart-link:preview:refresh" &&
          msg?.data?.languageCodename
        ) {
          const newLocale =
            kontentLangToLocale[msg.data.languageCodename] ??
            msg.data.languageCodename;
          const currentLocale = pathname.split("/")[1] || "en";

          if (newLocale !== currentLocale) {
            const pathWithoutLocale = pathname.replace(
              new RegExp(`^/${currentLocale}(/|$)`),
              "/"
            );
            const newPath = `/${newLocale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;
            router.push(newPath);
          }
        }
      } catch {
        // Not a JSON message we care about
      }
    }

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
      instance.destroy();
    };
  }, [languageCodename, pathname, router]);

  return null;
}
