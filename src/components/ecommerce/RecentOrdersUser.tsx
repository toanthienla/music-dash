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
import { useEffect, useState } from "react";
import axiosClient from "@/utils/axiosClient";

interface Music {
  id: string;
  title: string;
  artist?: string;
  durationSeconds: number;
  fileUrl: string;
  fileFormat: string;
  bitrateKbps: number;
  fileSize: number;
  contentType: string;
  uploadedBy: string;
  visibility: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RecentlyPlayedItem {
  music: Music;
  playedAt: string;
  playDurationSeconds: number;
  completed: boolean;
}

interface Playlist {
  id: string;
  name: string;
  coverUrl?: string | null;
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  totalDurationSeconds: number;
  trackCount: number;
  description?: string;
}

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

function generatePlaceholderCover(text?: string, size = 150) {
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

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function RecentOrders() {
  const [recentlyPlayedData, setRecentlyPlayedData] = useState<RecentlyPlayedItem[]>([]);
  const [playlistData, setPlaylistData] = useState<Playlist[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [errorRecent, setErrorRecent] = useState<string | null>(null);
  const [errorPlaylists, setErrorPlaylists] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentlyPlayed = async () => {
      try {
        setLoadingRecent(true);
        setErrorRecent(null);
        const response = await axiosClient.get("/api/v1/music/recently-played");

        if (response.data.success && response.data.data?.data) {
          setRecentlyPlayedData(response.data.data.data);
        }
      } catch (err) {
        console.error("Error fetching recently played music:", err);
        setErrorRecent("Failed to load recently played music");
      } finally {
        setLoadingRecent(false);
      }
    };

    fetchRecentlyPlayed();
  }, []);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoadingPlaylists(true);
        setErrorPlaylists(null);
        const response = await axiosClient.get("/api/v1/playlists");

        if (response.data.success && response.data.data?.data) {
          setPlaylistData(response.data.data.data);
        }
      } catch (err) {
        console.error("Error fetching playlists:", err);
        setErrorPlaylists("Failed to load playlists");
      } finally {
        setLoadingPlaylists(false);
      }
    };

    fetchPlaylists();
  }, []);

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
        {loadingRecent && (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">Loading recently played music...</p>
          </div>
        )}

        {errorRecent && (
          <div className="flex justify-center py-8">
            <p className="text-red-500">{errorRecent}</p>
          </div>
        )}

        {!loadingRecent && !errorRecent && recentlyPlayedData.length === 0 && (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">No recently played music found</p>
          </div>
        )}

        {!loadingRecent && !errorRecent && recentlyPlayedData.length > 0 && (
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
              {recentlyPlayedData.map((item) => (
                <div key={item.music.id} className="w-[150px] shrink-0">
                  <div className="h-[150px] w-[150px] overflow-hidden rounded-xl shadow-sm">
                    <img
                      src={generatePlaceholderCover(item.music.title, 150)}
                      alt={item.music.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="mt-3 font-semibold text-gray-800 text-sm dark:text-white/90 truncate">
                    {item.music.title}
                  </p>
                  <p className="text-gray-500 text-xs truncate dark:text-white/60">
                    {item.music.artist || "Unknown Artist"}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {formatDuration(item.music.durationSeconds)}
                  </p>
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
        )}
      </div>

      {/* Play list carousel */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Play list</h4>
          <button className="text-orange-500 font-medium hover:underline">See All</button>
        </div>

        {loadingPlaylists && (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">Loading playlists...</p>
          </div>
        )}

        {errorPlaylists && (
          <div className="flex justify-center py-8">
            <p className="text-red-500">{errorPlaylists}</p>
          </div>
        )}

        {!loadingPlaylists && !errorPlaylists && playlistData.length === 0 && (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">No playlists found</p>
          </div>
        )}

        {!loadingPlaylists && !errorPlaylists && playlistData.length > 0 && (
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
              {playlistData.map((playlist) => (
                <div key={playlist.id} className="w-[120px] shrink-0">
                  <div className="h-[120px] w-[120px] overflow-hidden rounded-full shadow-sm">
                    <img
                      src={
                        playlist.coverUrl
                          ? playlist.coverUrl
                          : generatePlaceholderCover(playlist.name, 120)
                      }
                      width={120}
                      height={120}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="mt-3 font-medium text-gray-800 text-sm text-center truncate dark:text-white/90">
                    {playlist.name}
                  </p>
                  <p className="text-gray-500 text-xs text-center dark:text-white/60">
                    {playlist.trackCount} tracks
                  </p>
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
        )}
      </div>
    </div>
  );
}