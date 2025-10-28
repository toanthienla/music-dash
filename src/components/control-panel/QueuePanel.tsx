"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  MoreVertical,
  ArrowUp,
  RotateCcw,
  RotateCw,
  Gauge,
  Timer,
  Cast,
  Plus,
  X,
  Search,
  Trash2,
} from "lucide-react";
import axiosClient from "@/utils/axiosClient";
import { TEKNIX_USER_SESSION_TOKEN, TEKNIX_MUSIC_URL } from "@/utils/constants";

interface QueueSong {
  id: string;
  title: string;
  artist?: string;
  durationSeconds: number;
  album?: string;
  genre?: string;
  fileFormat: string;
  bitrateKbps: number;
  uploadedBy: string;
  visibility: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  storageKey: string;
  fileSize: number;
  contentType: string;
}

interface MusicItem {
  id: string;
  title: string;
  artist?: string;
  durationSeconds: number;
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

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  durationSeconds: number;
  cover: string;
  fileUrl?: string;
  storageKey?: string;
}

const DEFAULT_COVER = "/images/music/starboy.svg";

// Fixed formatDuration function - rounds to nearest second
const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "00:00";

  // Round to nearest integer
  const totalSeconds = Math.round(seconds);

  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/** Deterministic color palette and SVG placeholder generator */
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
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingNavigation, setIsLoadingNavigation] = useState<boolean>(false);
  const [showAddMusic, setShowAddMusic] = useState<boolean>(false);
  const [availableMusic, setAvailableMusic] = useState<MusicItem[]>([]);
  const [loadingMusic, setLoadingMusic] = useState<boolean>(false);
  const [selectedMusicIds, setSelectedMusicIds] = useState<Set<string>>(new Set());
  const [addingMusic, setAddingMusic] = useState<boolean>(false);
  const [searchMusicTerm, setSearchMusicTerm] = useState<string>("");
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [isRemovingSong, setIsRemovingSong] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [isPlaybackSeeking, setIsPlaybackSeeking] = useState<boolean>(false);

  // Use useRef to maintain audio element across renders
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate music URL from storage key
  const getMusicUrl = useCallback((storageKey: string): string => {
    return `${TEKNIX_MUSIC_URL}/${storageKey}`;
  }, []);

  // Check if previous button should be disabled (first song)
  const isPreviousDisabled = currentQueueIndex === 0 || queue.length === 0;

  // Check if next button should be disabled (last song)
  const isNextDisabled = currentQueueIndex === queue.length - 1 || queue.length === 0;

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (audioTimeoutRef.current) {
        clearTimeout(audioTimeoutRef.current);
      }
    };
  }, []);

  // Fetch queue data and stop playback on initial load
  useEffect(() => {
    const initializeQueue = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!TEKNIX_USER_SESSION_TOKEN) {
          throw new Error("Session token not found");
        }

        // Send stop request to reset playback position to 0
        try {
          await axiosClient.post(
            `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/stop`
          );
          console.log("Playback position reset to 0");
        } catch (stopErr: any) {
          console.warn("Warning: Could not reset playback position:", stopErr);
          // Continue even if stop fails
        }

        // Fetch queue data
        const response = await axiosClient.get(
          `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/queue`
        );

        if (response.data?.success && response.data?.data?.queue) {
          const queueItems = response.data.data.queue;
          const queuePosition = response.data.data.queue_position || 0;

          // Format songs directly from queue response
          const formattedSongs = queueItems.map((item: QueueSong) => {
            return {
              id: item.id,
              title: item.title ?? "Unknown Title",
              artist: item.artist ?? "Unknown Artist",
              duration: formatDuration(item.durationSeconds),
              durationSeconds: item.durationSeconds,
              cover: generatePlaceholderCover(item.title ?? "Unknown Title"),
              fileUrl: getMusicUrl(item.storageKey),
              storageKey: item.storageKey,
            };
          });

          setQueue(formattedSongs);
          setCurrentQueueIndex(queuePosition);

          if (formattedSongs.length > 0 && queuePosition < formattedSongs.length) {
            setCurrentSong(formattedSongs[queuePosition]);
          } else if (formattedSongs.length > 0) {
            setCurrentSong(formattedSongs[0]);
          }
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err: any) {
        console.error("Error initializing queue:", err);
        setError(err?.message ?? "Failed to fetch queue");
        setQueue([]);
      } finally {
        setLoading(false);
      }
    };

    initializeQueue();
  }, [getMusicUrl]);

  // Fetch available music
  const fetchAvailableMusic = async () => {
    try {
      setLoadingMusic(true);
      const response = await axiosClient.get("/api/v1/music");

      if (response.data?.success && response.data?.data?.data) {
        setAvailableMusic(response.data.data.data);
      }
    } catch (err: any) {
      console.error("Error fetching music:", err);
    } finally {
      setLoadingMusic(false);
    }
  };

  // Handle audio ended event
  const handleEnded = useCallback(async () => {
    console.log("Song ended, moving to next");
    await handleNextSong();
  }, []);

  // Handle time update event - rounds time for clean display
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      // Round to nearest second for clean display
      const roundedTime = Math.round(audioRef.current.currentTime);
      setCurrentTime(roundedTime);
    }
  }, []);

  // Initialize audio element when current song changes
  useEffect(() => {
    if (currentSong && currentSong.fileUrl) {
      // Clean up existing audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener("ended", handleEnded);
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
      }

      // Create new audio element
      const audio = new Audio();
      audio.src = currentSong.fileUrl;
      audio.currentTime = 0;

      // Add event listeners
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("timeupdate", handleTimeUpdate);

      audioRef.current = audio;

      // Reset current time to 0 when switching tracks
      setCurrentTime(0);

      // Auto-play if isPlaying is true
      if (isPlaying) {
        audio.play().catch((err) => console.error("Error playing audio:", err));
      }

      return () => {
        // Cleanup is handled separately on unmount
      };
    }
  }, [currentSong?.id, handleEnded, handleTimeUpdate]); // FIXED: Removed isPlaying from dependencies

  // Handle play/pause state - DO NOT modify currentTime here
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => console.error("Error playing audio:", err));
      } else {
        audioRef.current.pause();
        // IMPORTANT: Do NOT reset currentTime here - just pause the audio
      }
    }
  }, [isPlaying]);

  // Handle play button click - NO PAYLOAD
  const handlePlayPause = async () => {
    try {
      if (!TEKNIX_USER_SESSION_TOKEN) {
        throw new Error("Session token not found");
      }

      if (isPlaying) {
        // Send pause request
        await axiosClient.post(
          `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/pause`
        );
        // IMPORTANT: Do NOT reset currentTime - only change isPlaying state
        setIsPlaying(false);
      } else {
        // Send play request WITHOUT payload
        await axiosClient.post(
          `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/play`
        );
        setIsPlaying(true);
      }
    } catch (err: any) {
      console.error("Error toggling playback:", err);
    }
  };

  // Handle next song
  const handleNextSong = useCallback(async () => {
    try {
      // Don't proceed if already on last song
      if (isNextDisabled) {
        return;
      }

      setIsLoadingNavigation(true);

      if (!TEKNIX_USER_SESSION_TOKEN) {
        throw new Error("Session token not found");
      }

      const response = await axiosClient.post(
        `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/next`
      );

      if (response.data?.success && response.data?.data) {
        const queuePosition = response.data.data.queue_position || 0;

        if (queue.length > 0 && queuePosition < queue.length) {
          setCurrentQueueIndex(queuePosition);
          setCurrentSong(queue[queuePosition]);
          setCurrentTime(0);
          setIsPlaying(true);
        }
      }
    } catch (err: any) {
      console.error("Error playing next song:", err);
    } finally {
      setIsLoadingNavigation(false);
    }
  }, [queue, isNextDisabled]);

  // Handle previous song
  const handlePreviousSong = async () => {
    try {
      // Don't proceed if already on first song
      if (isPreviousDisabled) {
        return;
      }

      setIsLoadingNavigation(true);

      if (!TEKNIX_USER_SESSION_TOKEN) {
        throw new Error("Session token not found");
      }

      const response = await axiosClient.post(
        `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/previous`
      );

      if (response.data?.success && response.data?.data) {
        const queuePosition = response.data.data.queue_position || 0;

        if (queue.length > 0 && queuePosition < queue.length) {
          setCurrentQueueIndex(queuePosition);
          setCurrentSong(queue[queuePosition]);
          setCurrentTime(0);
          setIsPlaying(true);
        }
      }
    } catch (err: any) {
      console.error("Error playing previous song:", err);
    } finally {
      setIsLoadingNavigation(false);
    }
  };

  // Handle skip backward (10 seconds) - NOW USES ABSOLUTE SEEK
  const handleSkipBackward = async () => {
    try {
      setIsPlaybackSeeking(true);

      if (!TEKNIX_USER_SESSION_TOKEN) {
        throw new Error("Session token not found");
      }

      if (!audioRef.current || !currentSong) return;

      // Calculate new position (10 seconds backward, but not less than 0)
      const newPositionSeconds = Math.max(0, audioRef.current.currentTime - 10);
      const newPositionMs = Math.round(newPositionSeconds * 1000);

      // Call seek API with absolute position
      await axiosClient.post(
        `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/seek`,
        { position_ms: newPositionMs }
      );

      // Update local audio position
      audioRef.current.currentTime = newPositionSeconds;
      setCurrentTime(Math.round(newPositionSeconds));
    } catch (err: any) {
      console.error("Error seeking backward:", err);
    } finally {
      setIsPlaybackSeeking(false);
    }
  };

  // Handle skip forward (10 seconds) - NOW USES ABSOLUTE SEEK
  const handleSkipForward = async () => {
    try {
      setIsPlaybackSeeking(true);

      if (!TEKNIX_USER_SESSION_TOKEN) {
        throw new Error("Session token not found");
      }

      if (!audioRef.current || !currentSong) return;

      // Calculate new position (10 seconds forward, but not more than duration)
      const newPositionSeconds = Math.min(
        currentSong.durationSeconds,
        audioRef.current.currentTime + 10
      );
      const newPositionMs = Math.round(newPositionSeconds * 1000);

      // Call seek API with absolute position
      await axiosClient.post(
        `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/seek`,
        { position_ms: newPositionMs }
      );

      // Update local audio position
      audioRef.current.currentTime = newPositionSeconds;
      setCurrentTime(Math.round(newPositionSeconds));
    } catch (err: any) {
      console.error("Error seeking forward:", err);
    } finally {
      setIsPlaybackSeeking(false);
    }
  };

  // Handle progress bar click - NOW USES ABSOLUTE SEEK
  const handleProgressClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    try {
      if (!currentSong || !audioRef.current) return;

      setIsPlaybackSeeking(true);

      if (!TEKNIX_USER_SESSION_TOKEN) {
        throw new Error("Session token not found");
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newPositionSeconds = percent * currentSong.durationSeconds;
      const newPositionMs = Math.round(newPositionSeconds * 1000);

      // Call seek API with absolute position
      await axiosClient.post(
        `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/seek`,
        { position_ms: newPositionMs }
      );

      // Update local audio
      audioRef.current.currentTime = newPositionSeconds;
      setCurrentTime(Math.round(newPositionSeconds));
    } catch (err: any) {
      console.error("Error seeking to position:", err);
    } finally {
      setIsPlaybackSeeking(false);
    }
  };

  // Handle song click from queue - NOW USES PLAY-TRACK ENDPOINT
  const handleSongClick = async (song: Song, index: number) => {
    try {
      if (!TEKNIX_USER_SESSION_TOKEN) {
        throw new Error("Session token not found");
      }

      // First stop current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      // Send play-track request with queue position
      await axiosClient.post(
        `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/play-track`,
        { queue_position: index }
      );

      // Update state
      setCurrentQueueIndex(index);
      setCurrentSong(song);
      setCurrentTime(0);
      setIsPlaying(true);
    } catch (err: any) {
      console.error("Error selecting song:", err);
    }
  };

  // Toggle music selection
  const toggleMusicSelection = (musicId: string) => {
    const newSelected = new Set(selectedMusicIds);
    if (newSelected.has(musicId)) {
      newSelected.delete(musicId);
    } else {
      newSelected.add(musicId);
    }
    setSelectedMusicIds(newSelected);
  };

  // Add music to queue
  const handleAddMusicToQueue = async () => {
    try {
      if (selectedMusicIds.size === 0) return;
      setAddingMusic(true);

      if (!TEKNIX_USER_SESSION_TOKEN) {
        throw new Error("Session token not found");
      }

      const musicIds = Array.from(selectedMusicIds);

      const response = await axiosClient.post(
        `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/queue`,
        { music_ids: musicIds }
      );

      if (response.data?.success) {
        // Refresh queue
        const queueResponse = await axiosClient.get(
          `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/queue`
        );

        if (queueResponse.data?.success && queueResponse.data?.data?.queue) {
          const queueItems = queueResponse.data.data.queue;
          const queuePosition = queueResponse.data.data.queue_position || 0;

          const formattedSongs = queueItems.map((item: QueueSong) => {
            return {
              id: item.id,
              title: item.title ?? "Unknown Title",
              artist: item.artist ?? "Unknown Artist",
              duration: formatDuration(item.durationSeconds),
              durationSeconds: item.durationSeconds,
              cover: generatePlaceholderCover(item.title ?? "Unknown Title"),
              fileUrl: getMusicUrl(item.storageKey),
              storageKey: item.storageKey,
            };
          });

          setQueue(formattedSongs);
          setCurrentQueueIndex(queuePosition);

          if (formattedSongs.length > 0 && queuePosition < formattedSongs.length) {
            setCurrentSong(formattedSongs[queuePosition]);
          } else if (formattedSongs.length > 0) {
            setCurrentSong(formattedSongs[0]);
          }

          setSelectedMusicIds(new Set());
          setShowAddMusic(false);
          setSearchMusicTerm("");
        }
      }
    } catch (err: any) {
      console.error("Error adding music to queue:", err);
    } finally {
      setAddingMusic(false);
    }
  };

  // Clear entire queue
  const handleClearQueue = async () => {
    try {
      setIsClearing(true);

      if (!TEKNIX_USER_SESSION_TOKEN) {
        throw new Error("Session token not found");
      }

      const response = await axiosClient.delete(
        `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/queue`
      );

      if (response.data?.success) {
        // Send stop request
        await axiosClient.post(
          `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/stop`
        );

        // Stop audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }

        setQueue([]);
        setCurrentSong(null);
        setCurrentQueueIndex(0);
        setCurrentTime(0);
        setIsPlaying(false);
        setShowClearConfirm(false);
      }
    } catch (err: any) {
      console.error("Error clearing queue:", err);
    } finally {
      setIsClearing(false);
    }
  };

  // Remove song at specific position
  const handleRemoveSongAtPosition = async (position: number) => {
    try {
      setIsRemovingSong(queue[position].id);

      if (!TEKNIX_USER_SESSION_TOKEN) {
        throw new Error("Session token not found");
      }

      const response = await axiosClient.delete(
        `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/queue/${position}`
      );

      if (response.data?.success) {
        // Refresh queue
        const queueResponse = await axiosClient.get(
          `/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/queue`
        );

        if (queueResponse.data?.success && queueResponse.data?.data?.queue) {
          const queueItems = queueResponse.data.data.queue;
          const queuePosition = queueResponse.data.data.queue_position || 0;

          const formattedSongs = queueItems.map((item: QueueSong) => {
            return {
              id: item.id,
              title: item.title ?? "Unknown Title",
              artist: item.artist ?? "Unknown Artist",
              duration: formatDuration(item.durationSeconds),
              durationSeconds: item.durationSeconds,
              cover: generatePlaceholderCover(item.title ?? "Unknown Title"),
              fileUrl: getMusicUrl(item.storageKey),
              storageKey: item.storageKey,
            };
          });

          setQueue(formattedSongs);
          setCurrentQueueIndex(queuePosition);

          if (formattedSongs.length > 0 && queuePosition < formattedSongs.length) {
            setCurrentSong(formattedSongs[queuePosition]);
          } else if (formattedSongs.length > 0) {
            setCurrentSong(formattedSongs[0]);
          } else {
            setCurrentSong(null);
          }
        }
      }
    } catch (err: any) {
      console.error("Error removing song from queue:", err);
    } finally {
      setIsRemovingSong(null);
    }
  };

  const progressPercentage = currentSong
    ? (currentTime / currentSong.durationSeconds) * 100
    : 0;

  // Filter available music by search term
  const filteredAvailableMusic = availableMusic.filter((music) => {
    const q = searchMusicTerm.toLowerCase();
    return (
      music.title.toLowerCase().includes(q) ||
      (music.artist ?? "").toLowerCase().includes(q)
    );
  });

  // Get music that are not already in queue
  const queueMusicIds = new Set(queue.map((s) => s.id));
  const addableMusic = filteredAvailableMusic.filter(
    (m) => !queueMusicIds.has(m.id)
  );

  if (loading) {
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

  if (error) {
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

  if (queue.length === 0 || !currentSong) {
    return (
      <div
        className="bg-white rounded-3xl shadow-xl p-4 flex flex-col w-full"
        style={{ maxWidth: "400px", margin: "0 auto" }}
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No songs in queue</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-3xl shadow-xl p-4 flex flex-col w-full"
      style={{ maxWidth: "400px", margin: "0 auto" }}
    >
      {/* --- ALBUM --- */}
      <div className="w-full mb-2 rounded-2xl overflow-hidden">
        <img
          src={currentSong.cover}
          alt={currentSong.title}
          className="w-full aspect-square object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = generatePlaceholderCover(
              currentSong.title
            );
          }}
        />
      </div>
      <h2 className="text-xl font-semibold text-center mt-3 line-clamp-1">
        {currentSong.title}
      </h2>
      <p className="text-gray-500 text-sm text-center line-clamp-1">
        {currentSong.artist}
      </p>

      {/* --- Progress Bar --- */}
      <div className="w-full mt-4">
        <div
          className="w-full h-2 bg-gray-200 rounded-full cursor-pointer hover:h-3 transition-all"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-[#FF9100] rounded-full transition-all"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1 font-medium">
          <span>{formatDuration(currentTime)}</span>
          <span>{currentSong.duration}</span>
        </div>
      </div>

      {/* --- Controls --- */}
      <div className="grid grid-cols-5 gap-2 mt-6 items-center justify-items-center">
        <button
          onClick={handlePreviousSong}
          disabled={isLoadingNavigation || isPreviousDisabled}
          className="bg-transparent hover:opacity-70 transition-opacity disabled:opacity-50"
          aria-label="Previous song"
        >
          <SkipBack size={28} className="text-gray-700" />
        </button>
        <button
          onClick={handleSkipBackward}
          disabled={isPlaybackSeeking}
          className="bg-transparent flex items-center justify-center relative hover:opacity-70 transition-opacity disabled:opacity-50"
          aria-label="Rewind 10 seconds"
        >
          <RotateCcw size={32} className="text-gray-800" />
          <span className="absolute text-xs font-bold text-gray-800 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            10
          </span>
        </button>
        <button
          className="w-16 h-16 flex items-center justify-center bg-[#FF9100] text-white rounded-full shadow-md hover:bg-orange-600 transition-colors active:scale-95"
          onClick={handlePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={34} /> : <Play size={34} />}
        </button>
        <button
          onClick={handleSkipForward}
          disabled={isPlaybackSeeking}
          className="bg-transparent flex items-center justify-center relative hover:opacity-70 transition-opacity disabled:opacity-50"
          aria-label="Forward 10 seconds"
        >
          <RotateCw size={32} className="text-gray-800" />
          <span className="absolute text-xs font-bold text-gray-800 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            10
          </span>
        </button>
        <button
          onClick={handleNextSong}
          disabled={isLoadingNavigation || isNextDisabled}
          className="bg-transparent hover:opacity-70 transition-opacity disabled:opacity-50"
          aria-label="Next song"
        >
          <SkipForward size={28} className="text-gray-700" />
        </button>
      </div>

      {/* --- Extra Controls --- */}
      <div className="grid grid-cols-4 gap-2 mt-6 mb-2 items-center justify-items-center">
        <button
          className="hover:opacity-70 transition-opacity"
          aria-label="Speed"
        >
          <Gauge size={26} className="text-gray-700" />
        </button>
        <button
          className="hover:opacity-70 transition-opacity"
          aria-label="Sleep timer"
        >
          <Timer size={26} className="text-gray-700" />
        </button>
        <button
          className="hover:opacity-70 transition-opacity"
          aria-label="Cast"
        >
          <Cast size={26} className="text-gray-700" />
        </button>
        <button
          onClick={() => {
            setShowAddMusic(!showAddMusic);
            if (!showAddMusic) {
              fetchAvailableMusic();
            }
          }}
          className="hover:opacity-70 transition-opacity"
          aria-label="Add music"
        >
          <Plus size={26} className="text-gray-700" />
        </button>
      </div>

      {/* --- Add Music Side Panel --- */}
      {showAddMusic && (
        <div className="fixed inset-0 z-[100000] flex">
          <div
            onClick={() => {
              setShowAddMusic(false);
              setSelectedMusicIds(new Set());
              setSearchMusicTerm("");
            }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <aside className="relative ml-auto w-full max-w-[560px] h-screen bg-white rounded-l-2xl shadow-xl flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Add Music to Queue
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Select songs to add to your queue
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddMusic(false);
                    setSelectedMusicIds(new Set());
                    setSearchMusicTerm("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search music..."
                  value={searchMusicTerm}
                  onChange={(e) => setSearchMusicTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingMusic ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Loading music...</p>
                </div>
              ) : addableMusic.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-center">
                    {searchMusicTerm
                      ? "No matching music found"
                      : "All available music is already in your queue"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addableMusic.map((music) => (
                    <div
                      key={music.id}
                      onClick={() => toggleMusicSelection(music.id)}
                      className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2 ${selectedMusicIds.has(music.id)
                        ? "bg-orange-50 border-[#FF9100]"
                        : "bg-gray-50 border-transparent hover:bg-gray-100"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMusicIds.has(music.id)}
                        onChange={() => { }}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {music.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {music.artist || "Unknown Artist"} •{" "}
                          {formatDuration(music.durationSeconds)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => {
                  setShowAddMusic(false);
                  setSelectedMusicIds(new Set());
                  setSearchMusicTerm("");
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMusicToQueue}
                disabled={selectedMusicIds.size === 0 || addingMusic}
                className="px-4 py-2 bg-[#FF9100] text-white rounded-lg hover:bg-orange-600 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {addingMusic ? "Adding..." : `Add (${selectedMusicIds.size})`}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* --- Clear Queue Confirmation Dialog --- */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center">
          <div
            onClick={() => setShowClearConfirm(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Clear Queue?
            </h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to clear all songs from the queue? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleClearQueue}
                disabled={isClearing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isClearing ? "Clearing..." : "Clear Queue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Song List --- */}
      <div className="mt-8 w-full">
        <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
          <span>
            {queue.length} song{queue.length !== 1 ? "s" : ""}
          </span>
          {queue.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-red-500 hover:text-red-600 transition-colors text-sm font-medium"
              aria-label="Clear queue"
              title="Clear entire queue"
            >
              Clear Queue
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto rounded-lg border border-gray-100">
          {queue.map((song, index) => (
            <div
              key={song.id}
              onClick={() => handleSongClick(song, index)}
              className={`flex items-center justify-between px-3 py-3 transition-all duration-200 cursor-pointer group ${currentQueueIndex === index ? "bg-orange-50" : "hover:bg-gray-50"
                }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Position Index */}
                <div className="w-8 flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-500 text-center">
                    {index + 1}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={song.cover}
                    alt={song.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        generatePlaceholderCover(song.title);
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {song.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {song.duration}
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSongAtPosition(index);
                }}
                disabled={isRemovingSong === song.id}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 flex-shrink-0"
                aria-label="Remove song"
              >
                {isRemovingSong === song.id ? (
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-orange-500 text-sm mt-4 cursor-pointer hover:underline">
          See All
        </p>
      </div>
    </div>
  );
};

export default QueuePanel;