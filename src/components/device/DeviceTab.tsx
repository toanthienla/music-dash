"use client";

import React, { useState, useEffect } from "react";
import PaginationWithTextWitIcon from "../ui/pagination/PaginationWithTextWitIcon";
import { AngleDownIcon, AngleUpIcon } from "@/icons";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import { API_URL } from "@/utils/constants";
import axiosClient from "@/utils/axiosClient";

type Device = {
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
};

type DeviceRegistrationForm = {
  name: string;
  pairing_code: string;
};

type ApiDeviceData = {
  id: string;
  mac_address: string;
  name: string;
  type: string;
  model: string;
  firmware_version: string;
  status: string;
  volume: number;
  muted: boolean;
  device_group_id: string;
  device_group_name: string;
  capabilities: {
    opus_decoder: boolean;
    sample_rates: number[];
    max_channels: number;
    buffer_size: number;
    has_eq: boolean;
    has_volume: boolean;
    hardware_volume: boolean;
  };
  total_streams: number;
  created_at: string;
  updated_at: string;
  last_heartbeat?: string;
  last_ip_address?: string;
};

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
  success: boolean;
};

type DeviceListResponse = {
  devices: ApiDeviceData[];
  total: number;
};

type ColumnDef = {
  label: string;
  key: keyof Device;
  sortable?: boolean;
  render?: (value: any, device: Device) => React.ReactNode;
};

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
            className="h-2 bg-brand-500 rounded-full"
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-xs text-brand-600 font-semibold whitespace-nowrap">
          {value}%
        </span>
      </div>
    ),
  },
  {
    label: "Muted",
    key: "muted",
    render: (value) => (
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {value ? "true" : "false"}
      </span>
    ),
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
      <div className="flex items-center gap-2">
        <span
          className="flex h-2 w-2 rounded-full"
          style={{
            backgroundColor:
              value && device.status === "online" ? "#3641f5" : "#d1d5db",
          }}
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {value && device.status === "online" ? "Online" : "Offline"}
        </span>
      </div>
    ),
  },
];

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
    name: "",
    pairing_code: "",
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
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim() || !formData.pairing_code.trim()) {
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
        `${API_URL}/api/v1/devices/register`,
        formData
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to register device");
      }

      setSuccess(true);
      setFormData({
        name: "",
        pairing_code: "",
      });

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
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      <aside className="fixed right-0 top-0 h-full w-full max-w-[500px] bg-white dark:bg-gray-900 p-6 overflow-y-auto rounded-l-2xl shadow-xl">
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

        <div className="mb-6 pr-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
            Add new device
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Register a new device to your account.
          </p>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white bg-white text-gray-900 transition-colors"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pairing Code
            </label>
            <input
              type="text"
              name="pairing_code"
              value={formData.pairing_code}
              onChange={handleChange}
              placeholder="e.g., 925517"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white bg-white text-gray-900 transition-colors"
              disabled={loading}
              required
            />
          </div>

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
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default function DeviceTab() {
  const [devicesData, setDevicesData] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());

  const [deviceRowsPerPage, setDeviceRowsPerPage] = useState(10);
  const [deviceCurrentPage, setDeviceCurrentPage] = useState(1);
  const [deviceSearch, setDeviceSearch] = useState<string>("");

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

  // Check if all current page devices are selected
  const allCurrentPageSelected = deviceCurrentData.length > 0 &&
    deviceCurrentData.every(device => selectedDeviceIds.has(device.id));

  const handleDeviceRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = parseInt(e.target.value, 10) || 10;
    setDeviceRowsPerPage(newVal);
    setDeviceCurrentPage(1);
  };

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSelected = new Set(selectedDeviceIds);
    if (e.target.checked) {
      // Select all devices on current page
      deviceCurrentData.forEach(device => newSelected.add(device.id));
    } else {
      // Deselect all devices on current page
      deviceCurrentData.forEach(device => newSelected.delete(device.id));
    }
    setSelectedDeviceIds(newSelected);
  };

  const handleDeviceCheckboxChange = (deviceId: string) => {
    const newSelected = new Set(selectedDeviceIds);
    if (newSelected.has(deviceId)) {
      newSelected.delete(deviceId);
    } else {
      newSelected.add(deviceId);
    }
    setSelectedDeviceIds(newSelected);
  };

  const mapApiDevicesToTableDevices = (apiDevices: ApiDeviceData[]): Device[] => {
    return apiDevices.map((deviceData: ApiDeviceData) => {
      return {
        id: deviceData.id,
        deviceId: deviceData.id,
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
        enabled: deviceData.status === "online",
        firmwareVersion: deviceData.firmware_version || "N/A",
        lastHeartbeat: deviceData.last_heartbeat || deviceData.updated_at || "N/A",
        joinedAt: deviceData.created_at || "N/A",
      };
    });
  };

  const fetchDevices = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const endpoint = `${API_URL}/api/v1/devices/music/list`;

      console.log(`[Devices] Fetching from: ${endpoint}`);

      const res = await axiosClient.get<ApiResponse<DeviceListResponse>>(endpoint);

      console.log("[Devices] API Response:", res.data);

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to fetch devices");
      }

      const deviceListResponse = res.data?.data;

      if (!deviceListResponse || !Array.isArray(deviceListResponse.devices)) {
        throw new Error("Invalid API response format: devices is not an array");
      }

      const rawDevices = deviceListResponse.devices;

      console.log(`[Devices] Fetched ${rawDevices.length} devices`);

      const mappedDevices = mapApiDevicesToTableDevices(rawDevices);

      console.log("[Devices] Mapped devices:", mappedDevices);

      setDevicesData(mappedDevices);
      setSelectedDeviceIds(new Set());
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

  useEffect(() => {
    fetchDevices();
  }, []);

  const renderDeviceRows = () => {
    if (loading) {
      return (
        <TableRow key="loading">
          <td colSpan={COLUMN_DEFINITIONS.length + 1} className="px-6 py-8">
            <div className="text-sm text-gray-500">Loading devices…</div>
          </td>
        </TableRow>
      );
    }

    if (fetchError) {
      return (
        <TableRow key="error">
          <td colSpan={COLUMN_DEFINITIONS.length + 1} className="px-6 py-8">
            <div className="text-sm text-red-600">Failed to load devices: {fetchError}</div>
          </td>
        </TableRow>
      );
    }

    if (deviceCurrentData.length === 0) {
      return (
        <TableRow key="empty">
          <td colSpan={COLUMN_DEFINITIONS.length + 1} className="px-6 py-8">
            <div className="text-sm text-gray-500">No devices found.</div>
          </td>
        </TableRow>
      );
    }

    return deviceCurrentData.map((device) => (
      <TableRow key={device.id}>
        <TableCell className="px-4 py-4 border border-gray-100 dark:border-white/[0.05]">
          <input
            type="checkbox"
            checked={selectedDeviceIds.has(device.id)}
            onChange={() => handleDeviceCheckboxChange(device.id)}
            className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
          />
        </TableCell>
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
    <div className="w-full min-h-screen">
      {/* Header */}
      <div className="mb-8">
        {/* Search and Filter Bar */}
        <div className="flex items-center justify-between gap-3">
          {/* Left Section: Show selector and Search */}
          <div className="flex items-center gap-3 flex-1">
            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
              <select
                className="py-2 pl-3 pr-8 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg appearance-none dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={deviceRowsPerPage}
                onChange={handleDeviceRowsPerPageChange}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
              </select>
              <span className="text-sm text-gray-600 dark:text-gray-400">per page</span>
            </div>

            {/* Search Input */}
            <div className="flex-1 max-w-[400px]">
              <div className="relative">
                <button className="absolute text-gray-500 -translate-y-1/2 left-3 top-1/2 dark:text-gray-400 pointer-events-none">
                  <svg
                    className="fill-current"
                    width="18"
                    height="18"
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
                  className="w-full py-2 pl-9 pr-4 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Add Device Button - Right Section */}
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
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

      {/* Table */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-4 py-3 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  >
                    <input
                      type="checkbox"
                      checked={allCurrentPageSelected}
                      onChange={handleSelectAllChange}
                      className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      title="Select all devices on this page"
                    />
                  </TableCell>
                  {COLUMN_DEFINITIONS.map((column) => (
                    <TableCell
                      key={`header-${column.key}`}
                      isHeader
                      className="px-4 py-3 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="flex items-center justify-between cursor-pointer">
                        <p className="font-medium text-gray-700 text-sm dark:text-gray-300">
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

          {!loading && filteredDevices.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 flex items-center justify-between px-4 py-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Showing {deviceStartIndex + 1} to {deviceEndIndex} of{" "}
                  {filteredDevices.length} entries
                </p>
              </div>
              <div className="flex justify-center">
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
          )}
        </div>
      </div>

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