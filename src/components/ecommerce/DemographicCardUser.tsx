"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import axiosClient from "@/utils/axiosClient";
import { API_URL, PROXY_ACCESS_TOKEN } from "@/utils/constants";
import CountryMap, { Marker } from "./CountryMap";
import PaginationWithTextWitIcon from "../ui/pagination/PaginationWithTextWitIcon";
import { ChevronDown } from "lucide-react";

// ===== Type Definitions =====
interface Device {
  id: string;
  name: string;
  type: string;
  macAddress: string;
  status: string;
  volume: number;
  muted: boolean;
  lastHeartbeat: string;
  createdAt: string;
  enabled: boolean;
  location: string;
  deviceGroupId: string | null;
}

interface Group {
  id: string;
  group_name: string;
  description?: string;
  device_count?: number;
}

interface ApiDeviceData {
  id: string;
  mac_address: string;
  name: string;
  type: string;
  status: string;
  volume: number;
  muted: boolean;
  last_heartbeat?: string;
  created_at: string;
  geo_latitude?: number;
  geo_longitude?: number;
  geo_country?: string;
  geo_region?: string;
  geo_city?: string;
  device_group_id?: string;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

// Type for WebSocket message
interface WebSocketMessage {
  event: string;
  device_id: string;
  status: string;
}

// Synthetic id for "All devices"
const ALL_DEVICES_ID = "__all__";

// ===== Helper Functions =====

/**
 * Format timestamp to readable format
 */
const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (error) {
    return "N/A";
  }
};

/**
 * Map API response to Device type and Marker type
 */
const processApiDevices = (
  apiDevices: ApiDeviceData[]
): { devices: Device[]; markers: Marker[] } => {
  const devices: Device[] = [];
  const markers: Marker[] = [];

  apiDevices.forEach((deviceData) => {
    const locationParts = [
      deviceData.geo_city,
      deviceData.geo_region,
      deviceData.geo_country,
    ].filter(Boolean);
    const location = locationParts.join(", ") || "N/A";

    devices.push({
      id: deviceData.id,
      name: deviceData.name || "Unknown Device",
      type: deviceData.type || "N/A",
      macAddress: deviceData.mac_address || "N/A",
      status: deviceData.status || "unknown",
      location,
      volume:
        typeof deviceData.volume === "number"
          ? Math.min(100, Math.max(0, deviceData.volume))
          : 0,
      muted: Boolean(deviceData.muted),
      enabled: deviceData.status === "online",
      lastHeartbeat: deviceData.last_heartbeat || "N/A",
      createdAt: deviceData.created_at || "N/A",
      deviceGroupId: deviceData.device_group_id || null,
    });

    if (deviceData.geo_latitude && deviceData.geo_longitude) {
      markers.push({
        id: deviceData.id,
        latLng: [deviceData.geo_latitude, deviceData.geo_longitude],
        name: deviceData.name,
        status: deviceData.status,
      });
    }
  });

  return { devices, markers };
};

