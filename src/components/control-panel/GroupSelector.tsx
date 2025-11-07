"use client";

import React, { useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

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

interface GroupSelectorProps {
  groups: Group[];
  selectedGroup: Group | null;
  showGroupDropdown: boolean;
  onShowDropdownChange: (show: boolean) => void;
  onGroupSelect: (group: Group) => void;
}

const GroupSelector: React.FC<GroupSelectorProps> = ({
  groups,
  selectedGroup,
  showGroupDropdown,
  onShowDropdownChange,
  onGroupSelect,
}) => {
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onShowDropdownChange(false);
      }
    };

    if (showGroupDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showGroupDropdown, onShowDropdownChange]);

  return (
    <div className="mb-4 relative" ref={dropdownRef}>
      <button
        onClick={() => onShowDropdownChange(!showGroupDropdown)}
        className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
      >
        <div className="text-left">
          <p className="text-sm font-medium text-gray-800">
            {selectedGroup?.group_name || "Select Group"}
          </p>
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-600 transition-transform ${showGroupDropdown ? "rotate-180" : ""
            }`}
        />
      </button>

      {showGroupDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow z-50 max-h-48 overflow-y-auto">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => {
                onGroupSelect(group);
                onShowDropdownChange(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${selectedGroup?.id === group.id ? "font-medium" : ""
                }`}
            >
              <p className="text-gray-800">{group.group_name}</p>
              <p className="text-xs text-gray-500">{group.device_count} device(s)</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupSelector;