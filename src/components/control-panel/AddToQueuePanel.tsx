"use client";

import React from "react";
import { X, Search } from "lucide-react";
import { IOT_BASE_URL } from "@/utils/constants";

interface MusicItem {
  id: string;
  title: string;
  artist?: string;
  durationSeconds: number;
  thumbnailUrl?: string;  // Changed from thumbnail_key
  fileUrl: string;
  album?: string;
  genre?: string;
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

interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  userId?: string;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  trackCount: number;
  totalDurationSeconds: number;
  total_duration_ms?: number;
  track_count?: number;
}

interface AddToQueuePanelProps {
  isOpen: boolean;
  activeTab: "music" | "playlist";
  availableMusic: MusicItem[];
  availablePlaylists: Playlist[];
  loadingMusic: boolean;
  loadingPlaylists: boolean;
  selectedMusicIds: Set<string>;
  selectedPlaylistIds: Set<string>;
  addingToQueue: boolean;
  searchMusicTerm: string;
  searchPlaylistTerm: string;
  onClose: () => void;
  onTabChange: (tab: "music" | "playlist") => void;
  onSearchMusicChange: (term: string) => void;
  onSearchPlaylistChange: (term: string) => void;
  onToggleMusicSelection: (musicId: string) => void;
  onTogglePlaylistSelection: (playlistId: string) => void;
  onAddToQueue: () => void;
  formatDuration: (ms: number) => string;
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

function generatePlaceholderCover(text?: string, size = 100) {
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

const AddToQueuePanel: React.FC<AddToQueuePanelProps> = ({
  isOpen,
  activeTab,
  availableMusic,
  availablePlaylists,
  loadingMusic,
  loadingPlaylists,
  selectedMusicIds,
  selectedPlaylistIds,
  addingToQueue,
  searchMusicTerm,
  searchPlaylistTerm,
  onClose,
  onTabChange,
  onSearchMusicChange,
  onSearchPlaylistChange,
  onToggleMusicSelection,
  onTogglePlaylistSelection,
  onAddToQueue,
  formatDuration,
}) => {
  const filteredAvailableMusic = availableMusic.filter((music) => {
    const q = searchMusicTerm.toLowerCase();
    return (
      music.title.toLowerCase().includes(q) ||
      (music.artist ?? "").toLowerCase().includes(q)
    );
  });

  const filteredAvailablePlaylists = availablePlaylists.filter((playlist) => {
    const q = searchPlaylistTerm.toLowerCase();
    return playlist.name.toLowerCase().includes(q);
  });

  const getMusicThumbnailUrl = (music: MusicItem): string => {
    // Check if thumbnailUrl exists and is not empty
    if (music.thumbnailUrl) {
      return music.thumbnailUrl;
    }
    return generatePlaceholderCover(music.title ?? "Unknown", 100);
  };

  const getPlaylistThumbnailUrl = (playlist: Playlist): string => {
    if (playlist.coverUrl) {
      return playlist.coverUrl;
    }
    return generatePlaceholderCover(playlist.name ?? "Unknown", 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex">
      <div onClick={onClose} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <aside className="relative ml-auto w-full max-w-[560px] h-screen bg-white rounded-l-2xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Add to Queue</h3>
              <p className="text-sm text-gray-500 mt-1">
                Select songs or playlists to add
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => onTabChange("music")}
              className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${activeTab === "music"
                ? "text-[#FF9100] border-[#FF9100]"
                : "text-gray-600 border-transparent hover:text-gray-800"
                }`}
            >
              Music
            </button>
            <button
              onClick={() => onTabChange("playlist")}
              className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${activeTab === "playlist"
                ? "text-[#FF9100] border-[#FF9100]"
                : "text-gray-600 border-transparent hover:text-gray-800"
                }`}
            >
              Playlists
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder={
                activeTab === "music" ? "Search music..." : "Search playlists..."
              }
              value={activeTab === "music" ? searchMusicTerm : searchPlaylistTerm}
              onChange={(e) => {
                if (activeTab === "music") {
                  onSearchMusicChange(e.target.value);
                } else {
                  onSearchPlaylistChange(e.target.value);
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "music" ? (
            loadingMusic ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading music...</p>
              </div>
            ) : filteredAvailableMusic.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-center">
                  {searchMusicTerm ? "No matching music found" : "No music available"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAvailableMusic.map((music) => (
                  <div
                    key={music.id}
                    onClick={() => onToggleMusicSelection(music.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedMusicIds.has(music.id)
                      ? "bg-orange-50 border-[#FF9100]"
                      : "bg-gray-50 border-transparent hover:bg-gray-100"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMusicIds.has(music.id)}
                      onChange={() => { }}
                      className="w-4 h-4 cursor-pointer flex-shrink-0"
                    />
                    {/* Music Thumbnail */}
                    <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                      <img
                        src={getMusicThumbnailUrl(music)}
                        alt={music.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = generatePlaceholderCover(
                            music.title ?? "Unknown"
                          );
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {music.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {music.artist || "Unknown Artist"} •{" "}
                        {formatDuration(music.durationSeconds * 1000)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : loadingPlaylists ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading playlists...</p>
            </div>
          ) : filteredAvailablePlaylists.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-center">
                {searchPlaylistTerm
                  ? "No matching playlists found"
                  : "No playlists available"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAvailablePlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => onTogglePlaylistSelection(playlist.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedPlaylistIds.has(playlist.id)
                    ? "bg-orange-50 border-[#FF9100]"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlaylistIds.has(playlist.id)}
                    onChange={() => { }}
                    className="w-4 h-4 cursor-pointer flex-shrink-0"
                  />
                  {/* Playlist Thumbnail */}
                  <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                    <img
                      src={getPlaylistThumbnailUrl(playlist)}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = generatePlaceholderCover(
                          playlist.name ?? "Unknown"
                        );
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {playlist.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {playlist.trackCount} {playlist.trackCount === 1 ? "song" : "songs"} •{" "}
                      {formatDuration((playlist.total_duration_ms || playlist.totalDurationSeconds * 1000))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onAddToQueue}
            disabled={
              (selectedMusicIds.size === 0 && selectedPlaylistIds.size === 0) ||
              addingToQueue
            }
            className="px-4 py-2 bg-[#FF9100] text-white rounded-lg hover:bg-orange-600 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {addingToQueue
              ? "Adding..."
              : `Add (${selectedMusicIds.size + selectedPlaylistIds.size})`}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default AddToQueuePanel;