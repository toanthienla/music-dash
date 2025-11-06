"use client";

import React, { useRef, useEffect } from "react";

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

const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "N/A";
  }
};

interface GroupCardProps {
  group: Group;
  onViewDetail: (groupId: string) => void;
  onEdit: (group: Group) => void;
  onOpenMenu: (groupId: string | null) => void;
  openMenuId: string | null;
  onDelete: (groupId: string) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onViewDetail,
  onEdit,
  onOpenMenu,
  openMenuId,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onOpenMenu(null);
      }
    };

    if (openMenuId === group.id) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openMenuId, group.id, onOpenMenu]);

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this group?")) {
      onDelete(group.id);
    }
  };

  // Use coverArtUrl directly
  const imageUrl = group.coverArtUrl || null;

  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800 dark:border-gray-700 flex flex-col h-full">
      {/* Cover Art Section */}
      <div className="relative w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={group.groupName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        {!imageUrl && (
          <svg
            className="w-16 h-16 text-gray-400 dark:text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
          </svg>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Header with Title and Menu */}
        <div className="flex items-start justify-between mb-3 relative">
          <div className="flex-1 pr-8">
            <h4 className="font-semibold text-sm text-gray-800 dark:text-white mb-1 line-clamp-1">
              {group.groupName}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
              {group.description}
            </p>
          </div>

          {/* Three-dot menu - positioned absolutely in top-right */}
          <div className="absolute top-0 right-0 relative" ref={menuRef}>
            <button
              onClick={() => onOpenMenu(openMenuId === group.id ? null : group.id)}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="More options"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {openMenuId === group.id && (
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[140px]">
                <button
                  onClick={() => {
                    onEdit(group);
                    onOpenMenu(null);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 first:rounded-t-lg transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => {
                    handleDelete();
                    onOpenMenu(null);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 last:rounded-b-lg transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-sm">
              Status
            </span>
            <p className="text-gray-800 dark:text-gray-200 font-medium text-sm mt-0.5">
              {group.isActive ? "Active" : "Inactive"}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-sm">
              Playback
            </span>
            <p className="text-gray-800 dark:text-gray-200 font-medium text-sm mt-0.5">
              {group.playbackStatus || "Stopped"}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-sm">
              Devices
            </span>
            <p className="text-gray-800 dark:text-gray-200 font-medium text-sm mt-0.5">
              {group.deviceCount}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-sm">
              Created
            </span>
            <p className="text-gray-800 dark:text-gray-200 font-medium text-sm mt-0.5">
              {formatDateTime(group.createdAt)}
            </p>
          </div>
        </div>

        {/* Volume Bar */}
        <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Volume
            </span>
            <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
              {group.volumeLevel}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600"
              style={{
                width: `${Math.min(100, Math.max(0, group.volumeLevel))}%`,
              }}
            />
          </div>
        </div>

        {/* Playback Settings */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-sm">
              Repeat
            </span>
            <p className="text-gray-800 dark:text-gray-200 font-medium text-sm mt-0.5">
              {group.repeatMode || "None"}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-sm">
              Shuffle
            </span>
            <p className="text-gray-800 dark:text-gray-200 font-medium text-sm mt-0.5">
              {group.shuffle ? "On" : "Off"}
            </p>
          </div>
        </div>

        {/* View Detail Button */}
        <button
          onClick={() => onViewDetail(group.id)}
          className="w-full px-4 py-2.5 rounded-lg border border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/40 text-sm font-medium transition-colors duration-200"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default GroupCard;