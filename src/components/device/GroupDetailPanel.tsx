"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/utils/constants";
import axiosClient from "@/utils/axiosClient";
import GroupDeviceManager from "./GroupDeviceManager";

type CurrentTrack = {
  id: string;
  title: string;
  artist: string;
  durationMs: number;
};

type GroupDetail = {
  id: string;
  userId: string;
  groupName: string;
  description: string;
  coverArtUrl?: string;
  currentTrackId: string;
  currentTrack?: CurrentTrack;
  positionMs: number;
  playbackStatus: string;
  volumeLevel: number;
  repeatMode: string;
  shuffle: boolean;
  isActive: boolean;
  deviceCount: number;
  createdAt: string;
  updatedAt: string;
};

type ApiGroupData = {
  id: string;
  user_id: string;
  group_name: string;
  description: string;
  cover_art_url?: string;
  current_track_id: string;
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

const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (error) {
    return "N/A";
  }
};

const formatDuration = (ms: number): string => {
  if (!ms || ms < 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

interface GroupDetailPanelProps {
  open: boolean;
  groupId: string | null;
  onClose: () => void;
  onDeviceAdded?: () => void;
}

export const GroupDetailPanel: React.FC<GroupDetailPanelProps> = ({
  open,
  groupId,
  onClose,
  onDeviceAdded,
}) => {
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "devices">("details");

  // Fetch group detail when panel opens or groupId changes
  useEffect(() => {
    if (open && groupId) {
      fetchGroupDetail();
    }
  }, [open, groupId]);

  const fetchGroupDetail = async () => {
    if (!groupId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axiosClient.get<ApiResponse<ApiGroupData>>(
        `${API_URL}/api/v1/groups/${groupId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch group details");
      }

      const data = response.data.data;

      const groupDetail: GroupDetail = {
        id: data.id,
        userId: data.user_id,
        groupName: data.group_name || "Unknown Group",
        description: data.description || "N/A",
        coverArtUrl: data.cover_art_url,
        currentTrackId: data.current_track_id || "N/A",
        currentTrack: data.current_track ? {
          id: data.current_track.id,
          title: data.current_track.title || "Unknown Track",
          artist: data.current_track.artist || "Unknown Artist",
          durationMs: data.current_track.duration_ms || 0,
        } : undefined,
        positionMs: data.position_ms || 0,
        playbackStatus: data.playback_status || "stopped",
        volumeLevel: typeof data.volume_level === "number"
          ? Math.min(100, Math.max(0, data.volume_level))
          : 0,
        repeatMode: data.repeat_mode || "none",
        shuffle: Boolean(data.shuffle),
        isActive: Boolean(data.is_active),
        deviceCount: data.device_count || 0,
        createdAt: data.created_at || "N/A",
        updatedAt: data.updated_at || "N/A",
      };

      setGroupDetail(groupDetail);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch group details";
      setError(errorMessage);
      console.error("[Group Detail] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tab: "details" | "devices") => {
    setActiveTab(tab);
    // Fetch fresh data when clicking on details tab
    if (tab === "details") {
      fetchGroupDetail();
    }
  };

  const handleClose = () => {
    setActiveTab("details");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999]">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
        onClick={handleClose}
      />

      <aside className="fixed right-0 top-0 h-full w-full max-w-[860px] bg-white dark:bg-gray-900 p-6 overflow-y-auto rounded-l-2xl shadow-xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Group Details
          </h3>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Close"
          >
            <svg
              width="20"
              height="20"
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
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          View group information and manage devices.
        </p>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleTabClick("details")}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === "details"
              ? "border-b-2 border-brand-600 text-brand-600 dark:text-brand-400 -mb-px"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
          >
            Details
          </button>
          <button
            onClick={() => handleTabClick("devices")}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === "devices"
              ? "border-b-2 border-brand-600 text-brand-600 dark:text-brand-400 -mb-px"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
          >
            Devices ({groupDetail?.deviceCount || 0})
          </button>
        </div>

        {loading && (
          <div className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400">
            Loading group details…
          </div>
        )}

        {error && !loading && (
          <div className="px-6 py-8 text-sm text-brand-600 dark:text-brand-400">
            Failed to load group details: {error}
          </div>
        )}

        {!loading && !error && groupDetail && (
          <>
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-6">
                {/* Group Cover Art */}
                {groupDetail.coverArtUrl && (
                  <div className="relative">
                    <img
                      src={groupDetail.coverArtUrl}
                      alt={groupDetail.groupName}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-md"
                      onError={(e) => {
                        console.error("Cover image failed to load");
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Group Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Group Name
                    </label>
                    <p className="text-sm text-gray-800 dark:text-white font-medium">
                      {groupDetail.groupName}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Description
                    </label>
                    <p className="text-sm text-gray-800 dark:text-white">
                      {groupDetail.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Status
                      </label>
                      <p className="text-sm text-gray-800 dark:text-white">
                        {groupDetail.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Playback Status
                      </label>
                      <p className="text-sm text-gray-800 dark:text-white">
                        {groupDetail.playbackStatus || "stopped"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Volume Level
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(0, groupDetail.volumeLevel))}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 w-8">
                          {groupDetail.volumeLevel}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Device Count
                      </label>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white mt-1">
                        {groupDetail.deviceCount}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Repeat Mode
                      </label>
                      <p className="text-sm text-gray-800 dark:text-white">
                        {groupDetail.repeatMode || "none"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Shuffle
                      </label>
                      <p className="text-sm text-gray-800 dark:text-white">
                        {groupDetail.shuffle ? "On" : "Off"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Created At
                      </label>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                        {formatDateTime(groupDetail.createdAt)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Updated At
                      </label>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                        {formatDateTime(groupDetail.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Track Information - Only show if track exists */}
                {groupDetail.currentTrack ? (
                  <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="font-semibold text-gray-800 dark:text-white">
                      Now Playing
                    </h4>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Track Title
                      </label>
                      <p className="text-sm text-gray-800 dark:text-white font-medium">
                        {groupDetail.currentTrack.title}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Artist
                      </label>
                      <p className="text-sm text-gray-800 dark:text-white">
                        {groupDetail.currentTrack.artist}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Current Position
                        </label>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">
                          {formatDuration(groupDetail.positionMs)}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Duration
                        </label>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">
                          {formatDuration(groupDetail.currentTrack.durationMs)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all"
                          style={{
                            width: `${(groupDetail.positionMs / groupDetail.currentTrack.durationMs) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No track is currently playing.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Devices Tab */}
            {activeTab === "devices" && (
              <GroupDeviceManager
                groupId={groupDetail.id}
                groupName={groupDetail.groupName}
                onDeviceAdded={onDeviceAdded}
              />
            )}
          </>
        )}

        {/* Close Button */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
};

export default GroupDetailPanel;