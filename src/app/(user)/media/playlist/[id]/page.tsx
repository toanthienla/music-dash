import React from "react";
import PlaylistDetail from "@/components/media/PlaylistDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlaylistIdPage({ params }: Props) {
  const { id } = await params;
  return <PlaylistDetail id={id} />;
}