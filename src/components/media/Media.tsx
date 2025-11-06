"use client";

import React, { useState } from "react";
import MediaTab from "./MediaTab";
import PlaylistTab from "./PlaylistTab";

export default function Media() {
  const [activeTab, setActiveTab] = useState<"media" | "playlist">("media");

  return (
    <div className="w-full min-h-screen px-6 py-6">
      {/* Tabs */}
      <div className="mb-4">
        <div className="flex items-center justify-start">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("media")}
              className={`pb-3 font-semibold border-b-2 transition-colors ${activeTab === "media"
                ? "text-orange-500 border-orange-400"
                : "text-gray-400 border-transparent"
                }`}
            >
              Media
            </button>
            <button
              onClick={() => setActiveTab("playlist")}
              className={`pb-3 font-semibold border-b-2 transition-colors ${activeTab === "playlist"
                ? "text-orange-500 border-orange-400"
                : "text-gray-400 border-transparent"
                }`}
            >
              Playlist
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === "media" && <MediaTab key="media-tab" />}
        {activeTab === "playlist" && <PlaylistTab key="playlist-tab" />}
      </div>
    </div>
  );
}