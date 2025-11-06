"use client";

import React from "react";
import Link from "next/link";
import axiosClient from "@/utils/axiosClient";
import { API_URL } from "@/utils/constants";
import { Modal } from "../ui/modal";
import Checkbox from "../form/input/Checkbox";
import PaginationWithTextWitIcon from "../ui/pagination/PaginationWithTextWitIcon";
import DropzoneImage from "@/components/form/form-elements/DropzoneImage";

type Playlist = {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string | null;
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  totalDurationSeconds: number;
  trackCount: number;
};

type PlaylistFormData = {
  name: string;
  description: string;
  isPublic: boolean;
};

type EditingPlaylist = Playlist & {
  newCoverFile?: File | null;
  removeCover?: boolean;
};

const PLAYLISTS_API_URL = `${API_URL}/api/v1/playlists`;

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

export default function PlaylistTab() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize] = React.useState(9);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const [playlistForm, setPlaylistForm] = React.useState<PlaylistFormData>({
    name: "",
    description: "",
    isPublic: false,
  });
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);

  const [editingPlaylist, setEditingPlaylist] = React.useState<EditingPlaylist | null>(null);
  const [editForm, setEditForm] = React.useState<PlaylistFormData>({
    name: "",
    description: "",
    isPublic: false,
  });
  const [editCoverFile, setEditCoverFile] = React.useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = React.useState<string | null>(null);
  const [removeCover, setRemoveCover] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Close menu when clicking outside
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

  // Fetch playlists
  React.useEffect(() => {
    let canceled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosClient.get(PLAYLISTS_API_URL);
        const raw = response.data;

        if (!raw?.success || !raw?.data?.data || !Array.isArray(raw.data.data)) {
          throw new Error("Invalid playlists payload (expected array)");
        }

        const formatted: Playlist[] = raw.data.data.map((item: any) => ({
          id: item.id,
          name: item.name ?? "Untitled",
          description: item.description ?? "",
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
          setError(err?.message ?? "Failed to fetch playlists");
          setPlaylists([]);
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  const resetForm = () => {
    setPlaylistForm({ name: "", description: "", isPublic: false });
    setCoverFile(null);
    setCoverPreview(null);
  };

  const resetEditForm = () => {
    setEditingPlaylist(null);
    setEditForm({ name: "", description: "", isPublic: false });
    setEditCoverFile(null);
    setEditCoverPreview(null);
    setRemoveCover(false);
  };

  const handleSavePlaylist = async () => {
    try {
      setSaving(true);

      if (!playlistForm.name.trim()) {
        alert("Please enter a playlist name");
        return;
      }

      const formData = new FormData();
      formData.append("name", playlistForm.name);
      formData.append("description", playlistForm.description);
      formData.append("isPublic", String(playlistForm.isPublic));

      if (coverFile) {
        formData.append("coverFile", coverFile);
      }

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
            description: item.description ?? "",
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
      setSaving(false);
    }
  };

  const handleEditPlaylist = (item: Playlist) => {
    setEditingPlaylist(item);
    setEditForm({
      name: item.name,
      description: item.description ?? "",
      isPublic: item.isPublic,
    });
    setEditCoverPreview(item.coverUrl || null);
    setEditCoverFile(null);
    setRemoveCover(false);
    setOpenMenuId(null);
    setIsEditOpen(true);
  };

  const handleUpdatePlaylist = async () => {
    try {
      setSaving(true);

      if (!editingPlaylist) return;

      if (!editForm.name.trim()) {
        alert("Please enter a playlist name");
        return;
      }

      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("description", editForm.description);
      formData.append("isPublic", String(editForm.isPublic));

      if (editCoverFile) {
        formData.append("coverFile", editCoverFile);
      }

      // Set removeCover = true only if user removed the image from dropzone
      if (removeCover) {
        formData.append("removeCover", String(true));
      }

      const response = await axiosClient.put(
        `${PLAYLISTS_API_URL}/${editingPlaylist.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data?.success) {
        const refreshed = await axiosClient.get(PLAYLISTS_API_URL);
        const raw = refreshed.data;
        if (raw?.success && Array.isArray(raw.data?.data)) {
          const formatted: Playlist[] = raw.data.data.map((item: any) => ({
            id: item.id,
            name: item.name ?? "Untitled",
            description: item.description ?? "",
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

        setIsEditOpen(false);
        resetEditForm();
        alert("Playlist updated successfully!");
      }
    } catch (error: any) {
      console.error("Error updating playlist:", error);
      alert(error?.response?.data?.message || "Failed to update playlist. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;

    try {
      await axiosClient.delete(`${PLAYLISTS_API_URL}/${playlistId}`);
      const newPlaylists = playlists.filter((p) => p.id !== playlistId);
      setPlaylists(newPlaylists);
      setOpenMenuId(null);
      alert("Playlist deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting playlist:", error);
      alert(error?.response?.data?.message || "Failed to delete playlist. Please try again.");
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.size) return;
    try {
      for (const playlistId of Array.from(selectedIds)) {
        await axiosClient.delete(`${PLAYLISTS_API_URL}/${playlistId}`);
      }

      const newPlaylists = playlists.filter((p) => !selectedIds.has(p.id));
      setPlaylists(newPlaylists);
      setSelectedIds(new Set());

      const filteredLength = newPlaylists.filter((p) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return p.name.toLowerCase().includes(q);
      }).length;
      const newTotalPages = Math.max(1, Math.ceil(filteredLength / pageSize));
      if (currentPage > newTotalPages) setCurrentPage(newTotalPages);

      alert("Playlist deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting playlists:", error);
      alert(error?.response?.data?.message || "Failed to delete playlist. Please try again.");
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  // Filtering & pagination
  const filteredPlaylists = playlists.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(q);
  });
  const totalItems = filteredPlaylists.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);
  const paginatedPlaylists = filteredPlaylists.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
        <div className="text-gray-800 font-semibold">{totalItems} playlists</div>

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
              placeholder="Search playlists..."
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
            + New Playlist
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && <div className="px-6 py-8 text-sm text-gray-500">Loading playlists…</div>}
      {!!error && !loading && <div className="px-6 py-8 text-sm text-red-600">Failed to load playlists: {error}</div>}

      {!loading && !error && (
        <div className="flex flex-col min-h-[600px]">
          {paginatedPlaylists.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 flex-1">
                {paginatedPlaylists.map((item) => (
                  <div key={item.id} className="relative group">
                    {/* Checkbox */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onChange={(checked) => toggleSelect(item.id, checked)}
                        className="w-4 h-4 text-brand-600 rounded bg-white"
                      />
                    </div>

                    {/* Link - wraps card content */}
                    <Link href={`/media/playlist/${item.id}`}>
                      <div className="p-4">
                        <div className="w-36 h-36 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={item.coverUrl || generatePlaceholderCover(item.name)}
                            width={144}
                            height={144}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = generatePlaceholderCover(item.name);
                            }}
                          />
                        </div>

                        {/* Info row with three dots on same line */}
                        <div className="flex items-start justify-between mt-4 gap-2">
                          {/* Left side: Playlist info */}
                          <div className="text-left flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 text-sm mb-1 truncate">{item.name}</h4>
                            <p className="text-xs text-gray-500 line-clamp-1">{item.description || "No description"}</p>
                            <p className="text-xs text-gray-400 mt-2">{item.trackCount} songs</p>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 mt-4" />
                      </div>
                    </Link>

                    {/* Right side: Menu button - OUTSIDE Link, on same row */}
                    <div className="absolute bottom-20 right-4 z-20" data-menu-container>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === item.id ? null : item.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        title="More options"
                      >
                        {/* Vertical three dots icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>

                      {/* Context Menu */}
                      {openMenuId === item.id && (
                        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[140px]">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditPlaylist(item);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 first:rounded-t-lg transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeletePlaylist(item.id);
                            }}
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
                ))}
              </div>

              {/* Pagination - ALWAYS SHOWN */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center">
                <PaginationWithTextWitIcon
                  totalPages={totalPages}
                  initialPage={currentPage}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 text-center">
              <div className="py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <p className="text-base font-medium">No playlists found</p>
                <p className="text-sm text-gray-400 mt-1">Create your first playlist to get started</p>
              </div>

              {/* Pagination - ALWAYS SHOWN even when empty */}
              <div className="absolute bottom-0 left-0 right-0 pt-6 pb-8 border-t border-gray-200 flex justify-center bg-white">
                <PaginationWithTextWitIcon
                  totalPages={totalPages}
                  initialPage={currentPage}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} className="!m-0 !p-0">
        <div className="fixed inset-0 z-50 flex">
          <div onClick={() => setIsAddOpen(false)} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <aside className="relative ml-auto w-full max-w-[560px] h-screen bg-white rounded-l-2xl shadow-xl flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-xl font-semibold text-gray-800 mb-1">Create new playlist</h3>
              <p className="text-sm text-gray-500 mb-6">Set up your playlist details.</p>

              <div className="space-y-5">
                <label className="flex flex-col">
                  <span className="text-sm text-gray-600 mb-2">Playlist Name *</span>
                  <input
                    value={playlistForm.name}
                    onChange={(e) => setPlaylistForm({ ...playlistForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter playlist name"
                  />
                </label>

                <label className="flex flex-col">
                  <span className="text-sm text-gray-600 mb-2">Description</span>
                  <textarea
                    value={playlistForm.description}
                    onChange={(e) => setPlaylistForm({ ...playlistForm, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    placeholder="Enter playlist description"
                    rows={3}
                  />
                </label>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Cover Image (Optional)</label>
                  <DropzoneImage
                    preview={coverPreview}
                    onFileChange={(file: File | null) => {
                      setCoverFile(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCoverPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      } else {
                        // User removed image from dropzone
                        setCoverPreview(null);
                      }
                    }}
                  />
                </div>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={playlistForm.isPublic}
                    onChange={(e) => setPlaylistForm({ ...playlistForm, isPublic: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Make this playlist public</p>
                    <p className="text-xs text-gray-500">Allow others to discover and view this playlist</p>
                  </div>
                </label>
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
                onClick={handleSavePlaylist}
                disabled={saving || !playlistForm.name.trim()}
                className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Creating..." : "Create Playlist"}
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
              <h3 className="text-xl font-semibold text-gray-800 mb-1">Edit playlist</h3>
              <p className="text-sm text-gray-500 mb-6">Update your playlist details.</p>

              <div className="space-y-5">
                <label className="flex flex-col">
                  <span className="text-sm text-gray-600 mb-2">Playlist Name *</span>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter playlist name"
                  />
                </label>

                <label className="flex flex-col">
                  <span className="text-sm text-gray-600 mb-2">Description</span>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    placeholder="Enter playlist description"
                    rows={3}
                  />
                </label>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Cover Image (Optional)</label>
                  <DropzoneImage
                    preview={editCoverPreview}
                    onFileChange={(file: File | null) => {
                      if (file) {
                        // User added a new image
                        setEditCoverFile(file);
                        setRemoveCover(false);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditCoverPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      } else {
                        // User removed image from dropzone
                        // Set removeCover = true when dropzone is cleared
                        setEditCoverFile(null);
                        setEditCoverPreview(null);
                        setRemoveCover(true);
                      }
                    }}
                  />
                </div>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={editForm.isPublic}
                    onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Make this playlist public</p>
                    <p className="text-xs text-gray-500">Allow others to discover and view this playlist</p>
                  </div>
                </label>
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
                onClick={handleUpdatePlaylist}
                disabled={saving || !editForm.name.trim()}
                className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Updating..." : "Update Playlist"}
              </button>
            </div>
          </aside>
        </div>
      </Modal>
    </>
  );
}