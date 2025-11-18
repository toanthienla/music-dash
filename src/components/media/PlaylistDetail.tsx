"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axiosClient from "@/utils/axiosClient";
import PaginationWithTextWitIcon from "../ui/pagination/PaginationWithTextWitIcon";
import Checkbox from "../form/input/Checkbox";
import { Modal } from "../ui/modal";
import { API_URL } from "@/utils/constants";

type SongItem = {
  id: string; // This is the track ID
  title: string;
  artist: string;
  durationSeconds: number;
  fileUrl: string;
  coverUrl?: string | null;
};

type PlaylistResponse = {
  id: string;
  name: string;
  description?: string | null;
  userId?: string;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  totalDurationSeconds?: number;
  trackCount?: number;
  coverUrl?: string | null;
  tracks?: Array<{
    id: string; // This is the track ID
    music: {
      id: string; // This is the music ID
      title?: string;
      artist?: string;
      durationSeconds?: number;
      fileUrl?: string;
      album?: string;
    };
    position?: number;
    addedAt?: string;
  }>;
};

type AvailableMusic = {
  id: string;
  title: string;
  artist?: string;
  durationSeconds?: number;
  fileUrl: string;
  cover?: string | null;
  isInPlaylist?: boolean;
};

export default function PlaylistDetail({ id }: { id: string }) {
  const router = useRouter();

  const [activeTab, setActiveTab] = React.useState<"media" | "playlist">("playlist");

  // fetched data
  const [playlist, setPlaylist] = React.useState<PlaylistResponse | null>(null);
  const [songs, setSongs] = React.useState<SongItem[]>([]);

  // ui state
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deletingIds, setDeletingIds] = React.useState<Set<string>>(new Set());
  const [addMusicLoading, setAddMusicLoading] = React.useState(false);
  const [addingMusic, setAddingMusic] = React.useState(false);
  const [reorderingIds, setReorderingIds] = React.useState<Set<string>>(new Set());
  const [isReordering, setIsReordering] = React.useState(false);

  // local selection & search
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = React.useState("");

  // pagination (client-side)
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 20;

  // Drag and drop state
  const [draggedItem, setDraggedItem] = React.useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = React.useState<string | null>(null);

  // Add music to playlist modal state
  const [isAddMusicOpen, setIsAddMusicOpen] = React.useState(false);
  const [availableMusic, setAvailableMusic] = React.useState<AvailableMusic[]>([]);
  const [selectedMusicToAdd, setSelectedMusicToAdd] = React.useState<Set<string>>(new Set());
  const [addMusicSearch, setAddMusicSearch] = React.useState("");

  // Cover image error state
  const [coverImageError, setCoverImageError] = React.useState(false);

  // --- Helpers ---
  const pad = (n: number) => n.toString().padStart(2, "0");
  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${pad(s)}`;
  };

  // deterministic palette for placeholder color
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

  function initialsFrom(text?: string) {
    if (!text) return "P";
    return text
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((t) => t[0]?.toUpperCase() ?? "")
      .join("");
  }

  // toggle selection (by string id)
  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleMusicToAdd(id: string) {
    const next = new Set(selectedMusicToAdd);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMusicToAdd(next);
  }

  const handleDeleteSelected = async () => {
    if (!selected || selected.size === 0) return;

    if (!confirm(`Delete ${selected.size} track(s)?`)) return;

    try {
      const trackIds = Array.from(selected);
      setDeletingIds(new Set(trackIds));

      // Call API to delete selected tracks from playlist
      for (const trackId of trackIds) {
        await axiosClient.delete(`${API_URL}/api/v1/playlists/${id}/tracks/${trackId}`);
      }

      setSongs((prev) => prev.filter((s) => !selected.has(s.id)));
      setSelected(new Set());
      alert("Tracks deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting tracks:", error);
      alert(error?.response?.data?.message || "Failed to delete tracks");
    } finally {
      setDeletingIds(new Set());
    }
  };

  // Get all music IDs already in the playlist
  const playlistMusicIds = React.useMemo(() => {
    return new Set(songs.map((s) => s.id));
  }, [songs]);

  // Fetch available music to add
  const fetchAvailableMusic = async () => {
    try {
      setAddMusicLoading(true);
      const response = await axiosClient.get(`${API_URL}/api/v1/music`);

      const raw = response.data;
      if (!raw?.success || !raw?.data?.data || !Array.isArray(raw.data.data)) {
        throw new Error("Invalid music payload");
      }

      const formatted: AvailableMusic[] = raw.data.data.map((item: any) => {
        const musicId = item.id;
        const isInPlaylist = playlistMusicIds.has(musicId);

        return {
          id: musicId,
          title: item.title ?? "Unknown Title",
          artist: item.artist ?? "Unknown Artist",
          durationSeconds: item.durationSeconds ?? 0,
          fileUrl: item.fileUrl,
          cover: item.cover ?? null,
          isInPlaylist,
        };
      });

      setAvailableMusic(formatted);
    } catch (err: any) {
      console.error("Error fetching available music:", err);
      alert("Failed to load available music");
    } finally {
      setAddMusicLoading(false);
    }
  };

  // Handle add music to playlist
  const handleAddMusicToPlaylist = async () => {
    if (!selectedMusicToAdd.size || !playlist) return;

    try {
      setAddingMusic(true);

      // Prepare the musicIds array
      const musicIds = Array.from(selectedMusicToAdd);

      // Send single request with all musicIds
      await axiosClient.post(
        `${API_URL}/api/v1/playlists/${playlist.id}/tracks`,
        { musicIds }
      );

      // Refresh playlist data
      const response = await axiosClient.get(`${API_URL}/api/v1/playlists/${playlist.id}`);

      const raw = response.data;
      const data: PlaylistResponse | undefined = raw?.data ?? raw;

      if (data) {
        setPlaylist(data);

        const mapped: SongItem[] = (data.tracks ?? []).map((t) => {
          const m = t.music ?? ({} as any);
          return {
            id: t.id, // Use track ID
            title: m.title ?? "Untitled",
            artist: m.artist ?? "Unknown Artist",
            durationSeconds: m.durationSeconds ?? 0,
            fileUrl: m.fileUrl ?? "",
            coverUrl: (m as any).cover ?? null,
          };
        });

        setSongs(mapped);
      }

      setIsAddMusicOpen(false);
      setSelectedMusicToAdd(new Set());
      setAddMusicSearch("");
      alert("Music added to playlist successfully!");
    } catch (error: any) {
      console.error("Error adding music to playlist:", error);
      alert(error?.response?.data?.message || "Failed to add music to playlist");
    } finally {
      setAddingMusic(false);
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, songId: string) => {
    setDraggedItem(songId);
    e.dataTransfer.effectAllowed = "move";
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, songId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverItem(songId);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    setDragOverItem(null);

    if (!draggedItem) return;

    // Find indices in the full filteredSongs array (not paginated)
    const draggedIndex = filteredSongs.findIndex((s) => s.id === draggedItem);
    if (draggedIndex === -1) return;

    // Prevent dropping on the same item
    if (draggedIndex === dropIndex) {
      setDraggedItem(null);
      return;
    }

    try {
      setIsReordering(true);

      // Create new array with reordered items
      const newSongs = [...filteredSongs];
      const [draggedSong] = newSongs.splice(draggedIndex, 1);
      newSongs.splice(dropIndex, 0, draggedSong);

      // Update local state immediately
      setSongs(newSongs);
      setDraggedItem(null);

      // Prepare the API payload with all tracks and their new positions using track IDs
      const trackOrders = newSongs.map((song, index) => ({
        track_id: song.id, // This is the track ID
        position: index,
      }));

      // Call the reorder API
      await axiosClient.put(`${API_URL}/api/v1/playlists/${id}/tracks/reorder`, {
        track_orders: trackOrders,
      });

    } catch (error: any) {
      console.error("Error reordering tracks:", error);
      // Revert to original order on error
      await fetchPlaylistDetail();
      alert(error?.response?.data?.message || "Failed to reorder tracks");
    } finally {
      setIsReordering(false);
      setReorderingIds(new Set());
    }
  };

  // Fetch playlist detail function
  const fetchPlaylistDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      setCoverImageError(false);

      const resp = await axiosClient.get(`${API_URL}/api/v1/playlists/${id}`);

      const raw = resp?.data;
      const data: PlaylistResponse | undefined = raw?.data ?? raw;

      if (!data) {
        throw new Error("Invalid playlist payload");
      }

      setPlaylist(data);

      const mapped: SongItem[] = (data.tracks ?? []).map((t) => {
        const m = t.music ?? ({} as any);
        return {
          id: t.id, // Use track ID
          title: m.title ?? "Untitled",
          artist: m.artist ?? "Unknown Artist",
          durationSeconds: m.durationSeconds ?? 0,
          fileUrl: m.fileUrl ?? "",
          coverUrl: (m as any).cover ?? null,
        };
      });

      setSongs(mapped);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch playlist");
      setPlaylist(null);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  // fetch playlist detail when id changes
  React.useEffect(() => {
    fetchPlaylistDetail();
  }, [id]);

  // filtered + paginated songs
  const filteredSongs = React.useMemo(() => {
    if (!searchTerm) return songs;
    const q = searchTerm.toLowerCase();
    return songs.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
  }, [songs, searchTerm]);

  // Filtered available music
  const filteredAvailableMusic = React.useMemo(() => {
    if (!addMusicSearch) return availableMusic;
    const q = addMusicSearch.toLowerCase();
    return availableMusic.filter((m) => m.title.toLowerCase().includes(q) || m.artist?.toLowerCase().includes(q));
  }, [availableMusic, addMusicSearch]);

  const totalItems = filteredSongs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginated = React.useMemo(() => {
    return filteredSongs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredSongs, currentPage]);

  // simple play/pause: delegate to audio elements by id
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentPlayingId, setCurrentPlayingId] = React.useState<string | null>(null);

  const handlePlayPause = (item: SongItem) => {
    const audio = document.getElementById(`audio-${item.id}`) as HTMLAudioElement | null;
    if (!audio) return;

    document.querySelectorAll("audio").forEach((a) => {
      if (a.id !== `audio-${item.id}`) {
        a.pause();
      }
    });

    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
      setCurrentPlayingId(item.id);
    } else {
      audio.pause();
      setIsPlaying(false);
      setCurrentPlayingId(null);
    }
  };

  return (
    <div className="w-full min-h-screen px-6 py-6">
      {/* Tabs - Always visible */}
      <div className="flex items-center justify-start">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              router.push("/media?tab=media");
            }}
            className={`pb-3 font-semibold border-b-2 transition-colors ${activeTab === "media"
              ? "text-orange-500 border-orange-400"
              : "text-gray-400 border-transparent"
              }`}
          >
            Media
          </button>
          <button
            onClick={() => {
              router.push("/media?tab=playlist");
            }}
            className={`pb-3 font-semibold border-b-2 transition-colors ${activeTab === "playlist"
              ? "text-orange-500 border-orange-400"
              : "text-gray-400 border-transparent"
              }`}
          >
            Playlist
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-8 px-6 py-8 text-sm text-gray-500">Loading playlist…</div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mt-8 px-6 py-8 text-sm text-red-600">Failed to load playlist: {error}</div>
      )}

      {/* Content - Only show when not loading */}
      {!loading && !error && (
        <>
          <div className="mt-6 flex items-start gap-6">
            <div className="w-56 h-56 rounded-2xl overflow-hidden shadow-md">
              {playlist && playlist.coverUrl && !coverImageError ? (
                <Image
                  src={playlist.coverUrl}
                  width={224}
                  height={224}
                  alt={playlist.name || "cover"}
                  className="object-cover w-full h-full"
                  onError={() => setCoverImageError(true)}
                  priority
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white text-xl font-semibold"
                  style={{ background: pickColorForText(playlist?.name), minHeight: 224 }}
                >
                  {initialsFrom(playlist?.name)}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="p-8 md:p-15 flex flex-col md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="text-4xl font-bold">{playlist?.name ?? "Playlist"}</h1>
                  <div className="text-sm text-gray-500 mt-2">
                    {playlist?.description ?? ""}
                    <span> • Album </span>
                    <span>{playlist ? `${playlist.trackCount ?? songs.length} songs` : ""}</span>
                    <span> • {playlist ? `${formatDuration(playlist.totalDurationSeconds)} mins` : ""}</span>
                  </div>
                </div>

                <div className="mt-4 md:mt-6 flex items-center gap-6">
                  <button
                    className="flex items-center gap-3 px-10 py-3 rounded-full text-white text-sm"
                    style={{ background: "linear-gradient(180deg,#ff8a2b,#f97316)", boxShadow: "0 12px 30px rgba(249,115,22,0.18)", minWidth: 180 }}
                  >
                    <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.9699 3.71967C19.2628 3.42678 19.7376 3.42678 20.0305 3.71967L22.2804 5.96957C22.5733 6.26246 22.5733 6.73733 22.2804 7.03023L20.0303 9.28033C19.7374 9.57322 19.2626 9.57322 18.9697 9.28033C18.6768 8.98744 18.6768 8.51256 18.9697 8.21967L19.9393 7.25L17.1865 7.25C16.9685 7.25 16.7614 7.34482 16.6189 7.50979L12.741 12L16.6189 16.4902C16.7614 16.6552 16.9685 16.75 17.1865 16.75H19.9395L18.9699 15.7803C18.677 15.4874 18.677 15.0126 18.9699 14.7197C19.2628 14.4268 19.7376 14.4268 20.0305 14.7197L22.2804 16.9696C22.5733 17.2625 22.5733 17.7373 22.2804 18.0302L20.0303 20.2803C19.7374 20.5732 19.2626 20.5732 18.9697 20.2803C18.6768 19.9874 18.6768 19.5126 18.9697 19.2197L19.9393 18.25H17.1865C16.5326 18.25 15.9111 17.9655 15.4837 17.4706L11.75 13.1475L8.01634 17.4706C7.58894 17.9655 6.96738 18.25 6.31349 18.25H3.25C2.83579 18.25 2.5 17.9142 2.5 17.5C2.5 17.0858 2.83579 16.75 3.25 16.75H6.31349C6.53145 16.75 6.73864 16.6552 6.8811 16.4902L10.759 12L6.8811 7.50979C6.73864 7.34482 6.53145 7.25 6.31349 7.25H3.25C2.83579 7.25 2.5 6.91421 2.5 6.5C2.5 6.08579 2.83579 5.75 3.25 5.75H6.31349C6.96738 5.75 7.58894 6.03447 8.01634 6.52936L11.75 10.8525L15.4837 6.52936C15.9111 6.03447 16.5326 5.75 17.1865 5.75L19.9395 5.75L18.9699 4.78033C18.677 4.48744 18.677 4.01256 18.9699 3.71967Z" fill="#fff" />
                    </svg>
                    <span className="font-medium">Shuffle</span>
                  </button>

                  <button className="flex items-center gap-3 px-8 py-3 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-sm hover:bg-amber-100 transition-colors">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm">
                      <span className="w-4 h-4 flex items-center justify-center rounded-full bg-amber-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M6.5 5.5v9l7-4.5-7-4.5z" />
                        </svg>
                      </span>
                    </span>
                    <span className="font-medium">Play</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* header row: count left, search+controls right */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-gray-800 font-semibold">{filteredSongs.length} songs</div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-[420px] rounded-lg border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400"
                  placeholder="Search..."
                />
              </div>

              <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-800">
                <svg className="stroke-current fill-white" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.29004 5.90393H17.7067" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17.7075 14.0961H2.29085" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z" fill="" stroke="" strokeWidth="1.5" />
                  <path d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z" fill="" stroke="" strokeWidth="1.5" />
                </svg>
                Filter
              </button>

              <button
                onClick={() => {
                  setIsAddMusicOpen(true);
                  fetchAvailableMusic();
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-100 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Music
              </button>

              <button
                onClick={handleDeleteSelected}
                disabled={selected.size === 0 || deletingIds.size > 0}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${selected.size === 0 || deletingIds.size > 0
                  ? 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed'
                  : 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-400'
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-4 h-4 ${selected.size === 0 ? 'text-gray-300' : 'text-red-600'}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M3 6h18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 11v6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 11v6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {deletingIds.size > 0 ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>

          {/* Reordering info */}
          {isReordering && (
            <div className="mt-4 px-6 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              Reordering tracks...
            </div>
          )}

          <div className="mt-6 rounded-xl border border-gray-200 bg-white">
            <div className="divide-y divide-gray-100">
              {paginated.map((s, index) => {
                const actualIndex = filteredSongs.findIndex((song) => song.id === s.id);
                const isDragging = draggedItem === s.id;
                const isDragOver = dragOverItem === s.id;

                return (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, s.id)}
                    onDragOver={(e) => handleDragOver(e, s.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, actualIndex)}
                    className={`flex items-center justify-between px-6 py-4 transition-all cursor-move ${isDragging ? "opacity-50 bg-gray-50" : ""} ${isDragOver ? "bg-blue-50 border-l-4 border-blue-400" : ""
                      } ${isReordering ? "pointer-events-none opacity-70" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selected.has(s.id)}
                        onChange={() => toggle(s.id)}
                      />
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                        {s.coverUrl ? (
                          <Image
                            src={s.coverUrl}
                            width={48}
                            height={48}
                            alt={s.title}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm" style={{ background: pickColorForText(s.title) }}>
                            {initialsFrom(s.title)}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{s.title}</div>
                        <div className="text-gray-500 text-xs mt-1">{s.artist}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-gray-500 text-sm">{formatDuration(s.durationSeconds)}</div>

                      <audio id={`audio-${s.id}`} src={s.fileUrl} onEnded={() => { setIsPlaying(false); setCurrentPlayingId(null); }} />

                      <button
                        aria-label="play"
                        onClick={() => handlePlayPause(s)}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                      >
                        {isPlaying && currentPlayingId === s.id ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6 4h3v12H6zM11 4h3v12h-3z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6.5 5.5v9l7-4.5-7-4.5z" />
                          </svg>
                        )}
                      </button>

                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}

              {paginated.length === 0 && <div className="px-6 py-8 text-sm text-gray-500">No songs found.</div>}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <PaginationWithTextWitIcon
              totalPages={totalPages}
              initialPage={currentPage}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        </>
      )}

      {/* Add Music Modal */}
      <Modal isOpen={isAddMusicOpen} onClose={() => setIsAddMusicOpen(false)} className="!m-0 !p-0">
        <div className="fixed inset-0 z-50 flex">
          <div onClick={() => setIsAddMusicOpen(false)} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <aside className="relative ml-auto w-full max-w-[560px] h-screen bg-white rounded-l-2xl shadow-xl flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-xl font-semibold text-gray-800 mb-1">Add Music to Playlist</h3>
              <p className="text-sm text-gray-500 mb-6">Select songs to add to &quot;{playlist?.name}&quot;</p>

              {/* Search */}
              <div className="relative mb-4">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <input
                  value={addMusicSearch}
                  onChange={(e) => setAddMusicSearch(e.target.value)}
                  type="text"
                  placeholder="Search songs..."
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400"
                />
              </div>

              {/* Loading state */}
              {addMusicLoading && (
                <div className="px-6 py-8 text-sm text-gray-500">Loading music…</div>
              )}

              {/* Song list */}
              {!addMusicLoading && (
                <div className="space-y-2 overflow-y-auto h-4/5">
                  {filteredAvailableMusic.length > 0 ? (
                    filteredAvailableMusic.map((music) => {
                      const isAlreadyInPlaylist = music.isInPlaylist;
                      const isSelected = selectedMusicToAdd.has(music.id);

                      return (
                        <label
                          key={music.id}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${isAlreadyInPlaylist
                            ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                            : "border-gray-200 hover:bg-gray-50"
                            } ${isSelected ? "bg-brand-50 border-brand-300" : ""}`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => !isAlreadyInPlaylist && toggleMusicToAdd(music.id)}
                            disabled={isAlreadyInPlaylist}
                          />
                          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                            {music.cover ? (
                              <Image
                                src={music.cover}
                                width={40}
                                height={40}
                                alt={music.title}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center text-white text-xs font-semibold"
                                style={{ background: pickColorForText(music.title) }}
                              >
                                {initialsFrom(music.title)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-800 truncate">{music.title}</div>
                            <div className="text-xs text-gray-500 truncate">{music.artist}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-xs text-gray-400">{formatDuration(music.durationSeconds)}</div>
                            {isAlreadyInPlaylist && (
                              <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                Added
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="py-4 text-sm text-gray-500">No songs found.</div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAddMusicOpen(false);
                  setSelectedMusicToAdd(new Set());
                  setAddMusicSearch("");
                }}
                className="px-4 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleAddMusicToPlaylist}
                disabled={selectedMusicToAdd.size === 0 || addingMusic}
                className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed transition-colors"
              >
                {addingMusic ? `Adding...` : `Add ${selectedMusicToAdd.size} Song${selectedMusicToAdd.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </aside>
        </div>
      </Modal>
    </div>
  );
}