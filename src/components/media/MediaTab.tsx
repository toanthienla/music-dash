"use client";

import React from "react";
import axiosClient from "@/utils/axiosClient";
import { API_URL } from "@/utils/constants";
import { Modal } from "../ui/modal";
import DropzoneMp3 from "@/components/form/form-elements/DropZoneMp3";
import DropzoneImage from "@/components/form/form-elements/DropzoneImage";
import Checkbox from "../form/input/Checkbox";
import PaginationWithTextWitIcon from "../ui/pagination/PaginationWithTextWitIcon";

type Music = {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  genre?: string;
  releaseYear?: number;
  visibility?: string;
  durationSeconds: number;
  fileUrl: string;
  thumbnailUrl?: string;
};

type MusicFormData = {
  title: string;
  artist?: string;
  album?: string;
  genre?: string;
  releaseYear?: string;
  visibility?: string;
};

type EditingMusic = Music & {
  newThumbnailFile?: File | null;
  removeThumbnail?: boolean;
};

const MUSIC_API_URL = `${API_URL}/api/v1/music`;
const MUSIC_UPLOAD_API_URL = `${API_URL}/api/v1/music/upload`;

function formatDuration(seconds: number) {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
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

function generatePlaceholderCover(text?: string, size = 56) {
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

export default function MediaTab() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize] = React.useState(8);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

  const [music, setMusic] = React.useState<Music[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const [mediaForm, setMediaForm] = React.useState<MusicFormData>({ title: "" });
  const [mediaFile, setMediaFile] = React.useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = React.useState<File | null>(null);

  const [editingMusic, setEditingMusic] = React.useState<EditingMusic | null>(null);
  const [editForm, setEditForm] = React.useState<MusicFormData>({ title: "" });
  const [editThumbnailFile, setEditThumbnailFile] = React.useState<File | null>(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentPlayingId, setCurrentPlayingId] = React.useState<string | null>(null);

  // Centralized fetch function so we can call it after upload/update/delete
  const fetchMusic = React.useCallback(
    async (page: number) => {
      let canceled = false;
      try {
        setLoading(true);
        setError(null);

        const response = await axiosClient.get(MUSIC_API_URL, {
          params: {
            page,
            pageSize,
            ...(searchTerm && { query: searchTerm }),
          },
        });

        const raw = response.data;

        if (!raw?.success || !raw?.data?.data || !Array.isArray(raw.data.data)) {
          throw new Error("Invalid music payload (expected array)");
        }

        const formatted: Music[] = raw.data.data.map((item: any) => ({
          id: item.id,
          title: item.title ?? "Unknown Title",
          artist: item.artist ?? "Unknown Artist",
          album: item.album,
          genre: item.genre,
          releaseYear: item.releaseYear,
          visibility: item.visibility,
          durationSeconds: item.durationSeconds ?? 0,
          fileUrl: item.fileUrl,
          thumbnailUrl: item.thumbnailUrl,
        }));

        if (!canceled) {
          setMusic(formatted);
          setTotalItems(raw.data.total || 0);
        }
      } catch (err: any) {
        if (!canceled) {
          setError(err?.message ?? "Failed to fetch music");
          setMusic([]);
          setTotalItems(0);
        }
      } finally {
        if (!canceled) setLoading(false);
      }

      // return a cleanup handle (though not strictly necessary here)
      return () => {
        canceled = true;
      };
    },
    [pageSize, searchTerm]
  );

  // Fetch music list when page/search/pageSize change
  React.useEffect(() => {
    fetchMusic(currentPage);
    // fetchMusic is stable with useCallback deps
  }, [currentPage, fetchMusic]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-menu-container]')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openMenuId]);

  const resetForm = () => {
    setMediaForm({ title: "" });
    setMediaFile(null);
    setThumbnailFile(null);
  };

  const resetEditForm = () => {
    setEditingMusic(null);
    setEditForm({ title: "" });
    setEditThumbnailFile(null);
    setEditThumbnailPreview(null);
  };

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

  const handleSaveMedia = async () => {
    try {
      setSaving(true);

      if (!mediaForm.title.trim()) {
        alert("Please enter a music title");
        return;
      }

      if (!mediaFile) {
        alert("Please upload an audio file");
        return;
      }

      if (!mediaFile.type.includes("audio") || !mediaFile.name.toLowerCase().endsWith(".mp3")) {
        alert("Please upload an MP3 audio file");
        return;
      }

      const formData = new FormData();
      formData.append("title", mediaForm.title);
      formData.append("file", mediaFile);

      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      const response = await axiosClient.post(MUSIC_UPLOAD_API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        // show success, close modal, reset form
        setIsAddOpen(false);
        resetForm();
        alert("Music uploaded successfully!");

        // Ensure the UI reflects the newly uploaded music.
        // Move to first page and re-fetch page 1 explicitly so upload is visible immediately.
        setCurrentPage(1);
        // fetch page 1 explicitly (don't rely on effect if currentPage was already 1)
        await fetchMusic(1);
      } else {
        alert(response.data?.message || "Failed to upload music");
      }
    } catch (error: any) {
      console.error("Error saving music:", error);
      alert(error?.response?.data?.message || "Failed to save music. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditMusic = (item: Music) => {
    setEditingMusic(item);
    setEditForm({
      title: item.title,
      artist: item.artist,
      album: item.album,
      genre: item.genre,
      releaseYear: item.releaseYear?.toString(),
      visibility: item.visibility,
    });
    setEditThumbnailPreview(item.thumbnailUrl || null);
    setEditThumbnailFile(null);
    setOpenMenuId(null);
    setIsEditOpen(true);
  };

  const handleUpdateMusic = async () => {
    try {
      setSaving(true);

      if (!editingMusic) return;

      if (!editForm.title.trim()) {
        alert("Please enter a music title");
        return;
      }

      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("artist", editForm.artist || "");
      formData.append("album", editForm.album || "");
      formData.append("genre", editForm.genre || "");
      formData.append("releaseYear", editForm.releaseYear || "");
      formData.append("visibility", editForm.visibility || "private");

      if (editThumbnailFile) {
        formData.append("thumbnail", editThumbnailFile);
      }

      const response = await axiosClient.put(`${MUSIC_API_URL}/${editingMusic.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        setIsEditOpen(false);
        resetEditForm();
        alert("Music updated successfully!");

        // Re-fetch current page so changes are reflected
        await fetchMusic(currentPage);
      } else {
        alert(response.data?.message || "Failed to update music");
      }
    } catch (error: any) {
      console.error("Error updating music:", error);
      alert(error?.response?.data?.message || "Failed to update music. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMusic = async (musicId: string) => {
    if (!confirm("Are you sure you want to delete this music?")) return;

    try {
      await axiosClient.delete(`${MUSIC_API_URL}/${musicId}`);
      alert("Music deleted successfully!");

      // After deletion, re-fetch the current page. The server will return updated total/items.
      // If current page becomes empty, you may want to navigate to the previous page.
      // We'll fetch current page; if it's empty and totalPages is lower, effect or subsequent logic can adjust.
      const newTotal = Math.max(0, totalItems - 1);
      const newTotalPages = Math.max(1, Math.ceil(newTotal / pageSize));
      const pageToFetch = Math.min(currentPage, newTotalPages);
      setCurrentPage(pageToFetch);
      await fetchMusic(pageToFetch);

      setOpenMenuId(null);
    } catch (error: any) {
      console.error("Error deleting music:", error);
      alert(error?.response?.data?.message || "Failed to delete music. Please try again.");
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.size) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected music item(s)?`)) return;

    try {
      const ids = Array.from(selectedIds);
      for (const musicId of ids) {
        await axiosClient.delete(`${MUSIC_API_URL}/${musicId}`);
      }

      alert("Music deleted successfully!");

      // Adjust page if needed (compute new total and pages)
      const newTotal = Math.max(0, totalItems - ids.length);
      const newTotalPages = Math.max(1, Math.ceil(newTotal / pageSize));
      const pageToFetch = Math.min(currentPage, newTotalPages);
      setSelectedIds(new Set());
      setCurrentPage(pageToFetch);
      await fetchMusic(pageToFetch);
    } catch (error: any) {
      console.error("Error deleting music:", error);
      alert(error?.response?.data?.message || "Failed to delete music. Please try again.");
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  // Calculate total pages based on API response
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="text-gray-800 font-semibold">{totalItems} music</div>

        <div className="flex items-center justify-end gap-3 flex-1">
          {/* Search */}
          <div className="relative max-w-[400px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              type="text"
              placeholder="Search..."
              className="h-11 w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-600 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400"
            />
          </div>

          {/* Filter button */}
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-800">
            <svg className="stroke-current fill-white" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2.29 5.90393H17.7067" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17.7075 14.0961H2.29085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z" strokeWidth="1.5" />
              <path d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z" strokeWidth="1.5" />
            </svg>
            Filter
          </button>

          {/* Delete button */}
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${selectedIds.size === 0
              ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              : "border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-400 hover:text-red-700 active:bg-red-200 shadow-sm hover:shadow-md"
              }`}
          >
            Delete
          </button>

          {/* Add new button */}
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors whitespace-nowrap"
          >
            + New Music
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {loading && <div className="px-6 py-8 text-sm text-gray-500">Loading music…</div>}
        {!!error && !loading && <div className="px-6 py-8 text-sm text-red-600">Failed to load music: {error}</div>}

        {!loading && !error && (
          <>
            <div className="divide-y divide-gray-100">
              {music.length > 0 ? (
                music.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-6 py-4 relative">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onChange={(checked) => toggleSelect(item.id, checked)}
                        className="w-4 h-4 text-brand-600 rounded"
                      />

                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.thumbnailUrl ?? generatePlaceholderCover(item.title)}
                          width={56}
                          height={56}
                          alt={item.title}
                          className="object-cover w-[56px] h-[56px]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = generatePlaceholderCover(item.title);
                          }}
                        />
                      </div>

                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{item.title}</div>
                        <div className="text-gray-500 text-xs mt-1">
                          {item.artist ?? "Unknown Artist"} &nbsp;|&nbsp; {formatDuration(item.durationSeconds)} mins
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <audio id={`audio-${item.id}`} src={item.fileUrl} />

                      <button
                        onClick={() => handlePlayPause(item)}
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

                      <div className="relative" data-menu-container>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                          aria-label="more"
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </button>

                        {/* Context Menu */}
                        {openMenuId === item.id && (
                          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[140px]">
                            <button
                              onClick={() => handleEditMusic(item)}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 first:rounded-t-lg transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMusic(item.id)}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 last:rounded-b-lg transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
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
                  <PaginationWithTextWitIcon totalPages={totalPages} initialPage={currentPage} onPageChange={handlePageChange} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} className="!m-0 !p-0">
        <div className="fixed inset-0 z-50 flex">
          <div onClick={() => setIsAddOpen(false)} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <aside className="relative ml-auto w-full max-w-[560px] h-screen bg-white rounded-l-2xl shadow-xl flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-xl font-semibold text-gray-800 mb-1">Add new music</h3>
              <p className="text-sm text-gray-500 mb-6">Add your music details.</p>

              <div className="space-y-5">
                <label className="flex flex-col">
                  <span className="text-sm text-gray-600 mb-2">Music Title *</span>
                  <input
                    value={mediaForm.title}
                    onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Thumbnail (Optional)</label>
                  <DropzoneImage
                    onFileChange={(file: File | null) => {
                      setThumbnailFile(file);
                    }}
                  />
                </div>
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

              <button
                onClick={handleSaveMedia}
                disabled={saving || !mediaForm.title.trim() || !mediaFile}
                className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Uploading..." : "Upload Music"}
              </button>
            </div>
          </aside>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} className="!m-0 !p-0">
        <div className="fixed inset-0 z-50 flex">
          <div onClick={() => setIsEditOpen(false)} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <aside className="relative ml-auto w-full max-w-[560px] h-screen bg-white rounded-l-2xl shadow-xl flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-xl font-semibold text-gray-800 mb-1">Edit music</h3>
              <p className="text-sm text-gray-500 mb-6">Update your music details.</p>

              <div className="space-y-5">
                <label className="flex flex-col">
                  <span className="text-sm text-gray-600 mb-2">Title *</span>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter music title"
                  />
                </label>

                <label className="flex flex-col">
                  <span className="text-sm text-gray-600 mb-2">Artist</span>
                  <input
                    value={editForm.artist || ""}
                    onChange={(e) => setEditForm({ ...editForm, artist: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter artist name"
                  />
                </label>

                <label className="flex flex-col">
                  <span className="text-sm text-gray-600 mb-2">Album</span>
                  <input
                    value={editForm.album || ""}
                    onChange={(e) => setEditForm({ ...editForm, album: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter album name"
                  />
                </label>

                <label className="flex flex-col">
                  <span className="text-sm text-gray-600 mb-2">Genre</span>
                  <input
                    value={editForm.genre || ""}
                    onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter genre"
                  />
                </label>

                <label className="flex flex-col">
                  <span className="text-sm text-gray-600 mb-2">Release Year</span>
                  <input
                    type="number"
                    value={editForm.releaseYear || ""}
                    onChange={(e) => setEditForm({ ...editForm, releaseYear: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter release year"
                  />
                </label>

                <label className="flex flex-col">
                  <span className="text-sm text-gray-600 mb-2">Visibility</span>
                  <select
                    value={editForm.visibility || "private"}
                    onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </label>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Thumbnail (Optional)</label>
                  <DropzoneImage
                    preview={editThumbnailPreview}
                    onFileChange={(file: File | null) => {
                      setEditThumbnailFile(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditThumbnailPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      } else {
                        setEditThumbnailPreview(editingMusic?.thumbnailUrl || null);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  resetEditForm();
                  setIsEditOpen(false);
                }}
                className="px-4 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                Close
              </button>

              <button
                onClick={handleUpdateMusic}
                disabled={saving || !editForm.title.trim()}
                className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Updating..." : "Update Music"}
              </button>
            </div>
          </aside>
        </div>
      </Modal>
    </>
  );
}