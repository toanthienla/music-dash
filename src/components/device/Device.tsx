"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import PaginationWithTextWitIcon from "../ui/pagination/PaginationWithTextWitIcon";
import { AngleDownIcon, AngleUpIcon, PencilIcon } from "@/icons";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Switch from "../form/switch/Switch";
import { TEKNIX_USER_SESSION_TOKEN, MOCK_API_URL } from "@/utils/constants";
import axiosClient from "@/utils/axiosClient";

type Device = {
  id: string;
  deviceId: string;
  name: string;
  type: string;
  model: string;
  macAddress: string;
  address: string; // last_ip_address
  status: string;
  volume: number;
  muted: boolean;
  firmwareVersion: string;
  lastHeartbeat: string;
  joinedAt: string;
  enabled: boolean; // is_online
};

// Device registration form data
type DeviceRegistrationForm = {
  device_id: string;
  name: string;
  type: string;
  model: string;
  mac_address: string;
  firmware_version: string;
};

// API response types
type ApiDeviceData = {
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
};

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
  success: boolean;
};

// Column definition for table
type ColumnDef = {
  label: string;
  key: keyof Device;
  sortable?: boolean;
  render?: (value: any, device: Device) => React.ReactNode;
};

/**
 * Column definitions for device table
 * Includes: Device Name, Type, Model, MAC, IP, Volume, Muted, Firmware, Heartbeat, Joined At, Status
 */
const COLUMN_DEFINITIONS: ColumnDef[] = [
  {
    label: "Device Name",
    key: "name",
    render: (value) => <span className="text-sm">{value}</span>,
  },
  {
    label: "Type",
    key: "type",
    render: (value) => <span className="text-sm">{value}</span>,
  },
  {
    label: "Model",
    key: "model",
    render: (value) => <span className="text-sm">{value}</span>,
  },
  {
    label: "MAC Address",
    key: "macAddress",
    render: (value) => <span className="font-mono text-xs">{value}</span>,
  },
  {
    label: "IP Address",
    key: "address",
    render: (value) => <span className="font-mono text-sm">{value}</span>,
  },
  {
    label: "Volume",
    key: "volume",
    render: (value) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-blue-500 rounded-full"
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">{value}%</span>
      </div>
    ),
  },
  {
    label: "Muted",
    key: "muted",
    render: (value) => <span className="text-sm">{value ? "true" : "false"}</span>,
  },
  {
    label: "Firmware Version",
    key: "firmwareVersion",
    render: (value) => <span className="text-sm">{value}</span>,
  },
  {
    label: "Last Heartbeat",
    key: "lastHeartbeat",
    render: (value) => (
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {formatDateTime(value)}
      </span>
    ),
  },
  {
    label: "Joined At",
    key: "joinedAt",
    render: (value) => (
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {formatDateTime(value)}
      </span>
    ),
  },
  {
    label: "Status",
    key: "enabled",
    render: (value, device) => (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1 ${value && device.status === "online"
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
      >
        <span
          className="flex h-2 w-2 rounded-full"
          style={{
            backgroundColor: value && device.status === "online" ? "#22c55e" : "#ef4444",
          }}
        />
        {value && device.status === "online" ? "Online" : "Offline"}
      </span>
    ),
  },
];

/**
 * Format timestamp to readable format
 * @param dateString - ISO date string
 * @returns Formatted date time string
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
 * RegisterDeviceModal Component
 * Side panel modal for registering a new device
 * Design inspired by AddGroupForm
 */
