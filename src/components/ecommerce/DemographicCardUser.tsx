"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import axiosClient from "@/utils/axiosClient";
import { API_URL } from "@/utils/constants";
import CountryMap from "./CountryMap";
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
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

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
 * Map API response to Device type
 */
const mapApiDevicesToTableDevices = (apiDevices: ApiDeviceData[]): Device[] => {
  return apiDevices.map((deviceData: ApiDeviceData) => {
    return {
      id: deviceData.id,
      name: deviceData.name || "Unknown Device",
      type: deviceData.type || "N/A",
      macAddress: deviceData.mac_address || "N/A",
      status: deviceData.status || "unknown",
      volume: typeof deviceData.volume === "number"
        ? Math.min(100, Math.max(0, deviceData.volume))
        : 0,
      muted: Boolean(deviceData.muted),
      enabled: deviceData.status === "online",
      lastHeartbeat: deviceData.last_heartbeat || "N/A",
      createdAt: deviceData.created_at || "N/A",
    };
  });
};

// ===== Main Component =====
export default function DemographicCard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const devicesPerPage = 5;

  // ===== Close Dropdown on Outside Click =====
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  // ===== Fetch Groups =====
  useEffect(() => {
    const fetchGroups = async () => {
      setLoadingGroups(true);
      setError(null);
      try {
        const endpoint = `${API_URL}/api/v1/groups/list`;

        console.log(`[DemographicCard] Fetching groups from: ${endpoint}`);

        const res = await axiosClient.get<ApiResponse<Group[]>>(endpoint);

        console.log("[DemographicCard] Groups API Response:", res.data);

        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch groups");
        }

        const groupsList = res.data?.data || [];

        if (!Array.isArray(groupsList) || groupsList.length === 0) {
          console.warn("[DemographicCard] No groups found");
          setGroups([]);
          setLoadingGroups(false);
          return;
        }

        console.log(`[DemographicCard] Fetched ${groupsList.length} groups`, groupsList);
        setGroups(groupsList);

        // Auto-select first group if available
        if (groupsList.length > 0) {
          setSelectedGroup(groupsList[0].id);
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch groups";

        console.error("[DemographicCard] Error fetching groups:", errorMessage, err);
        setGroups([]);
        setError(errorMessage);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, []);

  // ===== Fetch Devices from Selected Group =====
  useEffect(() => {
    if (!selectedGroup) {
      setDevices([]);
      return;
    }

    const fetchDevices = async () => {
      setLoadingDevices(true);
      setError(null);
      try {
        const endpoint = `${API_URL}/api/v1/groups/${selectedGroup}/devices`;

        console.log(`[DemographicCard] Fetching devices from: ${endpoint}`);

        const res = await axiosClient.get<ApiResponse<ApiDeviceData[]>>(
          endpoint
        );

        console.log("[DemographicCard] Devices API Response:", res.data);

        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch devices");
        }

        const rawDevices = res.data?.data || [];

        if (!Array.isArray(rawDevices)) {
          throw new Error("Invalid API response format: data is not an array");
        }

        console.log(
          `[DemographicCard] Fetched ${rawDevices.length} devices`
        );

        const mappedDevices = mapApiDevicesToTableDevices(rawDevices);
        setDevices(mappedDevices);
        setCurrentPage(1);
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch devices";

        console.error("[DemographicCard] Error:", errorMessage);
        setError(errorMessage);
        setDevices([]);
      } finally {
        setLoadingDevices(false);
      }
    };

    fetchDevices();
  }, [selectedGroup]);

  // ===== Filter Devices =====
  const filteredDevices = devices.filter((device) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      device.name.toLowerCase().includes(q) ||
      device.macAddress.toLowerCase().includes(q) ||
      device.type.toLowerCase().includes(q) ||
      device.status.toLowerCase().includes(q)
    );
  });

  // ===== Pagination =====
  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / devicesPerPage));
  const startIndex = (currentPage - 1) * devicesPerPage;
  const paginatedDevices = filteredDevices.slice(
    startIndex,
    startIndex + devicesPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroup(groupId);
    setCurrentPage(1);
    setShowGroupDropdown(false);
  };

  const currentGroupName = groups.find((g) => g.id === selectedGroup)?.group_name || "Select Group";
  const currentGroupDeviceCount = groups.find((g) => g.id === selectedGroup)?.device_count || 0;

  // ===== Render =====
  if (loadingGroups) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No groups available</p>
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

  if (error && !selectedGroup) {
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
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleGroupSelect(group.id)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${selectedGroup === group.id
                    ? "font-medium bg-gray-50 dark:bg-gray-700"
                    : ""
                    }`}
                >
                  <p className="text-gray-800 dark:text-gray-200">{group.group_name}</p>
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
          className="mapOne map-btn -mx-4 -my-6 h-[212px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]"
        >
          <CountryMap />
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
            placeholder="Search by name, MAC, type, status..."
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
                    colSpan={6}
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
      {!loadingDevices && filteredDevices.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + devicesPerPage, filteredDevices.length)} of{" "}
            {filteredDevices.length} devices
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