
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Image from "next/image";

interface Song {
  id: number;
  title: string;
  artist: string;
  duration: string;
  cover: string;
}

const recentlyPlayedData: Song[] = [
  {
    id: 1,
    title: "Without You - The Kid LAROI",
    artist: "",
    duration: "",
    cover: "/images/music/without.svg",
  },
  {
    id: 2,
    title: "Shades of Love - Ania Szarmach",
    artist: "",
    duration: "",
    cover: "/images/music/shades.svg",
  },
  {
    id: 3,
    title: "Save Your Tears - The Weeknd",
    artist: "",
    duration: "",
    cover: "/images/music/saveyourtear.svg",
  },
  {
    id: 4,
    title: "Without You - The Kid LAROI",
    artist: "",
    duration: "",
    cover: "/images/music/without.svg",
  },
  {
    id: 5,
    title: "Shades of Love - Ania Szarmach",
    artist: "",
    duration: "",
    cover: "/images/music/shades.svg",
  },
];

const playlistData: Song[] = [
  { id: 1, title: "Ariana Grande", artist: "", duration: "", cover: "/images/music/ariana.svg" },
  { id: 2, title: "The Weeknd", artist: "", duration: "", cover: "/images/music/starboy.svg" },
  { id: 3, title: "Acidrap", artist: "", duration: "", cover: "/images/music/acidrap.svg" },
  { id: 4, title: "Ariana Grande", artist: "", duration: "", cover: "/images/music/ariana.svg" },
  { id: 5, title: "The Weeknd", artist: "", duration: "", cover: "/images/music/starboy.svg" },
];

export default function RecentOrders() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4">
        <div className="flex items-center justify-end gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="dark:bg-dark-900 h-[42px] w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-[42px] pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
            />
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            <svg className="stroke-current fill-white dark:fill-gray-800" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.29004 5.90393H17.7067" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17.7075 14.0961H2.29085" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z" fill="" stroke="" strokeWidth="1.5" />
              <path d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z" fill="" stroke="" strokeWidth="1.5" />
            </svg>
            Filter
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recently Played</h3>
          <button className="text-orange-500 font-medium hover:underline">See All</button>
        </div>
      </div>

      {/* Recently Played carousel */}
      <div className="mt-4">
        <div className="relative">
          <button
            aria-label="prev"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center -ml-4"
            onClick={() => {
              const el = document.getElementById('recent-played-scroll');
              if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
            }}
          >
            <span className="text-gray-500">‹</span>
          </button>

          <div id="recent-played-scroll" className="no-scrollbar flex gap-5 overflow-x-auto pb-4 pl-8">
            {recentlyPlayedData.map((s) => (
              <div key={s.id} className="w-[150px] shrink-0">
                <div className="h-[150px] w-[150px] overflow-hidden rounded-xl shadow-sm">
                  <Image src={s.cover} width={150} height={150} alt={s.title} />
                </div>
                <p className="mt-3 font-semibold text-gray-800 text-sm">{s.title}</p>
                <p className="text-gray-500 text-xs truncate">{s.artist}</p>
              </div>
            ))}
          </div>

          <button
            aria-label="next"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center -mr-4"
            onClick={() => {
              const el = document.getElementById('recent-played-scroll');
              if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
            }}
          >
            <span className="text-gray-500">›</span>
          </button>
        </div>
      </div>

      {/* Play list carousel */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-gray-800">Play list</h4>
          <button className="text-orange-500 font-medium hover:underline">See All</button>
        </div>

        <div className="relative">
          <button
            aria-label="prev-playlist"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center -ml-4"
            onClick={() => {
              const el = document.getElementById('playlist-scroll');
              if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
            }}
          >
            <span className="text-gray-500">‹</span>
          </button>

          <div id="playlist-scroll" className="no-scrollbar flex gap-8 overflow-x-auto pb-4 pl-8">
            {playlistData.map((s) => (
              <div key={s.id} className="w-[120px] shrink-0 text-center">
                <div className="h-[120px] w-[120px] mx-auto overflow-hidden rounded-full shadow-sm">
                  <Image src={s.cover} width={120} height={120} alt={s.title} />
                </div>
                <p className="mt-3 font-medium text-gray-800 text-sm">{s.title}</p>
              </div>
            ))}
          </div>

          <button
            aria-label="next-playlist"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center -mr-4"
            onClick={() => {
              const el = document.getElementById('playlist-scroll');
              if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
            }}
          >
            <span className="text-gray-500">›</span>
          </button>
        </div>
      </div>

    </div>
  );
}
