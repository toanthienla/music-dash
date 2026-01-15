"use client";

import React, { useState, useEffect } from "react";
import PaginationWithTextWitIcon from "../ui/pagination/PaginationWithTextWitIcon";
import { API_URL } from "@/utils/constants";
import axiosClient from "@/utils/axiosClient";
import GroupDetailPanel from "./GroupDetailPanel";
import GroupCard from "./GroupCard";
import { Modal } from "../ui/modal";
import DropzoneImage from "../form/form-elements/DropzoneImage";

type Group = {
  id: string;
  userId: string;
  groupName: string;
  description: string;
  currentTrackId: string;
  positionMs: number;
  playbackStatus: string;
  volumeLevel: number;
  repeatMode: string;
  shuffle: boolean;
  isActive: boolean;
  deviceCount: number;
  coverArtUrl: string;
  coverArtKey: string;
  createdAt: string;
  updatedAt: string;
};

type CreateGroupForm = {
  group_name: string;
  description: string;
  volume_level: number;
  cover?: File | null;
};

type ApiGroupData = {
  id: string;
  user_id: string;
  group_name: string;
  description?: string;
  cover_art_key?: string;
  cover_art_url?: string;
  current_track_id?: string;
  current_track?: {
    id: string;
    title: string;
    artist: string;
    duration_ms: number;
  };
  position_ms: number;
  playback_status: string;
  volume_level: number;
  repeat_mode: string;
  shuffle: boolean;
  is_active: boolean;
  device_count: number;
  created_at: string;
  updated_at: string;
};

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
  success: boolean;
};

/**
 * CreateGroupModal Component
 */
interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingGroup?: Group | null;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  open,
  onClose,
  onSuccess,
  editingGroup,
}) => {
  const [formData, setFormData] = useState<CreateGroupForm>({
    group_name: "",
    description: "",
    volume_level: 50,
    cover: null,
  });

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (editingGroup) {
      setFormData({
        group_name: editingGroup.groupName,
        description: editingGroup.description,
        volume_level: editingGroup.volumeLevel,
        cover: null,
      });
      // Set preview to existing cover art URL
      setCoverPreview(editingGroup.coverArtUrl || null);
    } else {
      setFormData({
        group_name: "",
        description: "",
        volume_level: 50,
        cover: null,
      });
      setCoverPreview(null);
    }
    setError(null);
    setSuccess(false);
  }, [editingGroup, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "volume_level") {
      setFormData((prev) => ({
        ...prev,
        [name]: Math.max(0, Math.min(100, parseInt(value) || 0)),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.group_name.trim()) {
      setError("Group name is required");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let response;

      // Create FormData for multipart/form-data
      const formDataPayload = new FormData();
      formDataPayload.append("group_name", formData.group_name);
      formDataPayload.append("description", formData.description);
      formDataPayload.append("volume_level", String(formData.volume_level));

      if (formData.cover) {
        formDataPayload.append("cover", formData.cover);
      }

      if (editingGroup) {
        response = await axiosClient.put<ApiResponse<any>>(
          `${API_URL}/groups/${editingGroup.id}`,
          formDataPayload,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        response = await axiosClient.post<ApiResponse<any>>(
          `${API_URL}/groups`,
          formDataPayload,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to save group");
      }

      setSuccess(true);
      setFormData({
        group_name: "",
        description: "",
        volume_level: 50,
        cover: null,
      });
      setCoverPreview(null);

      setTimeout(() => {
        onClose();
        onSuccess();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to save group";
      setError(errorMessage);
      console.error("[Group] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const isEditing = !!editingGroup;
  const title = isEditing ? "Edit group" : "Create new group";
  const subtitle = isEditing
    ? "Update group information."
    : "Add a new group to manage your devices.";

  return (
    <Modal isOpen={open} onClose={onClose} className="!m-0 !p-0">
      <div className="fixed inset-0 z-50 flex">
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />

        <aside className="relative ml-auto w-full max-w-[560px] h-screen bg-white dark:bg-gray-900 rounded-l-2xl shadow-xl flex flex-col">
          <div className="p-6 overflow-y-auto flex-1">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {subtitle}
            </p>

            {success && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg text-sm flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {isEditing
                  ? "Group updated successfully!"
                  : "Group created successfully!"}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  name="group_name"
                  value={formData.group_name}
                  onChange={handleChange}
                  placeholder="e.g., Living Room"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white bg-white text-gray-900 transition-colors"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="e.g., Main living area speakers"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white bg-white text-gray-900 resize-none transition-colors"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Volume Level: {formData.volume_level}%
                </label>
                <input
                  type="range"
                  name="volume_level"
                  min="0"
                  max="100"
                  value={formData.volume_level}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cover Art
                </label>

                <DropzoneImage
                  onFileChange={(file) => {
                    setFormData((prev) => ({
                      ...prev,
                      cover: file,
                    }));

                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCoverPreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      // When file is removed, restore original preview
                      setCoverPreview(editingGroup?.coverArtUrl || null);
                    }
                  }}
                  preview={coverPreview}
                />
              </div>
            </form>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end gap-3">
            <button
              onClick={() => {
                setFormData({
                  group_name: "",
                  description: "",
                  volume_level: 50,
                  cover: null,
                });
                setCoverPreview(null);
                onClose();
              }}
              className="px-4 py-2 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {loading ? "Saving..." : isEditing ? "Update Group" : "Create Group"}
            </button>
          </div>
        </aside>
      </div>
    </Modal>
  );
};

/**
 * GroupTab Component
 */
export default function GroupTab() {
  const [groupsData, setGroupsData] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredGroups = groupsData.filter((g) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      g.groupName.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q)
    );
  });

  // Sort by created_at (newest first)
  const sortedGroups = [...filteredGroups].sort((a, b) => {
    try {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Newest first
    } catch {
      return 0;
    }
  });

  const totalItems = sortedGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentData = sortedGroups.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  /**
   * Maps API response data to Group type
   */
  const mapApiGroupsToTableGroups = (apiGroups: ApiGroupData[]): Group[] => {
    return apiGroups.map((groupData: ApiGroupData) => {
      return {
        id: groupData.id,
        userId: groupData.user_id,
        groupName: groupData.group_name || "Unknown Group",
        description: groupData.description || "N/A",
        currentTrackId: groupData.current_track_id || "N/A",
        positionMs: groupData.position_ms || 0,
        playbackStatus: groupData.playback_status || "stopped",
        volumeLevel: typeof groupData.volume_level === "number"
          ? Math.min(100, Math.max(0, groupData.volume_level))
          : 0,
        repeatMode: groupData.repeat_mode || "none",
        shuffle: Boolean(groupData.shuffle),
        isActive: Boolean(groupData.is_active),
        deviceCount: groupData.device_count || 0,
        coverArtUrl: groupData.cover_art_url || "",
        coverArtKey: groupData.cover_art_key || "",
        createdAt: groupData.created_at || "N/A",
        updatedAt: groupData.updated_at || "N/A",
      };
    });
  };

  /**
   * Fetch groups from API
   */
  const fetchGroups = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const endpoint = `${API_URL}/groups`;
      console.log(`[Groups] Fetching from: ${endpoint}`);

      const res = await axiosClient.get<ApiResponse<ApiGroupData[]>>(endpoint);

      console.log("[Groups] API Response:", res.data);

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to fetch groups");
      }

      const rawGroups = res.data?.data || [];

      if (!Array.isArray(rawGroups)) {
        throw new Error("Invalid API response format: data is not an array");
      }

      const mappedGroups = mapApiGroupsToTableGroups(rawGroups);
      setGroupsData(mappedGroups);
      console.log("[Groups] Mapped groups:", mappedGroups);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch groups";

      console.error("[Groups] Error:", errorMessage);
      setGroupsData([]);
      setFetchError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  /**
   * Handle view detail
   */
  const handleViewDetail = (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsDetailOpen(true);
  };

  /**
   * Handle edit group
   */
  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setIsCreateOpen(true);
  };

  /**
   * Handle delete group
   */
  const handleDeleteGroup = async (groupId: string) => {
    try {
      const response = await axiosClient.delete<ApiResponse<any>>(
        `${API_URL}/groups/${groupId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete group");
      }

      setGroupsData((prev) => prev.filter((g) => g.id !== groupId));
      fetchGroups();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete group";
      console.error("[Delete Group] Error:", err);
      alert(errorMessage);
    }
  };

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
        <div className="text-gray-800 dark:text-white font-semibold">
          {totalItems} groups
        </div>

        <div className="flex items-center justify-end gap-3 flex-1">
          {/* Search */}
          <div className="relative max-w-[400px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M21 21l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="11"
                cy="11"
                r="6"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              type="text"
              placeholder="Search groups..."
              className="h-11 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 py-2.5 pl-11 pr-4 text-sm text-gray-600 dark:text-gray-300 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/30 focus:border-brand-400"
            />
          </div>

          {/* Filter button */}
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            <svg
              className="stroke-current fill-white dark:fill-gray-800"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M2.29 5.90393H17.7067"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.7075 14.0961H2.29085"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                strokeWidth="1.5"
              />
              <path
                d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                strokeWidth="1.5"
              />
            </svg>
            Filter
          </button>

          {/* Add new button */}
          <button
            onClick={() => {
              setEditingGroup(null);
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors whitespace-nowrap shadow-sm hover:shadow-md"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            New Group
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400">
          Loading groups…
        </div>
      )}
      {!!fetchError && !loading && (
        <div className="px-6 py-8 text-sm text-red-600 dark:text-red-400">
          Failed to load groups: {fetchError}
        </div>
      )}

      {!loading && !fetchError && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentData.length > 0 ? (
              currentData.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onViewDetail={handleViewDetail}
                  onEdit={handleEditGroup}
                  onOpenMenu={setOpenMenuId}
                  openMenuId={openMenuId}
                  onDelete={handleDeleteGroup}
                />
              ))
            ) : (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
                No groups found.
              </div>
            )}
          </div>

          {totalItems > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {totalItems === 0
                  ? `Showing 0 to 0 of 0 groups`
                  : `Showing ${startIndex + 1} to ${endIndex} of ${totalItems} groups`}
              </div>
              <div className="flex-1 flex justify-center">
                <PaginationWithTextWitIcon
                  totalPages={totalPages}
                  initialPage={currentPage}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE/EDIT GROUP MODAL */}
      <CreateGroupModal
        open={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingGroup(null);
        }}
        onSuccess={() => {
          setCurrentPage(1);
          setEditingGroup(null);
          fetchGroups();
        }}
        editingGroup={editingGroup}
      />

      {/* GROUP DETAIL PANEL */}
      <GroupDetailPanel
        open={isDetailOpen}
        groupId={selectedGroupId}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedGroupId(null);
        }}
        onDeviceAdded={() => {
          fetchGroups();
        }}
      />
    </>
  );
}