"use client";

import React from "react";
import Link from "next/link";
import axiosClient from "@/utils/axiosClient";
import { TEKNIX_USER_SESSION_TOKEN, MOCK_API_URL } from "@/utils/constants";

import PaginationWithTextWitIcon from "../ui/pagination/PaginationWithTextWitIcon";
import { TrashBinIcon } from "@/icons";
import { Modal } from "../ui/modal";
import DropzoneMp3 from "@/components/form/form-elements/DropZoneMp3";
import Checkbox from "../form/input/Checkbox";

import MediaTab from "./tab/MediaTab";
import PlaylistTab from "./tab/PlaylistTab";

// ===== Types (kept locally for the parent) =====
type Music = {
  id: string;
  title: string;
  artist?: string;
  durationSeconds: number;
  fileUrl: string;
  cover?: string | null;
};

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

type MusicFormData = {
  title: string;
};

type PlaylistFormData = {
  name: string;
  isPublic: boolean;
};

// ===== API config =====
const MUSIC_API_URL = `${MOCK_API_URL}/api/v1/music`;
const MUSIC_UPLOAD_API_URL = `${MOCK_API_URL}/api/v1/music/upload`;
const PLAYLISTS_API_URL = `${MOCK_API_URL}/api/v1/playlists`;
const QUEUE_API_URL = `${MOCK_API_URL}/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/queue`;

