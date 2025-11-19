"use client";

import React, { useState } from "react";
import { Trash2, ChevronDown, Music, Shuffle } from "lucide-react";
import axiosClient from "@/utils/axiosClient";
import { API_URL } from "@/utils/constants";

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  durationSeconds: number;
  cover: string;
  contextId: string;
  contextType: "track" | "playlist" | "album";
  isPlaylistTrack: boolean;
}

interface QueueItem {
  contextId: string;
  type: "track" | "playlist" | "album";
  title: string;
  artist?: string;
  trackCount: number;
  totalDurationMs: number;
  thumbnail?: string;
  tracks: Song[];
  shuffle_enabled?: boolean;
}

interface QueueListProps {
  queueItems: QueueItem[];
  allSongs: Song[];
  currentSongIndex: number;
  isRemovingContextAtPosition: number | null;
  showClearConfirm: boolean;
  isClearing: boolean;
  queueHeight: number;
  groupId: string;
  onSongClick: (song: Song, index: number) => void;
  onRemoveContext: (position: number) => void;
  onClearQueueClick: () => void;
  onClearConfirmClose: () => void;
  onClearQueueConfirm: () => void;
  generatePlaceholderCover: (text?: string, size?: number) => string;
}

const QueueList: React.FC<QueueListProps> = ({
  queueItems,
  allSongs,
  currentSongIndex,
  isRemovingContextAtPosition,
  showClearConfirm,
  isClearing,
  queueHeight,
  groupId,
  onSongClick,
  onRemoveContext,
  onClearQueueClick,
  onClearConfirmClose,
  onClearQueueConfirm,
  generatePlaceholderCover,
}) => {
  const [expandedContextId, setExpandedContextId] = useState<string | null>(null);
  const [shufflingContextId, setShufflingContextId] = useState<string | null>(null);
  const [contextShuffleStates, setContextShuffleStates] = useState<Record<string, boolean>>({});

  const currentSong = allSongs[currentSongIndex];

  const handleContextShuffle = async (contextId: string, isCurrentlyShuffle: boolean) => {
    try {
      setShufflingContextId(contextId);

      const endpoint = isCurrentlyShuffle
        ? `${API_URL}/api/v1/groups/${groupId}/queue/context/${contextId}/unshuffle`
        : `${API_URL}/api/v1/groups/${groupId}/queue/context/${contextId}/shuffle`;

      const response = await axiosClient.post(endpoint);

      if (response.data?.success) {
        setContextShuffleStates((prev) => ({
          ...prev,
          [contextId]: !isCurrentlyShuffle,
        }));
      }
    } catch (err: any) {
      console.error("Error toggling context shuffle:", err);
    } finally {
      setShufflingContextId(null);
    }
  };

  return (
    <>
      {/* --- Clear Queue Confirmation Dialog --- */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center">
          <div
            onClick={onClearConfirmClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <div className="relative bg-white rounded-lg shadow-lg p-5 max-w-sm mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Clear Queue?</h3>
            <p className="text-sm text-gray-600 mb-5">
              All songs will be removed from the queue.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={onClearConfirmClose}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onClearQueueConfirm}
                disabled={isClearing}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-400 transition-colors"
              >
                {isClearing ? "Clearing..." : "Clear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Queue List --- */}
      <div className="mt-6 w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Up Next ({allSongs.length})
          </h3>
          {allSongs.length > 0 && (
            <button
              onClick={onClearQueueClick}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Queue Items */}
        <div
          className="space-y-1 overflow-y-auto"
          style={{ height: `${queueHeight}px` }}
        >
          {queueItems.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-center h-full">
              <div>
                <Music size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Queue is empty</p>
              </div>
            </div>
          ) : (
            queueItems.map((item, itemIndex) => {
              const isCurrentContext = item.tracks.some(
                (t) => allSongs.indexOf(t) === currentSongIndex
              );
              const isExpanded = expandedContextId === item.contextId;
              const isShuffled = contextShuffleStates[item.contextId] ?? item.shuffle_enabled ?? false;

              return (
                <div key={item.contextId}>
                  {/* Individual Track Item */}
                  {item.type === "track" && (
                    <div
                      onClick={() => {
                        const trackIndex = allSongs.indexOf(item.tracks[0]);
                        onSongClick(item.tracks[0], trackIndex);
                      }}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all cursor-pointer group ${isCurrentContext
                        ? "bg-orange-50 border border-orange-200"
                        : "hover:bg-gray-50 border border-transparent"
                        }`}
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-200 shadow-sm">
                          <img
                            src={item.thumbnail || generatePlaceholderCover(item.title)}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                generatePlaceholderCover(item.title);
                            }}
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {item.artist}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveContext(itemIndex);
                        }}
                        disabled={isRemovingContextAtPosition === itemIndex}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                      >
                        {isRemovingContextAtPosition === itemIndex ? (
                          <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Playlist/Album Header */}
                  {(item.type === "playlist" || item.type === "album") && (
                    <>
                      <div
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all group ${isCurrentContext
                          ? "bg-orange-50 border border-orange-200"
                          : "hover:bg-gray-50 border border-transparent"
                          }`}
                      >
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-200 shadow-sm">
                            <img
                              src={item.thumbnail || generatePlaceholderCover(item.title)}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  generatePlaceholderCover(item.title);
                              }}
                            />
                          </div>
                        </div>

                        {/* Content - Make it expandable */}
                        <div
                          onClick={() => {
                            setExpandedContextId(isExpanded ? null : item.contextId);
                          }}
                          className="min-w-0 flex-1 cursor-pointer"
                        >
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {`${item.type === "playlist" ? "Playlist" : "Album"} • ${item.trackCount} songs`}
                          </p>
                        </div>

                        {/* Shuffle Button for Playlists */}
                        {item.type === "playlist" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContextShuffle(item.contextId, isShuffled);
                            }}
                            disabled={shufflingContextId === item.contextId}
                            className={`p-1.5 rounded transition-all flex-shrink-0 ${isShuffled
                              ? "text-[#FF9100] bg-orange-50 hover:bg-orange-100"
                              : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                              } ${shufflingContextId === item.contextId ? "opacity-50" : ""
                              }`}
                            title={isShuffled ? "Unshuffle playlist" : "Shuffle playlist"}
                          >
                            {shufflingContextId === item.contextId ? (
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Shuffle size={16} />
                            )}
                          </button>
                        )}

                        {/* Chevron for expanding */}
                        <button
                          onClick={() => {
                            setExpandedContextId(isExpanded ? null : item.contextId);
                          }}
                          className="p-1 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${isExpanded ? "rotate-180" : ""
                              }`}
                          />
                        </button>

                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveContext(itemIndex);
                          }}
                          disabled={isRemovingContextAtPosition === itemIndex}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                        >
                          {isRemovingContextAtPosition === itemIndex ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>

                      {/* Playlist/Album Tracks (Expanded) */}
                      {isExpanded && (
                        <div className="bg-white rounded-lg ml-3 mt-1 overflow-hidden border border-gray-200 shadow-sm">
                          {item.tracks.map((track, trackIndex) => {
                            const allSongsIndex = allSongs.indexOf(track);
                            const isCurrentTrack = allSongsIndex === currentSongIndex;

                            return (
                              <div
                                key={`${track.id}-${trackIndex}`}
                                onClick={() => onSongClick(track, allSongsIndex)}
                                className={`flex items-center gap-2 px-3 py-2 transition-all cursor-pointer ${isCurrentTrack
                                  ? "bg-orange-100 border-l-2 border-orange-500"
                                  : "hover:bg-gray-50 border-l-2 border-transparent"
                                  } ${trackIndex !== 0 ? "border-t border-gray-100" : ""}`}
                              >
                                {/* Track Thumbnail */}
                                <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-200 flex-shrink-0 shadow-sm">
                                  <img
                                    src={track.cover}
                                    alt={track.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        generatePlaceholderCover(track.title);
                                    }}
                                  />
                                </div>

                                {/* Track Info */}
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`text-xs font-medium truncate ${isCurrentTrack
                                      ? "text-orange-700"
                                      : "text-gray-900"
                                      }`}
                                  >
                                    {track.title}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {track.artist}
                                  </p>
                                </div>

                                {/* Duration */}
                                <span
                                  className={`text-xs flex-shrink-0 ${isCurrentTrack
                                    ? "text-orange-600 font-medium"
                                    : "text-gray-400"
                                    }`}
                                >
                                  {track.duration}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default QueueList;