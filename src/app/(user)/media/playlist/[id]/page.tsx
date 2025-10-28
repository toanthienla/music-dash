"use client";

import React from "react";
import PlaylistDetail from "@/components/media/PlaylistDetail";

interface Props {
  params: Promise<{ id: string }>; // mark as Promise
}

export default async function PlaylistIdPage({ params }: Props) {
  const { id } = await params; // ✅ await params before using
  return <PlaylistDetail id={id} />;
}
