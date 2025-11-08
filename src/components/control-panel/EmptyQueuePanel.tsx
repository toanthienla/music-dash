"use client";

import React from "react";
import { Plus } from "lucide-react";

interface EmptyQueuePanelProps {
  onAddMusicClick: () => void;
  onAddPlaylistClick: () => void;
  groupName: string;
}

const EmptyQueuePanel: React.FC<EmptyQueuePanelProps> = ({
  onAddMusicClick,
  onAddPlaylistClick,
  groupName,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center py-12 px-4">
      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        No songs in queue
      </h2>
      <p className="text-sm text-gray-500 mb-6 text-center">
        Add music or playlists to get started
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 w-full">
        {/* Add Music Button */}
        <button
          onClick={onAddMusicClick}
          className="w-full px-4 py-3 bg-[#FF9100] text-white font-medium rounded-lg transition-colors text-sm"
        >
          <Plus size={16} className="inline mr-2" />
          Add Music
        </button>

        {/* Add Playlist Button */}
        <button
          onClick={onAddPlaylistClick}
          className="w-full px-4 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg  transition-colors text-sm"
        >
          <Plus size={16} className="inline mr-2" />
          Add Playlist
        </button>
      </div>
    </div>
  );
};

export default EmptyQueuePanel;