interface RegisterDeviceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RegisterDeviceModal: React.FC<RegisterDeviceModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<DeviceRegistrationForm>({
    device_id: "",
    name: "",
    type: "",
    model: "",
    mac_address: "",
    firmware_version: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (
      !formData.device_id.trim() ||
      !formData.name.trim() ||
      !formData.type.trim() ||
      !formData.model.trim() ||
      !formData.mac_address.trim() ||
      !formData.firmware_version.trim()
    ) {
      setError("All fields are required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axiosClient.post<ApiResponse<any>>(
        `${MOCK_API_URL}/api/v1/devices/register`,
        formData
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to register device");
      }

      setSuccess(true);
      setFormData({
        device_id: "",
        name: "",
        type: "",
        model: "",
        mac_address: "",
        firmware_version: "",
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        onSuccess();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to register device";
      setError(errorMessage);
      console.error("[Register Device] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Side Panel */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-[500px] bg-white dark:bg-gray-900 p-6 overflow-y-auto rounded-l-2xl shadow-xl">
        {/* Close Button - Top Right */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Close"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6 pr-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
            Add new device
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Register a new device to your account.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg text-sm flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Device registered successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Device ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Device ID
            </label>
            <input
              type="text"
              name="device_id"
              value={formData.device_id}
              onChange={handleChange}
              placeholder="Enter unique device ID"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white bg-white text-gray-900 transition-colors"
              disabled={loading}
              required
            />
          </div>

          {/* Device Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Device Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Living Room Speaker"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white bg-white text-gray-900 transition-colors"
              disabled={loading}
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <input
              type="text"
              name="type"
              value={formData.type}
              onChange={handleChange}
              placeholder="e.g., Speaker, Microphone"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white bg-white text-gray-900 transition-colors"
              disabled={loading}
              required
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Model
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="e.g., Model X1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white bg-white text-gray-900 transition-colors"
              disabled={loading}
              required
            />
          </div>

          {/* MAC Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              MAC Address
            </label>
            <input
              type="text"
              name="mac_address"
              value={formData.mac_address}
              onChange={handleChange}
              placeholder="e.g., 02:5A:F3:B9:E1:C4"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white bg-white text-gray-900 transition-colors"
              disabled={loading}
              required
            />
          </div>

          {/* Firmware Version */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Firmware Version
            </label>
            <input
              type="text"
              name="firmware_version"
              value={formData.firmware_version}
              onChange={handleChange}
              placeholder="e.g., 1.0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white bg-white text-gray-900 transition-colors"
              disabled={loading}
              required
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading ? "Registering..." : "Add Device"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
};

export default function BasicTableOne() {
  // Devices data (fetched from API)
  const [devicesData, setDevicesData] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // pagination for devices table
  const [deviceRowsPerPage, setDeviceRowsPerPage] = useState(10);
  const [deviceCurrentPage, setDeviceCurrentPage] = useState(1);
  const [deviceSearch, setDeviceSearch] = useState<string>("");

  // filter devices based on search
  const filteredDevices = devicesData.filter((d) => {
    if (!deviceSearch) return true;
    const q = deviceSearch.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.address.toLowerCase().includes(q) ||
      d.macAddress.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q) ||
      d.model.toLowerCase().includes(q) ||
      d.status.toLowerCase().includes(q)
    );
  });

  const deviceTotalPages = Math.max(1, Math.ceil(filteredDevices.length / deviceRowsPerPage));
  const deviceStartIndex = (deviceCurrentPage - 1) * deviceRowsPerPage;
  const deviceEndIndex = Math.min(deviceStartIndex + deviceRowsPerPage, filteredDevices.length);
  const deviceCurrentData = filteredDevices.slice(deviceStartIndex, deviceEndIndex);

  const handleDeviceRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = parseInt(e.target.value, 10) || 10;
    setDeviceRowsPerPage(newVal);
    setDeviceCurrentPage(1);
  };

  /**
   * Maps API response data to Device type for display
   * Transforms the nested API structure to flat Device objects
   * @param apiDevices - Raw devices from API
   * @returns Mapped Device array for table display
   */
  const mapApiDevicesToTableDevices = (apiDevices: ApiDeviceData[]): Device[] => {
    return apiDevices.map((item: ApiDeviceData) => {
      const deviceData = item.device;

      return {
        // UUID from API
        id: deviceData.id,
        deviceId: item.device_id,

        // Device details
        name: deviceData.name || "Unknown Device",
        type: deviceData.type || "N/A",
        model: deviceData.model || "N/A",

        // Network info
        macAddress: deviceData.mac_address || "N/A",
        address: deviceData.last_ip_address || "N/A",

        // Status and connectivity
        status: deviceData.status || "unknown",
        volume: typeof deviceData.volume === "number"
          ? Math.min(100, Math.max(0, deviceData.volume))
          : 0,
        muted: Boolean(deviceData.muted),
        enabled: item.is_online && deviceData.status === "online",

        // Firmware and versions
        firmwareVersion: deviceData.firmware_version || "N/A",

        // Timestamps
        lastHeartbeat: deviceData.last_heartbeat || "N/A",
        joinedAt: item.joined_at || "N/A",
      };
    });
  };

  /**
   * Fetch devices from session-specific API endpoint
   * Uses axiosClient with session authentication
   * Endpoint: ${MOCK_API_URL}/api/v1/sessions/{sessionId}/devices
   */
  const fetchDevices = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // Get session ID/token from constants
      const sessionToken = TEKNIX_USER_SESSION_TOKEN;

      if (!sessionToken) {
        throw new Error("Session token not found. Please log in again.");
      }

      // Construct API endpoint
      const endpoint = `${MOCK_API_URL}/api/v1/sessions/${sessionToken}/devices`;

      console.log(`[Devices] Fetching from: ${endpoint}`);

      // Make request using axiosClient
      const res = await axiosClient.get<ApiResponse<ApiDeviceData[]>>(endpoint);

      console.log("[Devices] API Response:", res.data);

      // Validate response
      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to fetch devices");
      }

      // Extract and validate data array
      const rawDevices = res.data?.data || [];

      if (!Array.isArray(rawDevices)) {
        throw new Error("Invalid API response format: data is not an array");
      }

      console.log(`[Devices] Fetched ${rawDevices.length} devices`);

      // Map API response to table format
      const mappedDevices = mapApiDevicesToTableDevices(rawDevices);

      console.log("[Devices] Mapped devices:", mappedDevices);

      setDevicesData(mappedDevices);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch devices";

      console.error("[Devices] Error:", errorMessage);
      console.error("[Devices] Full error:", error);

      setDevicesData([]);
      setFetchError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch devices on component mount
  useEffect(() => {
    fetchDevices();
  }, []);

  /**
   * Render device table rows
   * Handles loading, error, and empty states
   */
  const renderDeviceRows = () => {
    if (loading) {
      return (
        <TableRow key="loading">
          <td colSpan={COLUMN_DEFINITIONS.length} className="py-6 text-center">
            Loading devices...
          </td>
        </TableRow>
      );
    }

    if (fetchError) {
      return (
        <TableRow key="error">
          <td colSpan={COLUMN_DEFINITIONS.length} className="py-6 text-center text-red-500">
            Error: {fetchError}
            <button
              onClick={fetchDevices}
              className="ml-2 underline hover:text-red-700"
            >
              Retry
            </button>
          </td>
        </TableRow>
      );
    }

    if (deviceCurrentData.length === 0) {
      return (
        <TableRow key="empty">
          <td colSpan={COLUMN_DEFINITIONS.length} className="py-6 text-center">
            No devices found
          </td>
        </TableRow>
      );
    }

    return deviceCurrentData.map((device) => (
      <TableRow key={device.id}>
        {/* Data columns */}
        {COLUMN_DEFINITIONS.map((column) => (
          <TableCell
            key={`${device.id}-${column.key}`}
            className="px-4 py-4 border border-gray-100 dark:border-white/[0.05]"
          >
            {column.render
              ? column.render(device[column.key], device)
              : String(device[column.key] || "N/A")}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <div className="w-full min-h-screen px-6 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Devices
          </h1>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Add Device
          </button>
        </div>
      </div>

      {/* ========= DEVICE TABLE ========= */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center gap-3 w-full p-5">
            <span className="text-gray-500 dark:text-gray-400">Show</span>
            <div className="relative z-20 bg-transparent">
              <select
                className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                value={deviceRowsPerPage}
                onChange={handleDeviceRowsPerPageChange}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
              </select>
              <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
                <svg
                  className="stroke-current"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">entries</span>
            <div className="ml-auto w-full max-w-[520px] flex items-center gap-3">
              <div className="relative flex-1">
                <button className="absolute text-gray-500 -translate-y-1/2 left-4 top-1/2 dark:text-gray-400">
                  <svg
                    className="fill-current"
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
                </button>

                <input
                  type="text"
                  value={deviceSearch}
                  onChange={(e) => {
                    setDeviceSearch(e.target.value);
                    setDeviceCurrentPage(1);
                  }}
                  placeholder="Search by name, IP, MAC, type, model..."
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>
          </div>

          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Column headers from definitions */}
                  {COLUMN_DEFINITIONS.map((column) => (
                    <TableCell
                      key={`header-${column.key}`}
                      isHeader
                      className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                    >
                      <div className="flex items-center justify-between cursor-pointer">
                        <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                          {column.label}
                        </p>
                        {column.sortable && (
                          <button className="flex flex-col gap-0.5">
                            <AngleUpIcon className="text-gray-300 dark:text-gray-700" />
                            <AngleDownIcon className="text-gray-300 dark:text-gray-700" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>{renderDeviceRows()}</TableBody>
            </Table>
          </div>

          <div className="border-t border-gray-100 flex items-center justify-between">
            <div className="pb-3 xl:pb-0">
              <p className="pb-3 pl-[10px] text-sm font-medium text-center text-gray-500 border-b border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
                Showing {deviceStartIndex + 1} to {deviceEndIndex} of{" "}
                {filteredDevices.length} entries
              </p>
            </div>
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 mt-6 flex justify-center">
              <PaginationWithTextWitIcon
                totalPages={deviceTotalPages}
                initialPage={deviceCurrentPage}
                onPageChange={(newPage) => {
                  if (newPage >= 1 && newPage <= deviceTotalPages) {
                    setDeviceCurrentPage(newPage);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========= REGISTER DEVICE MODAL ========= */}
      <RegisterDeviceModal
        open={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => {
          setDeviceCurrentPage(1);
          fetchDevices();
        }}
      />
    </div>
  );
}