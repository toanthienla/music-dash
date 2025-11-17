import type { Metadata } from "next";
import Media from "@/components/media/Media";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title:
    "Media | TailAdmin - Next.js Dashboard Template",
  description: "This is the media management page.",
};

export default function MediaPage() {
  return (
    <div className="w-full min-h-screen">
      <Suspense fallback={<div>Loading page...</div>}>
        <Media />
      </Suspense>
    </div>
  );
}