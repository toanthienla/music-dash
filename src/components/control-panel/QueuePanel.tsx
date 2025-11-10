"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import axiosClient from "@/utils/axiosClient";
import { IOT_BASE_URL, API_URL } from "@/utils/constants";
import GroupSelector from "./GroupSelector";
import PlayerControls from "./PlayerControls";
import AddToQueuePanel from "./AddToQueuePanel";
import QueueList from "./QueueList";
import EmptyQueuePanel from "./EmptyQueuePanel";

interface Group {
  id: string;
  user_id: string;
  group_name: string;
  description: string;
  cover_art_key: string;
  cover_art_url: string;
  current_track_id: string;
  position_ms: number;
  playback_status: "playing" | "paused" | "stopped";
  volume_level: number;
  repeat_mode: "none" | "track" | "context";
  shuffle: boolean;
  is_active: boolean;
  device_count: number;
  created_at: string;
  updated_at: string;
}

interface QueueTrack {
  id: string;
  title: string;
  artist?: string;
  duration_ms: number;
  thumbnail_key?: string;
  thumbnail_url?: string;
  track_index?: number;
}

interface QueueContext {
  id: string;
  type: "track" | "playlist" | "album";
  queue_position: number;
  current_track_index: number;
  track_count: number;
  total_duration_ms: number;
  shuffle_enabled: boolean;
  added_at: string;
  title: string;
  artist?: string;
  thumbnail_url?: string;
  thumbnail_key?: string;
  context_id?: string;
  tracks?: QueueTrack[];
}

interface QueueResponse {
  group_id: string;
  contexts: QueueContext[];
  total_contexts: number;
  total_tracks: number;
  total_duration_ms: number;
}

interface PlaybackState {
  group_id: string;
  current_track_id: string;
  current_track: {
    id: string;
    title: string;
    artist: string;
    duration_ms: number;
    track_index?: number;
    thumbnail_key?: string;
    thumbnail_url?: string;
  } | null;
  current_context?: {
    id: string;
    type: "track" | "playlist" | "album" | string;
    name?: string;
    track_count?: number;
  } | null;
  position_ms: number;
  playback_status: "playing" | "paused" | "stopped";
  volume_level: number;
  repeat_mode: "none" | "track" | "context";
  shuffle: boolean;
  has_next: boolean;
  has_previous: boolean;
}

interface MusicItem {
  id: string;
  title: string;
  artist?: string;
  durationSeconds: number;
  thumbnailUrl?: string;
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
}

const DEFAULT_COVER = "/images/music/starboy.svg";

// Helper function to fix malformed URLs
const fixThumbnailUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  return url.replace(/iotek\.tn-cdn\.net([a-z])/g, "iotek.tn-cdn.net/$1");
};