// ===== Main Component =====
export default function DemographicCard() {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(true); // Start as true
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const devicesPerPage = 5;

  // localStorage key for persistence
  const STORAGE_KEY = "selectedGroupId";

  // ===== Close Dropdown on Outside Click =====
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowGroupDropdown(false);
      }
    };

    if (showGroupDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showGroupDropdown]);

  // ===== Fetch Groups and All Devices on Mount =====
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingGroups(true);
      setLoadingDevices(true);
      setError(null);
      try {
        // Fetch groups
        const groupsRes = await axiosClient.get<ApiResponse<Group[]>>(`${API_URL}/api/v1/groups`);
        if (!groupsRes.data.success || !Array.isArray(groupsRes.data.data)) {
          throw new Error(groupsRes.data.message || "Failed to fetch groups");
        }
        const groupsList = groupsRes.data.data;
        setGroups(groupsList);

        // Fetch all devices with location data
        const devicesRes = await axiosClient.get<ApiResponse<{ devices: ApiDeviceData[] }>>(
          `${API_URL}/api/v1/devices/music/list`
        );
        if (!devicesRes.data.success || !devicesRes.data.data.devices) {
          throw new Error(devicesRes.data.message || "Failed to fetch devices");
        }
        const { devices, markers } = processApiDevices(devicesRes.data.data.devices);
        setAllDevices(devices);
        setMarkers(markers);

        // Restore selection or set default
        const restoredId = localStorage.getItem(STORAGE_KEY);
        if (
          restoredId &&
          (restoredId === ALL_DEVICES_ID || groupsList.some((g) => g.id === restoredId))
        ) {
          setSelectedGroup(restoredId);
        } else {
          setSelectedGroup(ALL_DEVICES_ID);
        }

      } catch (err: any) {
        setError(err.message || "Failed to load initial data");
      } finally {
        setLoadingGroups(false);
        setLoadingDevices(false);
      }
    };

    fetchInitialData();
  }, []);

  // ===== WebSocket for Real-time Status Updates =====
  useEffect(() => {
    if (!PROXY_ACCESS_TOKEN) {
      console.warn("WebSocket connection skipped: PROXY_ACCESS_TOKEN is not available.");
      return;
    }

    const wsUrl = "wss://musicplayer.iotek.dev/api/v1/ws";

    // ★ Pass Authorization via subprotocol
    const socket = new WebSocket(wsUrl, [`Authorization: Bearer ${PROXY_ACCESS_TOKEN}`]);

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        if (
          message.event === "device_status_change" &&
          message.device_id &&
          message.status
        ) {
          setAllDevices((prevDevices) =>
            prevDevices.map((device) =>
              device.id === message.device_id
                ? {
                  ...device,
                  status: message.status,
                  enabled: message.status === "online",
                }
                : device
            )
          );
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", event.data, e);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
    };

    return () => {
      socket.close();
    };
  }, []);

  // ===== Filter Devices based on selected group and search term =====
  const devicesForTable = allDevices.filter((device) => {
    const inGroup =
      selectedGroup === ALL_DEVICES_ID || device.deviceGroupId === selectedGroup;
    if (!inGroup) {
      return false;
    }

    if (!searchTerm) {
      return true;
    }

    const q = searchTerm.toLowerCase();
    return (
      device.name.toLowerCase().includes(q) ||
      device.macAddress.toLowerCase().includes(q) ||
      device.type.toLowerCase().includes(q) ||
      device.status.toLowerCase().includes(q) ||
      device.location.toLowerCase().includes(q)
    );
  });


  // ===== Pagination =====
  const totalPages = Math.max(
    1,
    Math.ceil(devicesForTable.length / devicesPerPage)
  );
  const startIndex = (currentPage - 1) * devicesPerPage;
  const paginatedDevices = devicesForTable.slice(
    startIndex,
    startIndex + devicesPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleGroupSelect = (groupId: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, groupId);
    } catch (e) {
      // ignore localStorage errors
    }
    setSelectedGroup(groupId);
    setCurrentPage(1);
    setShowGroupDropdown(false);
  };

  const currentGroup =
    selectedGroup === ALL_DEVICES_ID
      ? null
      : groups.find((g) => g.id === selectedGroup);

  const currentGroupName =
    selectedGroup === ALL_DEVICES_ID
      ? "All devices"
      : currentGroup?.group_name || "Select Group";

  const totalDevicesFromGroups = groups.reduce(
    (sum, g) => sum + (g.device_count || 0),
    0
  );

  const currentGroupDeviceCount =
    selectedGroup === ALL_DEVICES_ID
      ? totalDevicesFromGroups
      : currentGroup?.device_count || 0;

  // ===== Render =====
  if (loadingGroups) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      {/* ===== Header with Dropdown on Same Row ===== */}
      <div className="flex justify-between items-center w-full mb-6 gap-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Group device
        </h3>

        {/* ===== Group Dropdown ===== */}
        <div className="w-full max-w-xs relative" ref={dropdownRef}>
          <button
            onClick={() => setShowGroupDropdown(!showGroupDropdown)}
            className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {currentGroupName}
              </p>
              {currentGroupDeviceCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentGroupDeviceCount} device(s)
                </p>
              )}
            </div>
            <ChevronDown
              size={18}
              className={`text-gray-600 dark:text-gray-400 transition-transform flex-shrink-0 ${showGroupDropdown ? "rotate-180" : ""
                }`}
            />
          </button>

          {showGroupDropdown && (
            <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-300 rounded shadow z-50 max-h-48 overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
              {/* All devices option */}
              <button
                onClick={() => handleGroupSelect(ALL_DEVICES_ID)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${selectedGroup === ALL_DEVICES_ID
                  ? "font-medium bg-gray-50 dark:bg-gray-700"
                  : ""
                  }`}
              >
                <p className="text-gray-800 dark:text-gray-200">All devices</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {totalDevicesFromGroups} device(s)
                </p>
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleGroupSelect(group.id)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${selectedGroup === group.id
                    ? "font-medium bg-gray-50 dark:bg-gray-700"
                    : ""
                    }`}
                >
                  <p className="text-gray-800 dark:text-gray-200">
                    {group.group_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {group.device_count || 0} device(s)
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== Map ===== */}
      <div className="px-4 py-6 my-6 overflow-hidden border border-gray-200 rounded-2xl bg-gray-50 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
        <div
          id="mapOne"
          className="mapOne map-btn -mx-4 sm:-mx-6 -my-6 h-[300px] w-full"
        >
          <CountryMap markers={markers} />
        </div>
      </div>

      {/* ===== Search Bar ===== */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
              fill="currentColor"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name, MAC, type, status, location..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-blue-800 transition-colors"
          />
        </div>
      </div>

      {/* ===== Loading State ===== */}
      {loadingDevices && (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Loading devices...</p>
        </div>
      )}

      {/* ===== Table ===== */}
      {!loadingDevices && (
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between cursor-pointer">
                    <p className="font-medium text-gray-700 text-sm dark:text-gray-300">
                      Device Name
                    </p>
                  </div>
                </th>
                <th className="px-4 py-3 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between cursor-pointer">
                    <p className="font-medium text-gray-700 text-sm dark:text-gray-300">
                      Location
                    </p>
                  </div>
                </th>
                <th className="px-4 py-3 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between cursor-pointer">
                    <p className="font-medium text-gray-700 text-sm dark:text-gray-300">
                      Type
                    </p>
                  </div>
                </th>
                <th className="px-4 py-3 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between cursor-pointer">
                    <p className="font-medium text-gray-700 text-sm dark:text-gray-300">
                      MAC Address
                    </p>
                  </div>
                </th>
                <th className="px-4 py-3 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between cursor-pointer">
                    <p className="font-medium text-gray-700 text-sm dark:text-gray-300">
                      Volume
                    </p>
                  </div>
                </th>
                <th className="px-4 py-3 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between cursor-pointer">
                    <p className="font-medium text-gray-700 text-sm dark:text-gray-300">
                      Muted
                    </p>
                  </div>
                </th>
                <th className="px-4 py-3 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between cursor-pointer">
                    <p className="font-medium text-gray-700 text-sm dark:text-gray-300">
                      Status
                    </p>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedDevices.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 border border-gray-100 dark:border-white/[0.05] text-center text-gray-500 dark:text-gray-400"
                  >
                    No devices found
                  </td>
                </tr>
              ) : (
                paginatedDevices.map((device) => (
                  <tr key={device.id}>
                    <td className="px-4 py-4 border border-gray-100 dark:border-white/[0.05]">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {device.name}
                      </span>
                    </td>

                    <td className="px-4 py-4 border border-gray-100 dark:border-white/[0.05]">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {device.location}
                      </span>
                    </td>

                    <td className="px-4 py-4 border border-gray-100 dark:border-white/[0.05]">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {device.type}
                      </span>
                    </td>

                    <td className="px-4 py-4 border border-gray-100 dark:border-white/[0.05]">
                      <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                        {device.macAddress}
                      </span>
                    </td>

                    <td className="px-4 py-4 border border-gray-100 dark:border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-brand-500 rounded-full transition-all"
                            style={{ width: `${device.volume}%` }}
                          />
                        </div>
                        <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold whitespace-nowrap">
                          {device.volume}%
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 border border-gray-100 dark:border-white/[0.05]">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {device.muted ? "true" : "false"}
                      </span>
                    </td>

                    <td className="px-4 py-4 border border-gray-100 dark:border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              device.enabled && device.status === "online"
                                ? "#3641f5"
                                : "#d1d5db",
                          }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {device.enabled && device.status === "online"
                            ? "Online"
                            : "Offline"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Pagination ===== */}
      {!loadingDevices && devicesForTable.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + devicesPerPage, devicesForTable.length)} of{" "}
            {devicesForTable.length} devices
          </div>
          <div className="flex justify-center">
            <PaginationWithTextWitIcon
              totalPages={totalPages}
              initialPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}