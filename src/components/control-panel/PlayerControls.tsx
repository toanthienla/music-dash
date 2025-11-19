"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  Plus,
  Repeat,
  Shuffle,
} from "lucide-react";

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  durationSeconds: number;
  cover: string;
}

type ShuffleMode = "off" | "queue" | "context" | "context+track";

interface PlayerControlsProps {
  currentSong: Song;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  repeatMode: "none" | "context" | "all_queue";
  shuffleMode: ShuffleMode;
  isPreviousDisabled: boolean;
  isNextDisabled: boolean;
  isLoadingNavigation: boolean;
  isPlaybackSeeking: boolean;
  isChangingRepeatMode?: boolean;
  isChangingShuffle?: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onVolumeChange: (volume: number) => void;
  onVolumeChangeEnd: (volume: number) => void;
  onRepeatModeChange: (mode: "none" | "context" | "all_queue") => void;
  onShuffleToggle: () => void;
  onAddClick: (tab: "music" | "playlist") => void;
  formatDuration: (ms: number) => string;
  generatePlaceholderCover: (text?: string, size?: number) => string;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentSong,
  isPlaying,
  currentTime,
  volume,
  repeatMode,
  shuffleMode,
  isPreviousDisabled,
  isNextDisabled,
  isLoadingNavigation,
  isPlaybackSeeking,
  isChangingRepeatMode = false,
  isChangingShuffle = false,
  onPlayPause,
  onPrevious,
  onNext,
  onSkipBackward,
  onSkipForward,
  onProgressClick,
  onVolumeChange,
  onVolumeChangeEnd,
  onRepeatModeChange,
  onShuffleToggle,
  onAddClick,
  formatDuration,
  generatePlaceholderCover,
}) => {
  const [showVolumePanel, setShowVolumePanel] = useState<boolean>(false);
  const volumeButtonRef = useRef<HTMLDivElement | null>(null);
  const volumeSliderRef = useRef<HTMLInputElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Progress is now fully controlled from parent via currentTime
  const progressPercentage = currentSong
    ? (currentTime / currentSong.durationSeconds) * 100
    : 0;

  // Close volume panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        volumeButtonRef.current &&
        !volumeButtonRef.current.contains(event.target as Node)
      ) {
        setShowVolumePanel(false);
      }
    };

    if (showVolumePanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showVolumePanel]);

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const _newTime = percent * currentSong.durationSeconds;

    onProgressClick(e);
  };

  const handleVolumeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    onVolumeChange(newVolume);
  };

  const handleVolumeSliderEnd = () => {
    if (volumeSliderRef.current) {
      const newVolume = Number(volumeSliderRef.current.value);
      onVolumeChangeEnd(newVolume);
    }
  };

  const handleRepeatModeClick = () => {
    let nextMode: "none" | "context" | "all_queue";

    switch (repeatMode) {
      case "none":
        nextMode = "context";
        break;
      case "context":
        nextMode = "all_queue";
        break;
      case "all_queue":
        nextMode = "none";
        break;
      default:
        nextMode = "none";
    }

    onRepeatModeChange(nextMode);
  };

  const getRepeatModeLabel = () => {
    switch (repeatMode) {
      case "none":
        return "Repeat Off";
      case "context":
        return "Repeat Context";
      case "all_queue":
        return "Repeat All Queue";
      default:
        return "Repeat";
    }
  };

  const getRepeatModeColor = () => {
    if (repeatMode === "none") {
      return "text-gray-700";
    }
    return "text-[#FF9100]";
  };

  const getShuffleModeLabel = () => {
    switch (shuffleMode) {
      case "off":
        return "Shuffle Off";
      case "queue":
        return "Shuffle Queue";
      case "context":
        return "Shuffle Context";
      case "context+track":
        return "Shuffle Context + Track";
      default:
        return "Shuffle";
    }
  };

  const getShuffleModeColor = () => {
    if (shuffleMode === "off") {
      return "text-gray-700";
    }
    return "text-[#FF9100]";
  };

  const getShuffleModeIndicator = () => {
    switch (shuffleMode) {
      case "queue":
        return "Q";
      case "context":
        return "C";
      case "context+track":
        return "CT";
      default:
        return null;
    }
  };

  return (
    <>
      {/* --- ALBUM --- */}
      <div className="w-full mb-2 rounded-2xl overflow-hidden shadow-md">
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

      {/* --- Song Info --- */}
      <h2 className="text-xl font-semibold text-center mt-3 line-clamp-1">
        {currentSong.title}
      </h2>
      <p className="text-gray-500 text-sm text-center line-clamp-1">
        {currentSong.artist}
      </p>

      {/* --- Progress Bar --- */}
      <div className="w-full mt-4">
        <div
          ref={progressBarRef}
          className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
          onClick={handleProgressBarClick}
        >
          <div
            className="h-full bg-[#FF9100] rounded-full transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Time display */}
        <div className="flex justify-between text-xs text-gray-500 mt-1 font-medium">
          <span>{formatDuration(currentTime * 1000)}</span>
          <span>{currentSong.duration}</span>
        </div>
      </div>

      {/* --- Controls --- */}
      <div className="grid grid-cols-5 gap-2 mt-6 items-center justify-items-center">
        <button
          onClick={onPrevious}
          disabled={isLoadingNavigation || isPreviousDisabled}
          className="bg-transparent hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous song"
        >
          <SkipBack size={28} className="text-gray-700" />
        </button>

        <button
          onClick={onSkipBackward}
          disabled={isPlaybackSeeking}
          className="bg-transparent flex items-center justify-center relative hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Rewind 10 seconds"
        >
          <RotateCcw size={32} className="text-gray-800" />
          <span className="absolute text-xs font-bold text-gray-800 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            10
          </span>
        </button>

        <button
          className="w-16 h-16 flex items-center justify-center bg-[#FF9100] text-white rounded-full shadow-md hover:bg-orange-600 transition-colors active:scale-95"
          onClick={onPlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={34} /> : <Play size={34} />}
        </button>

        <button
          onClick={onSkipForward}
          disabled={isPlaybackSeeking}
          className="bg-transparent flex items-center justify-center relative hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Forward 10 seconds"
        >
          <RotateCw size={32} className="text-gray-800" />
          <span className="absolute text-xs font-bold text-gray-800 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            10
          </span>
        </button>

        <button
          onClick={onNext}
          disabled={isLoadingNavigation || isNextDisabled}
          className="bg-transparent hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next song"
        >
          <SkipForward size={28} className="text-gray-700" />
        </button>
      </div>

      {/* --- Extra Controls --- */}
      <div className="grid grid-cols-4 gap-2 mt-6 mb-4 items-center justify-items-center">
        <button
          onClick={handleRepeatModeClick}
          disabled={isChangingRepeatMode}
          className="hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed relative"
          aria-label={getRepeatModeLabel()}
          title={getRepeatModeLabel()}
        >
          <Repeat size={26} className={getRepeatModeColor()} />
          {repeatMode !== "none" && (
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FF9100] text-white text-xs rounded-full flex items-center justify-center font-bold">
              {repeatMode === "context" ? "1" : "∞"}
            </span>
          )}
        </button>

        <button
          onClick={onShuffleToggle}
          disabled={isChangingShuffle}
          className="hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed relative"
          aria-label={getShuffleModeLabel()}
          title={getShuffleModeLabel()}
        >
          <Shuffle size={26} className={getShuffleModeColor()} />
          {shuffleMode !== "off" && (
            <span className="absolute -bottom-1 -right-1 px-1 py-0.5 bg-[#FF9100] text-white text-xs rounded-full flex items-center justify-center font-bold whitespace-nowrap">
              {getShuffleModeIndicator()}
            </span>
          )}
        </button>

        <div className="relative" ref={volumeButtonRef}>
          <button
            onClick={() => setShowVolumePanel(!showVolumePanel)}
            className="hover:opacity-70 transition-opacity"
            aria-label="Volume control"
          >
            <Volume2 size={26} className="text-gray-700" />
          </button>

          {showVolumePanel && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-48">
              <div className="flex flex-col items-center gap-2">
                <input
                  ref={volumeSliderRef}
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeSliderChange}
                  onMouseUp={handleVolumeSliderEnd}
                  onTouchEnd={handleVolumeSliderEnd}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF9100]"
                  aria-label="Volume slider"
                />
              </div>

              <p className="text-center text-sm font-medium text-gray-700 mt-3">
                {volume}%
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => onAddClick("music")}
          className="hover:opacity-70 transition-opacity"
          aria-label="Add music"
        >
          <Plus size={26} className="text-gray-700" />
        </button>
      </div>
    </>
  );
};

export default PlayerControls;