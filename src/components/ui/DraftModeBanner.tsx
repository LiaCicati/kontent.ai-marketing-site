"use client";

import { usePathname } from "next/navigation";

export default function DraftModeBanner() {
  const pathname = usePathname();
  const disableUrl = `/api/disable-draft?returnTo=${encodeURIComponent(pathname)}`;

  return (
    <div className="bg-amber-500 text-white text-center text-sm py-2 px-4">
      Draft Mode is enabled.{" "}
      <a href={disableUrl} className="underline font-medium">
        Disable Draft Mode
      </a>
    </div>
  );
}
