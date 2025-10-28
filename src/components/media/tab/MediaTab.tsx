"use client";

import React from "react";
import Checkbox from "../../form/input/Checkbox";
import PaginationWithTextWitIcon from "../../ui/pagination/PaginationWithTextWitIcon";

type Music = {
  id: string;
  title: string;
  artist?: string;
  durationSeconds: number;
  fileUrl: string;
  cover?: string | null;
};

type Props = {
  loading: boolean;
  error: string | null;
  paginatedMusic: Music[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  isPlaying: boolean;
  currentPlayingId: string | null;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, checked: boolean) => void;
  onPlayPause: (item: Music) => void;
  onPageChange: (newPage: number) => void;
};

function formatDuration(seconds: number) {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Deterministic color palette and SVG placeholder generator */
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
  const initials = (text || "M")
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

export default function MediaTab({
  loading,
  error,
  paginatedMusic,
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  isPlaying,
  currentPlayingId,
  selectedIds,
  onToggleSelect,
  onPlayPause,
  onPageChange,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {loading && <div className="px-6 py-8 text-sm text-gray-500">Loading music…</div>}
      {!!error && !loading && <div className="px-6 py-8 text-sm text-red-600">Failed to load music: {error}</div>}

      {!loading && !error && (
        <>
          <div className="divide-y divide-gray-100">
            {paginatedMusic.length > 0 ? (
              paginatedMusic.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onChange={(checked) => onToggleSelect(item.id, checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />

                    <div className="w-14 h-14 rounded-lg overflow-hidden">
                      <img
                        src={item.cover ?? generatePlaceholderCover(item.title)}
                        width={56}
                        height={56}
                        alt={item.title}
                        className="object-cover w-[56px] h-[56px]"
                      />
                    </div>

                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{item.title}</div>
                      <div className="text-gray-500 text-xs mt-1">
                        {item.artist ?? "Unknown Artist"} &nbsp;|&nbsp; {formatDuration(item.durationSeconds)} mins
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <audio
                      id={`audio-${item.id}`}
                      src={item.fileUrl}
                      onEnded={() => {
                        /* parent handles global play state if required */
                      }}
                    />

                    <button
                      onClick={() => onPlayPause(item)}
                      aria-label="play"
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-orange-500 text-white shadow hover:bg-orange-600 transition-colors"
                    >
                      {isPlaying && currentPlayingId === item.id ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M6 4h3v12H6zM11 4h3v12h-3z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M6.5 5.5v9l7-4.5-7-4.5z" />
                        </svg>
                      )}
                    </button>

                    <button aria-label="more" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-sm text-gray-500">No music found.</div>
            )}
          </div>

          {totalItems > 0 && (
            <div className="mt-4 flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                {totalItems === 0
                  ? `Showing 0 to 0 of 0 music`
                  : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, totalItems)} of ${totalItems} music`}
              </div>
              <div className="flex-1 flex justify-center">
                <PaginationWithTextWitIcon totalPages={totalPages} initialPage={currentPage} onPageChange={onPageChange} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}