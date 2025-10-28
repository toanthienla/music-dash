"use client";

import React from "react";
import Link from "next/link";
import Checkbox from "../../form/input/Checkbox";
import PaginationWithTextWitIcon from "../../ui/pagination/PaginationWithTextWitIcon";

type Playlist = {
  id: string;
  name: string;
  coverUrl?: string | null;
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  totalDurationSeconds: number;
  trackCount: number;
};

type Props = {
  loading: boolean;
  error: string | null;
  paginatedPlaylists: Playlist[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  selectedPlaylistIds: Set<string>;
  onToggleSelect: (id: string, checked: boolean) => void;
  onPageChange: (newPage: number) => void;
};

function pickColorForText(text?: string) {
  const palette = [
    "#EF4444",
    "#F97316",
    "#F59E0B",
    "#10B981",
    "#06B6D4",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
  ];
  if (!text) return palette[0];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
}
function generatePlaceholderCover(text?: string, size = 400) {
  const color = pickColorForText(text);
  const initials = (text || "P")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((t) => (t ? t[0].toUpperCase() : ""))
    .join("");
  const fontSize = Math.floor(size * 0.28);
  const rx = Math.floor(size * 0.06);

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    <rect width='100%' height='100%' fill='${color}' rx='${rx}' ry='${rx}'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, Roboto, Arial, sans-serif' font-weight='600' font-size='${fontSize}' fill='#ffffff'>${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function PlaylistTab({
  loading,
  error,
  paginatedPlaylists,
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  selectedPlaylistIds,
  onToggleSelect,
  onPageChange,
}: Props) {
  return (
    <>
      {loading && <div className="px-6 py-8 text-sm text-gray-500">Loading playlists…</div>}
      {!!error && !loading && <div className="px-6 py-8 text-sm text-red-600">Failed to load playlists: {error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {paginatedPlaylists.length > 0 ? (
            <>
              {paginatedPlaylists.map((item) => (
                <div key={item.id} className="relative">
                  <Link href={`/media/playlist/${item.id}`}>
                    <div className="p-4">
                      <div className="w-36 h-36 rounded-lg overflow-hidden bg-gray-100">
                        {item.coverUrl ? (
                          <img src={item.coverUrl} width={144} height={144} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <img src={generatePlaceholderCover(item.name)} width={144} height={144} alt={item.name} className="w-full h-full object-cover" />
                        )}
                      </div>

                      <div className="mt-4 text-left">
                        <h4 className="font-semibold text-gray-800 text-sm mb-1">{item.name}</h4>
                        <p className="text-xs text-gray-500">{new Date(item.createdAt).getFullYear()}</p>
                        <p className="text-xs text-gray-400 mt-2">{item.trackCount} songs</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100" />
                  </Link>

                  <div className="absolute top-3 right-3 z-10">
                    <Checkbox
                      checked={selectedPlaylistIds.has(item.id)}
                      onChange={(checked) => onToggleSelect(item.id, checked)}
                      className="w-4 h-4 text-indigo-600 rounded bg-white"
                    />
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 mt-6 flex justify-center">
                  <PaginationWithTextWitIcon totalPages={totalPages} initialPage={currentPage} onPageChange={onPageChange} />
                </div>
              )}
            </>
          ) : (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-8 text-gray-500">No playlists found.</div>
          )}
        </div>
      )}
    </>
  );
}