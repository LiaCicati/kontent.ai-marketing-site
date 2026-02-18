"use client";

import { useEffect } from "react";
import KontentSmartLink from "@kontent-ai/smart-link";

export default function SmartLinkProvider() {
  useEffect(() => {
    const instance = KontentSmartLink.initialize({
      defaultDataAttributes: {
        environmentId: process.env.NEXT_PUBLIC_KONTENT_ENVIRONMENT_ID!,
        languageCodename: "default",
      },
    });

    return () => {
      instance.destroy();
    };
  }, []);

  return null;
}
