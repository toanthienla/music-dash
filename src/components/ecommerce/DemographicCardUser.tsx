"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import axiosClient from "@/utils/axiosClient";
import { TEKNIX_USER_SESSION_TOKEN, API_URL } from "@/utils/constants";
import CountryMap from "./CountryMap";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import PaginationWithTextWitIcon from "../ui/pagination/PaginationWithTextWitIcon";

// ===== Type Definitions =====
interface Device {
  id: string;
  deviceId: string;
  name: string;
  type: string;
  model: string;
  macAddress: string;
  address: string;
  status: string;
  volume: number;
  muted: boolean;
  firmwareVersion: string;
  lastHeartbeat: string;
  joinedAt: string;
  enabled: boolean;
}

interface Category {
  id: number;
  name: string;
}

interface ApiDeviceData {
  device_id: string;
  device: {
    id: string;
    mac_address: string;
    thingsboard_device_id: string;
    user_id: string;
    name: string;
    type: string;
    model: string;
    firmware_version: string;
    status: string;
    last_heartbeat: string;
    last_ip_address: string;
    capabilities: {
      opus_decoder: boolean;
      sample_rates: number[];
      max_channels: number;
      buffer_size: number;
      has_eq: boolean;
      has_volume: boolean;
      hardware_volume: boolean;
    };
    current_session_id: string;
    current_position_ms: number;
    buffer_health: number;
    volume: number;
    muted: boolean;
    total_streams: number;
    total_bytes_received: number;
    created_at: string;
    updated_at: string;
  };
  joined_at: string;
  is_online: boolean;
  device_position_ms: number;
  device_buffer_health: number;
  latency_ms: number;
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
  return apiDevices.map((item: ApiDeviceData) => {
    const deviceData = item.device;

    return {
      id: deviceData.id,
      deviceId: item.device_id,
      name: deviceData.name || "Unknown Device",
      type: deviceData.type || "N/A",
      model: deviceData.model || "N/A",
      macAddress: deviceData.mac_address || "N/A",
      address: deviceData.last_ip_address || "N/A",
      status: deviceData.status || "unknown",
      volume: typeof deviceData.volume === "number"
        ? Math.min(100, Math.max(0, deviceData.volume))
        : 0,
      muted: Boolean(deviceData.muted),
      enabled: item.is_online && deviceData.status === "online",
      firmwareVersion: deviceData.firmware_version || "N/A",
      lastHeartbeat: deviceData.last_heartbeat || "N/A",
      joinedAt: item.joined_at || "N/A",
    };
  });
};

// ===== Main Component =====
export default function DemographicCard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const devicesPerPage = 5;

  // ===== Fetch Devices from Session Endpoint =====
  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!TEKNIX_USER_SESSION_TOKEN) {
          throw new Error("Session token not found. Please log in again.");
        }

        const endpoint = `${API_URL}/api/v1/sessions/${TEKNIX_USER_SESSION_TOKEN}/devices`;

        console.log(`[DemographicCard] Fetching devices from: ${endpoint}`);

        const res = await axiosClient.get<ApiResponse<ApiDeviceData[]>>(
          endpoint
        );

        console.log("[DemographicCard] API Response:", res.data);

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

        // Extract unique categories from devices
        const uniqueCategories = Array.from(
          new Set(mappedDevices.map((d) => d.type))
        ).map((type, index) => ({
          id: index,
          name: type,
        }));

        setCategories(uniqueCategories);
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch devices";

        console.error("[DemographicCard] Error:", errorMessage);
        setError(errorMessage);
        setDevices([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // ===== Filter Devices =====
  const filteredByCategory =
    selectedCategory === "All"
      ? devices
      : devices.filter(
        (device) =>
          device.type.toLowerCase() === selectedCategory.toLowerCase()
      );

  const filteredDevices = filteredByCategory.filter((device) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      device.name.toLowerCase().includes(q) ||
      device.address.toLowerCase().includes(q) ||
      device.macAddress.toLowerCase().includes(q) ||
      device.type.toLowerCase().includes(q) ||
      device.model.toLowerCase().includes(q) ||
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

  // ===== Render =====
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Loading devices...</p>
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
      {/* ===== Header ===== */}
      <div className="flex justify-between items-center w-full mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Group device
        </h3>
        <div className="flex gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 transition-colors"
          >
            <option value="All">Select group devices</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSelectedCategory("All");
              setCurrentPage(1);
              setSearchTerm("");
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 transition-colors"
          >
            See all
          </button>
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
            placeholder="Search by name, IP, MAC, type, model..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-blue-800 transition-colors"
          />
        </div>
      </div>

      {/* ===== Table ===== */}
      <div className="max-w-full overflow-x-hidden">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-xs"
              >
                Device Name
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-xs"
              >
                Type
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-xs"
              >
                Model
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-xs"
              >
                MAC Address
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-xs"
              >
                IP Address
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-xs"
              >
                Volume
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-xs"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedDevices.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 px-3 text-center text-gray-500 dark:text-gray-400"
                >
                  No devices found
                </td>
              </tr>
            ) : (
              paginatedDevices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white text-sm">
                          {device.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <span className="text-sm text-gray-800 dark:text-white">
                      {device.type}
                    </span>
                  </TableCell>

                  <TableCell className="py-4">
                    <span className="text-sm text-gray-800 dark:text-white">
                      {device.model}
                    </span>
                  </TableCell>

                  <TableCell className="py-4">
                    <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                      {device.macAddress}
                    </span>
                  </TableCell>

                  <TableCell className="py-4">
                    <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                      {device.address}
                    </span>
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${device.volume}%` }}
                        />
                      </div>
                      <span className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                        {device.volume}%
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1 ${device.enabled && device.status === "online"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                    >
                      <span
                        className="flex h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            device.enabled && device.status === "online"
                              ? "#22c55e"
                              : "#ef4444",
                        }}
                      />
                      {device.enabled && device.status === "online"
                        ? "Online"
                        : "Offline"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* ===== Pagination ===== */}
        {filteredDevices.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
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
    </div>
  );
}