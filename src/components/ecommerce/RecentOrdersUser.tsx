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
import { useEffect, useState, useRef } from "react";
import axiosClient from "@/utils/axiosClient";
import { API_URL } from "@/utils/constants";

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

interface GroupTrack {
  id: string;
  title: string;
  artist?: string;
  duration_ms: number;
  track_index: number;
  thumbnail_key?: string;
  thumbnail_url?: string;
}

interface GroupHistoryItem {
  id: string;
  music_id: string;
  track?: GroupTrack;
  context_type: string;
  context_id?: string;
  context_name?: string;
  started_at: string;
  duration_played_ms: number;
  completed: boolean;
}

interface Group {
  id: string;
  user_id: string;
  group_name: string;
  description?: string;
  cover_art_key?: string;
  cover_art_url?: string;
  current_track_id?: string;
  current_track?: GroupTrack;
  position_ms: number;
  playback_status: string;
  volume_level: number;
  repeat_mode: string;
  shuffle: boolean;
  is_active: boolean;
  device_count: number;
  created_at: string;
  updated_at: string;
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

function formatMsToDuration(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return "";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function RecentOrders() {
  const [playlistData, setPlaylistData] = useState<Playlist[]>([]);

  // groups + history
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupHistory, setGroupHistory] = useState<GroupHistoryItem[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | "all">("all");
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [errorPlaylists, setErrorPlaylists] = useState<string | null>(null);
  const [errorGroups, setErrorGroups] = useState<string | null>(null);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setGroupDropdownOpen(false);
      }
    };

    if (groupDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [groupDropdownOpen]);

  // Playlists
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoadingPlaylists(true);
        setErrorPlaylists(null);
        const response = await axiosClient.get(`${API_URL}/api/v1/playlists`);

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

  // Groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoadingGroups(true);
        setErrorGroups(null);
        const res = await axiosClient.get(`${API_URL}/api/v1/groups/list`);
        if (res.data.success && Array.isArray(res.data.data)) {
          setGroups(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching groups:", err);
        setErrorGroups("Failed to load groups");
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, []);

  // Group / all history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
        setErrorHistory(null);

        const url =
          selectedGroupId === "all"
            ? `${API_URL}/api/v1/groups/history`
            : `${API_URL}/api/v1/groups/${selectedGroupId}/history`;

        const res = await axiosClient.get(url);

        if (res.data.success && res.data.data) {
          const history =
            res.data.data.history || res.data.data.data?.history || [];
          setGroupHistory(history);
        }
      } catch (err) {
        console.error("Error fetching group history:", err);
        setErrorHistory("Failed to load group history");
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [selectedGroupId]);

  const selectedGroup =
    selectedGroupId === "all"
      ? null
      : groups.find((g) => g.id === selectedGroupId);

  const selectedLabel =
    selectedGroupId === "all"
      ? "All groups"
      : selectedGroup?.group_name || "Unknown group";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4">
        <div className="flex items-center justify-end gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 21l-4.35-4.35"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="11"
                  cy="11"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="dark:bg-dark-900 h-[42px] w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-[42px] pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
            />
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            <svg
              className="stroke-current fill-white dark:fill-gray-800"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.29004 5.90393H17.7067"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.7075 14.0961H2.29085"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                fill=""
                stroke=""
                strokeWidth="1.5"
              />
              <path
                d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                fill=""
                stroke=""
                strokeWidth="1.5"
              />
            </svg>
            Filter
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Playback History
          </h3>

