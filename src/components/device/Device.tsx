"use client";

import React, { useState } from "react";
import DeviceTab from "./DeviceTab";
import GroupTab from "./GroupTab";

export default function Device() {
  const [activeTab, setActiveTab] = useState<"devices" | "groups">("devices");

  return (
    <div className="w-full min-h-screen px-6 py-6">
      {/* Tabs */}
      <div className="mb-4">
        <div className="flex items-center justify-start">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("devices")}
              className={`pb-3 font-semibold border-b-2 transition-colors ${activeTab === "devices"
                ? "text-orange-500 border-orange-400"
                : "text-gray-400 border-transparent"
                }`}
            >
              Device
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`pb-3 font-semibold border-b-2 transition-colors ${activeTab === "groups"
                ? "text-orange-500 border-orange-400"
                : "text-gray-400 border-transparent"
                }`}
            >
              Group
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === "devices" && <DeviceTab key="devices-tab" />}
        {activeTab === "groups" && <GroupTab key="groups-tab" />}
      </div>
    </div>
  );
}