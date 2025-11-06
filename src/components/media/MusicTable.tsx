"use client";

import React from "react";
import Checkbox from "../form/input/Checkbox";

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

type MusicTableProps = {
  paginatedMusic: Music[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string, checked: boolean) => void;
  onToggleAllSelect: (checked: boolean) => void;
  isPlaying: boolean;
  currentPlayingId: string | null;
  openMenuId: string | null;
  onPlayPause: (item: Music) => void;
  onMenuClick: (id: string) => void;
  onEdit: (item: Music) => void;
  onDelete: (id: string) => void;
  formatDuration: (seconds: number) => string;
  generatePlaceholderCover: (text?: string, size?: number) => string;
};

export const MusicTable: React.FC<MusicTableProps> = ({
  paginatedMusic,
  selectedIds,
  onToggleSelect,
  onToggleAllSelect,
  isPlaying,
  currentPlayingId,
  openMenuId,
  onPlayPause,
  onMenuClick,
  onEdit,
  onDelete,
  formatDuration,
  generatePlaceholderCover,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="px-6 py-4 text-left">
              <Checkbox
                checked={selectedIds.size === paginatedMusic.length && paginatedMusic.length > 0}
                onChange={(checked) => onToggleAllSelect(checked)}
                className="w-4 h-4 text-brand-600 rounded"
              />
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Artist
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Album
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Genre
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Year
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Duration
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Visibility
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {paginatedMusic.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td className="px-6 py-4">
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onChange={(checked) => onToggleSelect(item.id, checked)}
                  className="w-4 h-4 text-brand-600 rounded"
                />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src={item.thumbnailUrl ?? generatePlaceholderCover(item.title)}
                    alt={item.title}
                    className="w-10 h-10 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = generatePlaceholderCover(item.title);
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                {item.artist || "—"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                {item.album || "—"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                {item.genre || "—"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                {item.releaseYear || "—"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                {formatDuration(item.durationSeconds)}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.visibility === "public"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                >
                  {item.visibility === "public" ? "Public" : "Private"}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <audio id={`audio-${item.id}`} src={item.fileUrl} />

                  <button
                    onClick={() => onPlayPause(item)}
                    className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors"
                    title="Play"
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
                      onClick={() => onMenuClick(openMenuId === item.id ? null : item.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                      title="More options"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>

                    {/* Context Menu */}
                    {openMenuId === item.id && (
                      <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[140px]">
                        <button
                          onClick={() => onEdit(item)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 first:rounded-t-lg transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MusicTable;