          {/* Custom group select */}
          <div className="relative w-60" ref={dropdownRef}>
            <button
              type="button"
              onClick={() =>
                !loadingGroups && !errorGroups && setGroupDropdownOpen((o) => !o)
              }
              className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {selectedLabel}
                </p>
                {loadingGroups && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Loading groups...
                  </p>
                )}
                {errorGroups && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    Failed to load
                  </p>
                )}
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`lucide lucide-chevron-down text-gray-600 dark:text-gray-400 transition-transform flex-shrink-0 ${groupDropdownOpen ? "rotate-180" : ""
                  }`}
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </button>

            {groupDropdownOpen && !loadingGroups && !errorGroups && (
              <div className="absolute right-0 mt-2 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 z-20 max-h-64 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGroupId("all");
                    setGroupDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedGroupId === "all"
                    ? "bg-gray-50 dark:bg-gray-800"
                    : ""
                    }`}
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      All groups
                    </p>
                  </div>
                </button>

                <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(g.id);
                      setGroupDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedGroupId === g.id
                      ? "bg-gray-50 dark:bg-gray-800"
                      : ""
                      }`}
                  >
                    <div className="text-left">
                      <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                        {g.group_name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Group / All history carousel */}
      <div className="mt-4">
        {(loadingGroups || loadingHistory) && (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">Loading history...</p>
          </div>
        )}

        {!loadingGroups && errorGroups && (
          <div className="flex justify-center py-8">
            <p className="text-red-500">{errorGroups}</p>
          </div>
        )}

        {!loadingHistory && errorHistory && (
          <div className="flex justify-center py-8">
            <p className="text-red-500">{errorHistory}</p>
          </div>
        )}

        {!loadingHistory && !errorHistory && groupHistory.length === 0 && (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">No playback history found</p>
          </div>
        )}

        {!loadingHistory && !errorHistory && groupHistory.length > 0 && (
          <div className="relative">
            <button
              aria-label="prev-history"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center -ml-4"
              onClick={() => {
                const el = document.getElementById("group-history-scroll");
                if (el) el.scrollBy({ left: -300, behavior: "smooth" });
              }}
            >
              <span className="text-gray-500">‹</span>
            </button>

            <div
              id="group-history-scroll"
              className="no-scrollbar flex gap-5 overflow-x-auto pb-4 pl-8"
            >
              {groupHistory.map((item) => {
                const track = item.track;
                const title =
                  track?.title || item.context_name || "Unknown Track";
                const artist = track?.artist || "Unknown Artist";
                const duration = formatMsToDuration(track?.duration_ms);

                return (
                  <div key={item.id} className="w-[150px] shrink-0">
                    <div className="h-[150px] w-[150px] overflow-hidden rounded-xl shadow-sm">
                      <img
                        src={
                          track?.thumbnail_url
                            ? track.thumbnail_url
                            : generatePlaceholderCover(title, 150)
                        }
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="mt-3 font-semibold text-gray-800 text-sm dark:text-white/90 truncate">
                      {title}
                    </p>
                    <p className="text-gray-500 text-xs truncate dark:text-white/60">
                      {artist}
                    </p>
                    {duration && (
                      <p className="text-gray-400 text-xs mt-1">{duration}</p>
                    )}
                    <p className="text-gray-400 text-[11px] mt-1">
                      {new Date(item.started_at).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              aria-label="next-history"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center -mr-4"
              onClick={() => {
                const el = document.getElementById("group-history-scroll");
                if (el) el.scrollBy({ left: 300, behavior: "smooth" });
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
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Play list
          </h4>
          <button className="text-orange-500 font-medium hover:underline">
            See All
          </button>
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

        {!loadingPlaylists &&
          !errorPlaylists &&
          playlistData.length === 0 && (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No playlists found</p>
            </div>
          )}

        {!loadingPlaylists &&
          !errorPlaylists &&
          playlistData.length > 0 && (
            <div className="relative">
              <button
                aria-label="prev-playlist"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center -ml-4"
                onClick={() => {
                  const el = document.getElementById("playlist-scroll");
                  if (el) el.scrollBy({ left: -300, behavior: "smooth" });
                }}
              >
                <span className="text-gray-500">‹</span>
              </button>

              <div
                id="playlist-scroll"
                className="no-scrollbar flex gap-8 overflow-x-auto pb-4 pl-8"
              >
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
                  const el = document.getElementById("playlist-scroll");
                  if (el) el.scrollBy({ left: 300, behavior: "smooth" });
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