export default function BasicTableOne() {
  // Pagination state - Music
  const [currentMusicPage, setCurrentMusicPage] = React.useState(1);
  const [musicPageSize] = React.useState(8);

  // Pagination state - Playlists
  const [currentPlaylistPage, setCurrentPlaylistPage] = React.useState(1);
  const [playlistPageSize] = React.useState(8);

  // UI state
  const [activeTab, setActiveTab] = React.useState<"media" | "playlist">("media");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  // Data
  const [music, setMusic] = React.useState<Music[]>([]);
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);

  // Selection
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [selectedPlaylistIds, setSelectedPlaylistIds] = React.useState<Set<string>>(new Set());

  // Form: media
  const [mediaForm, setMediaForm] = React.useState<MusicFormData>({
    title: "",
  });
  const [mediaFile, setMediaFile] = React.useState<File | null>(null);

  // Form: playlist
  const [playlistForm, setPlaylistForm] = React.useState<PlaylistFormData>({
    name: "",
    isPublic: false,
  });

  // Loading / Error
  const [loadingMusic, setLoadingMusic] = React.useState(false);
  const [musicError, setMusicError] = React.useState<string | null>(null);
  const [loadingPlaylists, setLoadingPlaylists] = React.useState(false);
  const [playlistsError, setPlaylistsError] = React.useState<string | null>(null);
  const [savingMedia, setSavingMedia] = React.useState(false);
  const [savingPlaylist, setSavingPlaylist] = React.useState(false);
  const [addingToQueue, setAddingToQueue] = React.useState(false);

  // Audio playback state
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentPlayingId, setCurrentPlayingId] = React.useState<string | null>(null);

  const resetForm = () => {
    setMediaForm({
      title: "",
    });
    setMediaFile(null);
    setPlaylistForm({
      name: "",
      isPublic: false,
    });
  };

  // Fetch full lists (no server-side pagination)
  React.useEffect(() => {
    let canceled = false;
    (async () => {
      setLoadingMusic(true);
      setMusicError(null);
      try {
        const response = await axiosClient.get(MUSIC_API_URL);

        const raw = response.data;

        if (!raw?.success || !raw?.data?.data || !Array.isArray(raw.data.data)) {
          throw new Error("Invalid music payload (expected array)");
        }

        const formatted: Music[] = raw.data.data.map((item: any) => ({
          id: item.id,
          title: item.title ?? "Unknown Title",
          artist: item.artist ?? "Unknown Artist",
          durationSeconds: item.durationSeconds ?? 0,
          fileUrl: item.fileUrl,
          cover: item.cover ?? null,
        }));

        if (!canceled) {
          setMusic(formatted);
        }
      } catch (err: any) {
        if (!canceled) {
          setMusicError(err?.message ?? "Failed to fetch music");
          setMusic([]);
        }
      } finally {
        if (!canceled) setLoadingMusic(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  React.useEffect(() => {
    let canceled = false;
    (async () => {
      setLoadingPlaylists(true);
      setPlaylistsError(null);
      try {
        const response = await axiosClient.get(PLAYLISTS_API_URL);

        const raw = response.data;

        if (!raw?.success || !raw?.data?.data || !Array.isArray(raw.data.data)) {
          throw new Error("Invalid playlists payload (expected array)");
        }

        const formatted: Playlist[] = raw.data.data.map((item: any) => ({
          id: item.id,
          name: item.name ?? "Untitled",
          coverUrl: item.coverUrl ?? null,
          userId: item.userId,
          isPublic: item.isPublic ?? false,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          totalDurationSeconds: item.totalDurationSeconds ?? 0,
          trackCount: item.trackCount ?? 0,
        }));

        if (!canceled) {
          setPlaylists(formatted);
        }
      } catch (err: any) {
        if (!canceled) {
          setPlaylistsError(err?.message ?? "Failed to fetch playlists");
          setPlaylists([]);
        }
      } finally {
        if (!canceled) setLoadingPlaylists(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  // Actions
  const handlePlayPause = (item: Music) => {
    const audio = document.getElementById(`audio-${item.id}`) as HTMLAudioElement;
    if (!audio) return;

    document.querySelectorAll("audio").forEach((a) => {
      if (a.id !== `audio-${item.id}`) a.pause();
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

  const handleAddSelectedToQueue = async () => {
    if (selectedIds.size === 0) return;
    try {
      setAddingToQueue(true);

      const musicIds = Array.from(selectedIds);

      const response = await axiosClient.post(QUEUE_API_URL, {
        music_ids: musicIds,
      });

      if (response.data?.success) {
        alert(`${musicIds.length} music added to queue successfully!`);
        setSelectedIds(new Set());
      } else {
        alert("Failed to add music to queue. Please try again.");
      }
    } catch (error: any) {
      console.error("Error adding music to queue:", error);
      alert(error?.response?.data?.message || "Failed to add music to queue. Please try again.");
    } finally {
      setAddingToQueue(false);
    }
  };

  const handleSaveMedia = async () => {
    try {
      setSavingMedia(true);

      if (!mediaForm.title.trim()) {
        alert("Please enter a music title");
        return;
      }

      if (!mediaFile) {
        alert("Please upload an audio file");
        return;
      }

      // Validate file is MP3
      if (!mediaFile.type.includes("audio") || !mediaFile.name.toLowerCase().endsWith(".mp3")) {
        alert("Please upload an MP3 audio file");
        return;
      }

      // Create FormData for multipart/form-data
      const formData = new FormData();

      // Add metadata fields
      formData.append("title", mediaForm.title);

      // Add file
      formData.append("file", mediaFile);

      const response = await axiosClient.post(MUSIC_UPLOAD_API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        // Refresh music list
        const refreshed = await axiosClient.get(MUSIC_API_URL);

        const raw = refreshed.data;
        if (raw?.success && Array.isArray(raw.data?.data)) {
          const formatted: Music[] = raw.data.data.map((item: any) => ({
            id: item.id,
            title: item.title ?? "Unknown Title",
            artist: item.artist ?? "Unknown Artist",
            durationSeconds: item.durationSeconds ?? 0,
            fileUrl: item.fileUrl,
            cover: item.cover ?? null,
          }));
          setMusic(formatted);
        }

        setIsAddOpen(false);
        resetForm();
        alert("Music uploaded successfully!");
      }
    } catch (error: any) {
      console.error("Error saving music:", error);
      alert(error?.response?.data?.message || "Failed to save music. Please try again.");
    } finally {
      setSavingMedia(false);
    }
  };

  const handleSavePlaylist = async () => {
    try {
      setSavingPlaylist(true);

      if (!playlistForm.name.trim()) {
        alert("Please enter a playlist name");
        return;
      }

      // Create FormData for multipart/form-data
      const formData = new FormData();

      // Add metadata fields
      formData.append("name", playlistForm.name);
      formData.append("isPublic", String(playlistForm.isPublic));

      const response = await axiosClient.post(PLAYLISTS_API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        const refreshed = await axiosClient.get(PLAYLISTS_API_URL);
        const raw = refreshed.data;
        if (raw?.success && Array.isArray(raw.data?.data)) {
          const formatted: Playlist[] = raw.data.data.map((item: any) => ({
            id: item.id,
            name: item.name ?? "Untitled",
            coverUrl: item.coverUrl ?? null,
            userId: item.userId,
            isPublic: item.isPublic ?? false,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            totalDurationSeconds: item.totalDurationSeconds ?? 0,
            trackCount: item.trackCount ?? 0,
          }));
          setPlaylists(formatted);
        }
        setIsAddOpen(false);
        resetForm();
        alert("Playlist created successfully!");
      }
    } catch (error: any) {
      console.error("Error saving playlist:", error);
      alert(error?.response?.data?.message || "Failed to save playlist. Please try again.");
    } finally {
      setSavingPlaylist(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.size) return;
    try {
      // Delete each selected music from backend
      for (const musicId of Array.from(selectedIds)) {
        await axiosClient.delete(`${MUSIC_API_URL}/${musicId}`);
      }

      // Remove from local state
      const newMusic = music.filter((s) => !selectedIds.has(s.id));
      setMusic(newMusic);
      setSelectedIds(new Set());

      // adjust page if needed
      const filteredLength = newMusic.filter((s) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return s.title.toLowerCase().includes(q) || (s.artist ?? "").toLowerCase().includes(q);
      }).length;
      const newTotalPages = Math.max(1, Math.ceil(filteredLength / musicPageSize));
      if (currentMusicPage > newTotalPages) setCurrentMusicPage(newTotalPages);

      alert("Music deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting music:", error);
      alert(error?.response?.data?.message || "Failed to delete music. Please try again.");
    }
  };

  const handleDeleteSelectedPlaylists = async () => {
    if (!selectedPlaylistIds.size) return;
    try {
      // Delete each selected playlist from backend
      for (const playlistId of Array.from(selectedPlaylistIds)) {
        await axiosClient.delete(`${PLAYLISTS_API_URL}/${playlistId}`);
      }

      // Remove from local state
      const newPlaylists = playlists.filter((p) => !selectedPlaylistIds.has(p.id));
      setPlaylists(newPlaylists);
      setSelectedPlaylistIds(new Set());

      // adjust page if needed
      const filteredLength = newPlaylists.filter((p) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return p.name.toLowerCase().includes(q);
      }).length;
      const newTotalPages = Math.max(1, Math.ceil(filteredLength / playlistPageSize));
      if (currentPlaylistPage > newTotalPages) setCurrentPlaylistPage(newTotalPages);

      alert("Playlist deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting playlists:", error);
      alert(error?.response?.data?.message || "Failed to delete playlist. Please try again.");
    }
  };

  // Selection toggles
  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };
  const toggleSelectPlaylist = (id: string, checked: boolean) => {
    const next = new Set(selectedPlaylistIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedPlaylistIds(next);
  };

  // Derived: filtering & pagination (client-side)
  const filteredMusic = music.filter((s) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return s.title.toLowerCase().includes(q) || (s.artist ?? "").toLowerCase().includes(q);
  });
  const totalMusicItemsComputed = filteredMusic.length;
  const totalMusicPagesComputed = Math.max(1, Math.ceil(totalMusicItemsComputed / musicPageSize));
  React.useEffect(() => {
    if (currentMusicPage > totalMusicPagesComputed) setCurrentMusicPage(totalMusicPagesComputed);
  }, [totalMusicPagesComputed]);
  const paginatedMusic = filteredMusic.slice((currentMusicPage - 1) * musicPageSize, currentMusicPage * musicPageSize);

  const filteredPlaylists = playlists.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(q);
  });
  const totalPlaylistItemsComputed = filteredPlaylists.length;
  const totalPlaylistPagesComputed = Math.max(1, Math.ceil(totalPlaylistItemsComputed / playlistPageSize));
  React.useEffect(() => {
    if (currentPlaylistPage > totalPlaylistPagesComputed) setCurrentPlaylistPage(totalPlaylistPagesComputed);
  }, [totalPlaylistPagesComputed]);
  const paginatedPlaylists = filteredPlaylists.slice((currentPlaylistPage - 1) * playlistPageSize, currentPlaylistPage * playlistPageSize);

  // Page change handlers
  const handleMusicPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalMusicPagesComputed) {
      setCurrentMusicPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const handlePlaylistPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPlaylistPagesComputed) {
      setCurrentPlaylistPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full min-h-screen px-6 py-6">
      {/* Tabs */}
      <div className="mb-4">
        <div className="flex items-center justify-start">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setActiveTab("media");
                setCurrentMusicPage(1);
              }}
              className={`pb-3 font-semibold border-b-2 transition-colors ${activeTab === "media" ? "text-orange-500 border-orange-400" : "text-gray-400 border-transparent"}`}
            >
              Media
            </button>
            <button
              onClick={() => {
                setActiveTab("playlist");
                setCurrentPlaylistPage(1);
              }}
              className={`pb-3 font-semibold border-b-2 transition-colors ${activeTab === "playlist" ? "text-orange-500 border-orange-400" : "text-gray-400 border-transparent"}`}
            >
              Play list
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-gray-800 font-semibold">{activeTab === "media" ? `${totalMusicItemsComputed} music` : `${totalPlaylistItemsComputed} Play list`}</div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentMusicPage(1);
                  setCurrentPlaylistPage(1);
                }}
                type="text"
                placeholder="Search..."
                className="h-11 w-[420px] rounded-lg border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-600 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>

            {/* Filter placeholder */}
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800">
              <svg className="stroke-current fill-white" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2.29 5.90393H17.7067" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17.7075 14.0961H2.29085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z" strokeWidth="1.5" />
                <path d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z" strokeWidth="1.5" />
              </svg>
              Filter
            </button>

            {activeTab === "media" && (
              <>
                {/* Add to queue button - only for media tab */}
                <button
                  onClick={handleAddSelectedToQueue}
                  disabled={selectedIds.size === 0 || addingToQueue}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-theme-sm font-medium transition-all ${selectedIds.size === 0 || addingToQueue
                    ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700 active:bg-blue-200 shadow-sm hover:shadow-md"
                    }`}
                  title={selectedIds.size === 0 ? "Select music to add to queue" : "Add selected music to queue"}
                >
                  {addingToQueue ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 animate-spin" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 5.293a1 1 0 011.414 0A7 7 0 1015.707 4.293a1 1 0 11-1.414 1.414A5 5 0 005.707 6.707a1 1 0 01-1.414-1.414z" clipRule="evenodd" />
                      </svg>
                      Adding...
                    </>
                  ) : (
                    <>
                      Add to Queue
                    </>
                  )}
                </button>
              </>
            )}

            {/* Bulk delete */}
            <button
              onClick={() => {
                if (activeTab === "media") handleDeleteSelected();
                else handleDeleteSelectedPlaylists();
              }}
              disabled={activeTab === "media" ? selectedIds.size === 0 : selectedPlaylistIds.size === 0}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-theme-sm font-medium transition-all ${(activeTab === "media" && selectedIds.size === 0) || (activeTab === "playlist" && selectedPlaylistIds.size === 0)
                ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                : "border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-400 hover:text-red-700 active:bg-red-200 shadow-sm hover:shadow-md"
                }`}
            >
              Delete{" "}
            </button>

            {/* Add new */}
            <button onClick={() => setIsAddOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm">
              {activeTab === "playlist" ? "+ New Playlist" : "+ New Music"}
            </button>
          </div>
        </div>
      </div>

      {/* Render Tabs via separate components */}
      {activeTab === "media" && (
        <MediaTab
          loading={loadingMusic}
          error={musicError}
          paginatedMusic={paginatedMusic}
          currentPage={currentMusicPage}
          pageSize={musicPageSize}
          totalItems={totalMusicItemsComputed}
          totalPages={totalMusicPagesComputed}
          isPlaying={isPlaying}
          currentPlayingId={currentPlayingId}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onPlayPause={handlePlayPause}
          onPageChange={handleMusicPageChange}
        />
      )}

      {activeTab === "playlist" && (
        <PlaylistTab
          loading={loadingPlaylists}
          error={playlistsError}
          paginatedPlaylists={paginatedPlaylists}
          currentPage={currentPlaylistPage}
          pageSize={playlistPageSize}
          totalItems={totalPlaylistItemsComputed}
          totalPages={totalPlaylistPagesComputed}
          selectedPlaylistIds={selectedPlaylistIds}
          onToggleSelect={toggleSelectPlaylist}
          onPageChange={handlePlaylistPageChange}
        />
      )}

      {/* Add / Edit modal (kept here) */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} className="!m-0 !p-0">
        <div className="fixed inset-0 z-50 flex">
          <div onClick={() => setIsAddOpen(false)} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <aside className="relative ml-auto w-full max-w-[560px] h-screen bg-white rounded-l-2xl shadow-xl flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-xl font-semibold text-gray-800 mb-1">{activeTab === "playlist" ? "Add new play list" : "Add new music"}</h3>
              <p className="text-sm text-gray-500 mb-6">{activeTab === "playlist" ? "Create your play list details." : "Add your music details."}</p>

              <div className="space-y-5">
                {activeTab === "playlist" ? (
                  <>
                    <label className="flex flex-col">
                      <span className="text-sm text-gray-600 mb-2">Playlist Name *</span>
                      <input
                        value={playlistForm.name}
                        onChange={(e) => setPlaylistForm({ ...playlistForm, name: e.target.value })}
                        className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm"
                        placeholder="Enter playlist name"
                      />
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={playlistForm.isPublic}
                        onChange={(e) => setPlaylistForm({ ...playlistForm, isPublic: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Make this playlist public</p>
                        <p className="text-xs text-gray-500">Allow others to discover and view this playlist</p>
                      </div>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="flex flex-col">
                      <span className="text-sm text-gray-600 mb-2">Music Title *</span>
                      <input
                        value={mediaForm.title}
                        onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                        className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm"
                        placeholder="Enter music title"
                      />
                    </label>

                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">Audio File (MP3) *</label>
                      <DropzoneMp3
                        onFileChange={(file: File | null) => {
                          setMediaFile(file);
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(false);
                }}
                className="px-4 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                Close
              </button>

              {activeTab === "playlist" ? (
                <button
                  onClick={handleSavePlaylist}
                  disabled={savingPlaylist || !playlistForm.name.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                  {savingPlaylist ? "Creating..." : "Create Playlist"}
                </button>
              ) : (
                <button
                  onClick={handleSaveMedia}
                  disabled={savingMedia || !mediaForm.title.trim() || !mediaFile}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                  {savingMedia ? "Uploading..." : "Upload Music"}
                </button>
              )}
            </div>
          </aside>
        </div>
      </Modal>
    </div>
  );
}