const formatDuration = (milliseconds: number): string => {
  if (!milliseconds || isNaN(milliseconds)) return "00:00";

  const totalSeconds = Math.round(milliseconds / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

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

const QueuePanel: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
  const [showGroupDropdown, setShowGroupDropdown] = useState<boolean>(false);

  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false); // queue loading
  const [error, setError] = useState<string | null>(null);
  const [isLoadingNavigation, setIsLoadingNavigation] = useState<boolean>(false);
  const [showAddPanel, setShowAddPanel] = useState<boolean>(false);
  const [addPanelTab, setAddPanelTab] = useState<"music" | "playlist">("music");
  const [availableMusic, setAvailableMusic] = useState<MusicItem[]>([]);
  const [availablePlaylists, setAvailablePlaylists] = useState<Playlist[]>([]);
  const [loadingMusic, setLoadingMusic] = useState<boolean>(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState<boolean>(false);
  const [selectedMusicIds, setSelectedMusicIds] = useState<Set<string>>(new Set());
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(new Set());
  const [addingToQueue, setAddingToQueue] = useState<boolean>(false);
  const [searchMusicTerm, setSearchMusicTerm] = useState<string>("");
  const [searchPlaylistTerm, setSearchPlaylistTerm] = useState<string>("");
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [isRemovingContextAtPosition, setIsRemovingContextAtPosition] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [isPlaybackSeeking, setIsPlaybackSeeking] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(60);
  const [shouldRefreshMusicTab, setShouldRefreshMusicTab] = useState<boolean>(false);
  const [shouldRefreshPlaylistTab, setShouldRefreshPlaylistTab] = useState<boolean>(false);

  // New: indicate UI is switching groups and loading the queue
  const [isSwitchingGroup, setIsSwitchingGroup] = useState<boolean>(false);

  const playbackStartTimeRef = useRef<number>(0);
  const lastSyncTimeRef = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // persist key
  const STORAGE_KEY = "selectedGroupId";

  const groupId = selectedGroup?.id || "";

  const isPreviousDisabled = currentSongIndex === 0 || allSongs.length === 0;
  const isNextDisabled = currentSongIndex === allSongs.length - 1 || allSongs.length === 0;

  // Wrapper to handle group selection from UI: persist, set state, show switching UI only when changing group
  const handleGroupSelect = (g: Group) => {
    try {
      localStorage.setItem(STORAGE_KEY, g.id);
    } catch (e) {
      // ignore localStorage errors
    }

    // If user clicked the already-selected group, just close dropdown and do nothing (don't show switching)
    if (selectedGroup && selectedGroup.id === g.id) {
      setSelectedGroup(g);
      setShowGroupDropdown(false);
      return;
    }

    setSelectedGroup(g);
    setShowGroupDropdown(false);
    // show switching indicator while new queue is fetched
    setIsSwitchingGroup(true);
  };

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoadingGroups(true);
        const response = await axiosClient.get(`${API_URL}/api/v1/groups/list`);

        if (response.data?.success && response.data?.data) {
          const groupsList: Group[] = response.data.data;
          setGroups(groupsList);

          // Try to restore previously selected group from localStorage
          let restored: Group | null = null;
          try {
            const savedId = localStorage.getItem(STORAGE_KEY);
            if (savedId) {
              restored = groupsList.find((g) => g.id === savedId) || null;
            }
          } catch (e) {
            restored = null;
          }

          if (restored) {
            setSelectedGroup(restored);
            // ensure we show switching indicator for initial queue load
            setIsSwitchingGroup(true);
          } else if (groupsList.length > 0) {
            // default to first group and persist it
            setSelectedGroup(groupsList[0]);
            try {
              localStorage.setItem(STORAGE_KEY, groupsList[0].id);
            } catch (e) {
              // ignore localStorage errors
            }
            setIsSwitchingGroup(true);
          }
        }
      } catch (err: any) {
        setError("Failed to fetch groups");
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
    // run once on mount
  }, []);

  // When selectedGroup changes (via UI or restored), persist it so reload remembers.
  useEffect(() => {
    if (!selectedGroup) return;
    try {
      localStorage.setItem(STORAGE_KEY, selectedGroup.id);
    } catch (e) {
      // ignore write errors (e.g. private mode)
    }
  }, [selectedGroup]);

  // Progress interval that only runs when playing
  useEffect(() => {
    if (!isPlaying || !currentSong) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    // Set reference point when playback starts
    playbackStartTimeRef.current = Date.now();

    progressIntervalRef.current = setInterval(() => {
      setCurrentTime((prevTime) => {
        // Calculate elapsed time since this interval started
        const elapsedSeconds = (Date.now() - playbackStartTimeRef.current) / 1000;

        // Add elapsed time to the last synced position
        const newTime = lastSyncTimeRef.current + elapsedSeconds;

        // Don't exceed song duration
        if (newTime >= currentSong.durationSeconds) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return currentSong.durationSeconds;
        }

        return newTime;
      });
    }, 100);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isPlaying, currentSong]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Proper queue data formatting with correct track IDs
  const formatQueueData = (queueData: QueueResponse) => {
    const formattedQueueItems: QueueItem[] = [];
    const allSongsFlattened: Song[] = [];

    queueData.contexts.forEach((context) => {
      if (context.type === "track") {
        const fixedThumbnailUrl = fixThumbnailUrl(context.thumbnail_url);
        const trackId = context.tracks?.[0]?.id || context.id;

        const song: Song = {
          id: trackId,
          title: context.title ?? "Unknown Title",
          artist: context.artist ?? "Unknown Artist",
          duration: formatDuration(context.total_duration_ms ?? 0),
          durationSeconds: Math.round((context.total_duration_ms ?? 0) / 1000),
          cover: fixedThumbnailUrl
            ? fixedThumbnailUrl
            : generatePlaceholderCover(context.title ?? "Unknown Title"),
          contextId: context.id,
          contextType: "track",
          isPlaylistTrack: false,
        };

        allSongsFlattened.push(song);

        formattedQueueItems.push({
          contextId: context.id,
          type: "track",
          title: context.title ?? "Unknown Title",
          artist: context.artist ?? "Unknown Artist",
          trackCount: 1,
          totalDurationMs: context.total_duration_ms ?? 0,
          thumbnail: fixedThumbnailUrl,
          tracks: [song],
        });
      } else if (context.type === "playlist" || context.type === "album") {
        const playlistTracks: Song[] = [];

        context.tracks?.forEach((track) => {
          const fixedTrackThumbnailUrl = fixThumbnailUrl(track.thumbnail_url);
          const song: Song = {
            id: track.id,
            title: track.title ?? "Unknown Title",
            artist: track.artist ?? "Unknown Artist",
            duration: formatDuration(track.duration_ms),
            durationSeconds: Math.round(track.duration_ms / 1000),
            cover: fixedTrackThumbnailUrl
              ? fixedTrackThumbnailUrl
              : track.thumbnail_key
                ? `${IOT_BASE_URL}/${track.thumbnail_key}`
                : generatePlaceholderCover(track.title ?? "Unknown Title"),
            contextId: context.id,
            contextType: context.type,
            isPlaylistTrack: true,
          };

          playlistTracks.push(song);
          allSongsFlattened.push(song);
        });

        const fixedContextThumbnailUrl = fixThumbnailUrl(context.thumbnail_url);
        formattedQueueItems.push({
          contextId: context.id,
          type: context.type,
          title: context.title ?? "Unknown Title",
          artist: context.artist ?? "Unknown Artist",
          trackCount: context.track_count,
          totalDurationMs: context.total_duration_ms ?? 0,
          thumbnail: fixedContextThumbnailUrl,
          tracks: playlistTracks,
        });
      }
    });

    return { formattedQueueItems, allSongsFlattened };
  };

  // Prefer matching by current_context.id first, then fall back to current_track_id
  const syncPlaybackStateWithQueue = async (songs: Song[], queueItems: QueueItem[]) => {
    if (!groupId || songs.length === 0) {
      setCurrentSongIndex(0);
      setCurrentSong(songs[0] || null);
      setCurrentTime(0);
      setIsPlaying(false);
      lastSyncTimeRef.current = 0;
      playbackStartTimeRef.current = Date.now();
      return;
    }

    try {
      const playbackResponse = await axiosClient.get(
        `${API_URL}/api/v1/groups/${groupId}/playback/state`
      );

      if (playbackResponse.data?.success && playbackResponse.data?.data) {
        const playbackState: PlaybackState = playbackResponse.data.data;

        let matchingSong: Song | undefined = undefined;
        let matchingIndex: number = -1;

        // 1) If API provides current_context.id, try to locate the context in the queue first.
        if (playbackState.current_context?.id) {
          const ctxId = playbackState.current_context.id;
          const queueIndex = queueItems.findIndex((q) => q.contextId === ctxId);

          if (queueIndex !== -1) {
            const ctx = queueItems[queueIndex];

            if (ctx.type === "track") {
              matchingIndex = songs.findIndex((s) => s.contextId === ctxId);
              if (matchingIndex !== -1) {
                matchingSong = songs[matchingIndex];
              }
            } else {
              const trackIndexFromState =
                playbackState.current_track?.track_index !== undefined
                  ? playbackState.current_track!.track_index!
                  : 0;

              const trackInContext = ctx.tracks[trackIndexFromState];

              if (trackInContext) {
                matchingIndex = songs.findIndex(
                  (s) => s.id === trackInContext.id && s.contextId === ctxId
                );
                if (matchingIndex !== -1) {
                  matchingSong = songs[matchingIndex];
                } else {
                  // Fallback: compute start index of this context in flattened songs
                  let startIdx = 0;
                  for (let i = 0; i < queueIndex; i++) {
                    startIdx += queueItems[i].tracks.length;
                  }
                  const possibleIndex = startIdx + trackIndexFromState;
                  if (possibleIndex >= 0 && possibleIndex < songs.length) {
                    if (songs[possibleIndex].contextId === ctxId) {
                      matchingIndex = possibleIndex;
                      matchingSong = songs[matchingIndex];
                    }
                  }
                }
              }
            }
          }
        }

        // 2) If still not found, fall back to matching by current_track_id (track id)
        if ((!matchingSong || matchingIndex === -1) && playbackState.current_track_id) {
          for (let i = 0; i < songs.length; i++) {
            if (songs[i].id === playbackState.current_track_id) {
              matchingSong = songs[i];
              matchingIndex = i;
              break;
            }
          }
        }

        if (matchingSong && matchingIndex !== -1) {
          setCurrentSongIndex(matchingIndex);
          setCurrentSong(matchingSong);

          // Set timeline to position_ms from playback state
          const positionSeconds = playbackState.position_ms / 1000;
          setCurrentTime(positionSeconds);
          lastSyncTimeRef.current = positionSeconds;
          playbackStartTimeRef.current = Date.now();

          // Set playback status and volume
          setIsPlaying(playbackState.playback_status === "playing");
          setVolume(playbackState.volume_level);
          return;
        }

        // Final fallback: reset to first song
        setCurrentSongIndex(0);
        setCurrentSong(songs[0] || null);
        setCurrentTime(0);
        setIsPlaying(false);
        lastSyncTimeRef.current = 0;
        playbackStartTimeRef.current = Date.now();
      }
    } catch (playbackErr: any) {
      // On error, reset to first song
      setCurrentSongIndex(0);
      setCurrentSong(songs[0] || null);
      setCurrentTime(0);
      setIsPlaying(false);
      lastSyncTimeRef.current = 0;
      playbackStartTimeRef.current = Date.now();
    }
  };

  useEffect(() => {
    if (!groupId) return;

    const initializeQueue = async () => {
      try {
        setLoading(true);
        setError(null);

        const queueResponse = await axiosClient.get(
          `${API_URL}/api/v1/groups/${groupId}/queue`
        );

        if (queueResponse.data?.success && queueResponse.data?.data) {
          const queueData: QueueResponse = queueResponse.data.data;
          const { formattedQueueItems, allSongsFlattened } = formatQueueData(queueData);

          setQueueItems(formattedQueueItems);
          setAllSongs(allSongsFlattened);

          // Call playback state sync ONLY ONCE here during initial load
          await syncPlaybackStateWithQueue(allSongsFlattened, formattedQueueItems);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err: any) {
        setError(err?.message ?? "Failed to fetch queue");
        setQueueItems([]);
        setAllSongs([]);
      } finally {
        setLoading(false);
        // hide switching indicator after queue load completes (success or error)
        setIsSwitchingGroup(false);
      }
    };

    initializeQueue();
  }, [groupId]);

  const fetchAvailableMusic = useCallback(async () => {
    try {
      setLoadingMusic(true);
      const response = await axiosClient.get(`${API_URL}/api/v1/music`);

      if (response.data?.success && response.data?.data?.data) {
        setAvailableMusic(response.data.data.data);
      }
    } catch (err: any) {
      setAvailableMusic([]);
    } finally {
      setLoadingMusic(false);
    }
  }, []);

  const fetchAvailablePlaylists = useCallback(async () => {
    try {
      setLoadingPlaylists(true);
      const response = await axiosClient.get(`${API_URL}/api/v1/playlists`);

      if (response.data?.success && response.data?.data?.data) {
        const playlists = response.data.data.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          coverUrl: p.coverUrl,
          userId: p.userId,
          isPublic: p.isPublic,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          trackCount: p.trackCount,
          totalDurationSeconds: p.totalDurationSeconds,
          total_duration_ms: (p.totalDurationSeconds || 0) * 1000,
          track_count: p.trackCount,
        }));
        setAvailablePlaylists(playlists);
      } else if (response.data?.success && Array.isArray(response.data?.data)) {
        setAvailablePlaylists(response.data.data);
      }
    } catch (err: any) {
      setAvailablePlaylists([]);
    } finally {
      setLoadingPlaylists(false);
    }
  }, []);

  useEffect(() => {
    if (showAddPanel && addPanelTab === "music" && shouldRefreshMusicTab) {
      fetchAvailableMusic();
      setShouldRefreshMusicTab(false);
    }
  }, [showAddPanel, addPanelTab, shouldRefreshMusicTab, fetchAvailableMusic]);

  useEffect(() => {
    if (showAddPanel && addPanelTab === "playlist" && shouldRefreshPlaylistTab) {
      fetchAvailablePlaylists();
      setShouldRefreshPlaylistTab(false);
    }
  }, [showAddPanel, addPanelTab, shouldRefreshPlaylistTab, fetchAvailablePlaylists]);

  const handleOpenAddPanel = (tab: "music" | "playlist") => {
    setShowAddPanel(true);
    setAddPanelTab(tab);

    if (tab === "music") {
      setShouldRefreshMusicTab(true);
    } else {
      setShouldRefreshPlaylistTab(true);
    }
  };

  const handleAddPanelTabChange = (tab: "music" | "playlist") => {
    setAddPanelTab(tab);

    if (tab === "music") {
      setShouldRefreshMusicTab(true);
    } else {
      setShouldRefreshPlaylistTab(true);
    }
  };

  // Simplified: Just toggle play/pause without fetching state
  const handlePlayPause = async () => {
    try {
      if (!groupId) return;

      if (isPlaying) {
        await axiosClient.post(
          `${API_URL}/api/v1/groups/${groupId}/playback/pause`
        );
        setIsPlaying(false);
      } else {
        await axiosClient.post(
          `${API_URL}/api/v1/groups/${groupId}/playback/play`
        );
        setIsPlaying(true);
      }
    } catch (err: any) {
      // Error handled silently
    }
  };

  const handleNextSong = useCallback(async () => {
    try {
      if (!groupId) return;

      if (isNextDisabled) {
        return;
      }

      setIsLoadingNavigation(true);

      await axiosClient.post(
        `${API_URL}/api/v1/groups/${groupId}/playback/next`
      );

      const nextIndex = currentSongIndex + 1;
      if (nextIndex < allSongs.length) {
        setCurrentSongIndex(nextIndex);
        setCurrentSong(allSongs[nextIndex]);
        setCurrentTime(0);
        lastSyncTimeRef.current = 0;
        playbackStartTimeRef.current = Date.now();
        setIsPlaying(true);
      }
    } catch (err: any) {
      // Error handled silently
    } finally {
      setIsLoadingNavigation(false);
    }
  }, [allSongs, isNextDisabled, groupId, currentSongIndex]);

  const handlePreviousSong = async () => {
    try {
      if (!groupId) return;

      if (isPreviousDisabled) {
        return;
      }

      setIsLoadingNavigation(true);

      await axiosClient.post(
        `${API_URL}/api/v1/groups/${groupId}/playback/previous`
      );

      const prevIndex = currentSongIndex - 1;
      if (prevIndex >= 0) {
        setCurrentSongIndex(prevIndex);
        setCurrentSong(allSongs[prevIndex]);
        setCurrentTime(0);
        lastSyncTimeRef.current = 0;
        playbackStartTimeRef.current = Date.now();
        setIsPlaying(true);
      }
    } catch (err: any) {
      // Error handled silently
    } finally {
      setIsLoadingNavigation(false);
    }
  };

  const handleSkipBackward = async () => {
    try {
      if (!groupId) return;

      setIsPlaybackSeeking(true);

      if (!currentSong) return;

      await axiosClient.post(
        `${API_URL}/api/v1/groups/${groupId}/playback/seek-relative`,
        { offset_ms: -10000 }
      );

      const newPositionSeconds = Math.max(0, currentTime - 10);
      setCurrentTime(newPositionSeconds);
      lastSyncTimeRef.current = newPositionSeconds;
      playbackStartTimeRef.current = Date.now();
    } catch (err: any) {
      // Error handled silently
    } finally {
      setIsPlaybackSeeking(false);
    }
  };

  const handleSkipForward = async () => {
    try {
      if (!groupId) return;

      setIsPlaybackSeeking(true);

      if (!currentSong) return;

      const newPositionSeconds = Math.min(currentSong.durationSeconds, currentTime + 10);

      await axiosClient.post(
        `${API_URL}/api/v1/groups/${groupId}/playback/seek-relative`,
        { offset_ms: 10000 }
      );

      setCurrentTime(newPositionSeconds);
      lastSyncTimeRef.current = newPositionSeconds;
      playbackStartTimeRef.current = Date.now();
    } catch (err: any) {
      // Error handled silently
    } finally {
      setIsPlaybackSeeking(false);
    }
  };

  // Click to seek only (no drag)
  const handleProgressClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    try {
      if (!groupId || !currentSong) return;

      setIsPlaybackSeeking(true);

      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newPositionMs = Math.round(percent * currentSong.durationSeconds * 1000);

      // Send seek request
      await axiosClient.post(
        `${API_URL}/api/v1/groups/${groupId}/playback/seek`,
        { position_ms: newPositionMs }
      );

      // Update timeline to the seeked position
      const newTime = newPositionMs / 1000;
      setCurrentTime(newTime);
      lastSyncTimeRef.current = newTime;
      playbackStartTimeRef.current = Date.now();
    } catch (err: any) {
      // Error handled silently
    } finally {
      setIsPlaybackSeeking(false);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  const handleVolumeChangeEnd = async (newVolume: number) => {
    try {
      if (!groupId) return;

      await axiosClient.post(
        `${API_URL}/api/v1/groups/${groupId}/playback/volume`,
        { volume: newVolume }
      );
    } catch (err: any) {
      // Error handled silently
    }
  };

  const handleSongClick = async (song: Song, index: number) => {
    try {
      if (!groupId) return;

      let queuePosition = -1;
      let trackIndex = 0;
      let foundContext = false;

      // 1) Prefer exact context match when we have song.contextId
      if (song.contextId) {
        queuePosition = queueItems.findIndex((q) => q.contextId === song.contextId);
        if (queuePosition !== -1) {
          const ctx = queueItems[queuePosition];
          if (ctx.type === "track") {
            trackIndex = 0;
          } else {
            // find the track index inside the matched context
            const idxInCtx = ctx.tracks.findIndex((t) => t.id === song.id);
            trackIndex = idxInCtx !== -1 ? idxInCtx : 0;
          }
          foundContext = true;
        }
      }

      // 2) Fallback: if no contextId match, search by id across queue items (previous logic)
      if (!foundContext) {
        for (let i = 0; i < queueItems.length; i++) {
          const item = queueItems[i];

          if (item.type === "track") {
            if (item.tracks[0]?.id === song.id) {
              queuePosition = i;
              trackIndex = 0;
              foundContext = true;
              break;
            }
          }

          if (item.type === "playlist" || item.type === "album") {
            const trackInContext = item.tracks.findIndex((t) => t.id === song.id);
            if (trackInContext !== -1) {
              queuePosition = i;
              trackIndex = trackInContext;
              foundContext = true;
              break;
            }
          }
        }
      }

      if (!foundContext || queuePosition === -1) {
        // nothing to play
        return;
      }

      const response = await axiosClient.post(
        `${API_URL}/api/v1/groups/${groupId}/playback/play-at-position`,
        {
          queue_position: queuePosition,
          track_index: trackIndex,
        }
      );

      if (response.data?.success) {
        // index is the flattened allSongs index passed from QueueList
        setCurrentSongIndex(index);
        setCurrentSong(song);
        setCurrentTime(0);
        lastSyncTimeRef.current = 0;
        playbackStartTimeRef.current = Date.now();
        setIsPlaying(true);
      }
    } catch (err: any) {
      // Error handled silently
    }
  };

  const toggleMusicSelection = (musicId: string) => {
    const newSelected = new Set(selectedMusicIds);
    if (newSelected.has(musicId)) {
      newSelected.delete(musicId);
    } else {
      newSelected.add(musicId);
    }
    setSelectedMusicIds(newSelected);
  };

  const togglePlaylistSelection = (playlistId: string) => {
    const newSelected = new Set(selectedPlaylistIds);
    if (newSelected.has(playlistId)) {
      newSelected.delete(playlistId);
    } else {
      newSelected.add(playlistId);
    }
    setSelectedPlaylistIds(newSelected);
  };

  const handleAddToQueue = async () => {
    try {
      if (!groupId || (selectedMusicIds.size === 0 && selectedPlaylistIds.size === 0)) return;
      setAddingToQueue(true);

      if (selectedMusicIds.size > 0) {
        const musicIds = Array.from(selectedMusicIds);
        const response = await axiosClient.post(
          `${API_URL}/api/v1/groups/${groupId}/queue/tracks`,
          { music_ids: musicIds, position: "end" }
        );

        if (!response.data?.success) {
          throw new Error("Failed to add music to queue");
        }
      }

      if (selectedPlaylistIds.size > 0) {
        const playlistIds = Array.from(selectedPlaylistIds);
        for (const playlistId of playlistIds) {
          const response = await axiosClient.post(
            `${API_URL}/api/v1/groups/${groupId}/queue/playlist`,
            {
              playlist_id: playlistId,
              position: "end",
              shuffle: false,
            }
          );

          if (!response.data?.success) {
            throw new Error("Failed to add playlist to queue");
          }
        }
      }

      const queueResponse = await axiosClient.get(
        `${API_URL}/api/v1/groups/${groupId}/queue`
      );

      if (queueResponse.data?.success && queueResponse.data?.data) {
        const queueData: QueueResponse = queueResponse.data.data;
        const { formattedQueueItems, allSongsFlattened } = formatQueueData(queueData);

        setQueueItems(formattedQueueItems);
        setAllSongs(allSongsFlattened);
        setSelectedMusicIds(new Set());
        setSelectedPlaylistIds(new Set());
        setShowAddPanel(false);
        setSearchMusicTerm("");
        setSearchPlaylistTerm("");

        // Sync playback after adding items to queue (ONCE)
        await syncPlaybackStateWithQueue(allSongsFlattened, formattedQueueItems);
      }
    } catch (err: any) {
      alert(err.message || "Failed to add items to queue");
    } finally {
      setAddingToQueue(false);
    }
  };

  const handleClearQueue = async () => {
    try {
      if (!groupId) return;

      setIsClearing(true);

      const response = await axiosClient.delete(
        `${API_URL}/api/v1/groups/${groupId}/queue`
      );

      if (response.data?.success) {
        await axiosClient.post(
          `${API_URL}/api/v1/groups/${groupId}/playback/stop`
        );

        setQueueItems([]);
        setAllSongs([]);
        setCurrentSong(null);
        setCurrentSongIndex(0);
        setCurrentTime(0);
        lastSyncTimeRef.current = 0;
        playbackStartTimeRef.current = Date.now();
        setIsPlaying(false);
        setShowClearConfirm(false);
      }
    } catch (err: any) {
      // Error handled silently
    } finally {
      setIsClearing(false);
    }
  };

  const handleRemoveContextAtPosition = async (position: number) => {
    try {
      if (!groupId) return;

      setIsRemovingContextAtPosition(position);

      if (queueItems[position]) {
        const contextId = queueItems[position].contextId;

        const response = await axiosClient.delete(
          `${API_URL}/api/v1/groups/${groupId}/queue/context/${contextId}`
        );

        if (response.data?.success) {
          const queueResponse = await axiosClient.get(
            `${API_URL}/api/v1/groups/${groupId}/queue`
          );

          if (queueResponse.data?.success && queueResponse.data?.data) {
            const queueData: QueueResponse = queueResponse.data.data;
            const { formattedQueueItems, allSongsFlattened } = formatQueueData(queueData);

            setQueueItems(formattedQueueItems);
            setAllSongs(allSongsFlattened);

            // Sync playback after removing context (ONCE)
            await syncPlaybackStateWithQueue(allSongsFlattened, formattedQueueItems);
          }
        }
      }
    } catch (err: any) {
      // Error handled silently
    } finally {
      setIsRemovingContextAtPosition(null);
    }
  };

  const handleCloseAddPanel = () => {
    setShowAddPanel(false);
    setSelectedMusicIds(new Set());
    setSelectedPlaylistIds(new Set());
    setSearchMusicTerm("");
    setSearchPlaylistTerm("");
    setShouldRefreshMusicTab(false);
    setShouldRefreshPlaylistTab(false);
  };

  // UI render and passing a wrapper for onGroupSelect so QueuePanel persists selection whenever user changes it.
  if (loadingGroups) {
    return (
      <div
        className="bg-white rounded-3xl shadow-xl p-4 flex flex-col w-full"
        style={{ maxWidth: "400px", margin: "0 auto" }}
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div
        className="bg-white rounded-3xl shadow-xl p-4 flex flex-col w-full"
        style={{ maxWidth: "400px", margin: "0 auto" }}
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">No groups available</p>
        </div>
      </div>
    );
  }

  if (loading && !currentSong) {
    return (
      <div
        className="bg-white rounded-3xl shadow-xl p-4 flex flex-col w-full"
        style={{ maxWidth: "400px", margin: "0 auto" }}
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading queue...</p>
        </div>
      </div>
    );
  }

  if (error && !currentSong) {
    return (
      <div
        className="bg-white rounded-3xl shadow-xl p-4 flex flex-col w-full"
        style={{ maxWidth: "400px", margin: "0 auto" }}
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  // Render main panel. When isSwitchingGroup is true, show a subtle overlay spinner while the new queue loads.
  return (
    <div
      className="bg-white rounded-3xl shadow-xl p-4 flex flex-col w-full relative"
      style={{ maxWidth: "400px", margin: "0 auto" }}
    >
      {/* Overlay shown when switching groups */}
      {isSwitchingGroup && (
        <div className="absolute inset-0 z-40 bg-white/60 flex items-center justify-center rounded-3xl">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Switching group...</p>
          </div>
        </div>
      )}

      <GroupSelector
        groups={groups}
        selectedGroup={selectedGroup}
        showGroupDropdown={showGroupDropdown}
        onShowDropdownChange={setShowGroupDropdown}
        onGroupSelect={handleGroupSelect}
      />

      {allSongs.length === 0 || !currentSong ? (
        <>
          <EmptyQueuePanel
            onAddMusicClick={() => handleOpenAddPanel("music")}
            onAddPlaylistClick={() => handleOpenAddPanel("playlist")}
            groupName={selectedGroup?.group_name || "Group"}
          />

          <AddToQueuePanel
            isOpen={showAddPanel}
            activeTab={addPanelTab}
            availableMusic={availableMusic}
            availablePlaylists={availablePlaylists}
            loadingMusic={loadingMusic}
            loadingPlaylists={loadingPlaylists}
            selectedMusicIds={selectedMusicIds}
            selectedPlaylistIds={selectedPlaylistIds}
            addingToQueue={addingToQueue}
            searchMusicTerm={searchMusicTerm}
            searchPlaylistTerm={searchPlaylistTerm}
            onClose={handleCloseAddPanel}
            onTabChange={handleAddPanelTabChange}
            onSearchMusicChange={setSearchMusicTerm}
            onSearchPlaylistChange={setSearchPlaylistTerm}
            onToggleMusicSelection={toggleMusicSelection}
            onTogglePlaylistSelection={togglePlaylistSelection}
            onAddToQueue={handleAddToQueue}
            formatDuration={formatDuration}
          />
        </>
      ) : (
        <>
          <PlayerControls
            currentSong={currentSong}
            isPlaying={isPlaying}
            currentTime={currentTime}
            volume={volume}
            isPreviousDisabled={isPreviousDisabled}
            isNextDisabled={isNextDisabled}
            isLoadingNavigation={isLoadingNavigation}
            isPlaybackSeeking={isPlaybackSeeking}
            onPlayPause={handlePlayPause}
            onPrevious={handlePreviousSong}
            onNext={handleNextSong}
            onSkipBackward={handleSkipBackward}
            onSkipForward={handleSkipForward}
            onProgressClick={handleProgressClick}
            onVolumeChange={handleVolumeChange}
            onVolumeChangeEnd={handleVolumeChangeEnd}
            onAddClick={handleOpenAddPanel}
            formatDuration={formatDuration}
            generatePlaceholderCover={generatePlaceholderCover}
          />

          <AddToQueuePanel
            isOpen={showAddPanel}
            activeTab={addPanelTab}
            availableMusic={availableMusic}
            availablePlaylists={availablePlaylists}
            loadingMusic={loadingMusic}
            loadingPlaylists={loadingPlaylists}
            selectedMusicIds={selectedMusicIds}
            selectedPlaylistIds={selectedPlaylistIds}
            addingToQueue={addingToQueue}
            searchMusicTerm={searchMusicTerm}
            searchPlaylistTerm={searchPlaylistTerm}
            onClose={handleCloseAddPanel}
            onTabChange={handleAddPanelTabChange}
            onSearchMusicChange={setSearchMusicTerm}
            onSearchPlaylistChange={setSearchPlaylistTerm}
            onToggleMusicSelection={toggleMusicSelection}
            onTogglePlaylistSelection={togglePlaylistSelection}
            onAddToQueue={handleAddToQueue}
            formatDuration={formatDuration}
          />

          <QueueList
            queueItems={queueItems}
            allSongs={allSongs}
            currentSongIndex={currentSongIndex}
            isRemovingContextAtPosition={isRemovingContextAtPosition}
            showClearConfirm={showClearConfirm}
            isClearing={isClearing}
            onSongClick={handleSongClick}
            onRemoveContext={handleRemoveContextAtPosition}
            onClearQueueClick={() => setShowClearConfirm(true)}
            onClearConfirmClose={() => setShowClearConfirm(false)}
            onClearQueueConfirm={handleClearQueue}
            generatePlaceholderCover={generatePlaceholderCover}
          />
        </>
      )}
    </div>
  );
};

export default QueuePanel;