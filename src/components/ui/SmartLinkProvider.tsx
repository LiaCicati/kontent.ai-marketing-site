"use client";

import { useEffect } from "react";
import KontentSmartLink from "@kontent-ai/smart-link";

interface SmartLinkProviderProps {
  languageCodename?: string;
}

export default function SmartLinkProvider({
  languageCodename = "default",
}: SmartLinkProviderProps) {
  useEffect(() => {
    const instance = KontentSmartLink.initialize({
      defaultDataAttributes: {
        environmentId: process.env.NEXT_PUBLIC_KONTENT_ENVIRONMENT_ID!,
        languageCodename,
      },
    });

    return () => {
      instance.destroy();
    };
  }, [languageCodename]);

  return null;
}
