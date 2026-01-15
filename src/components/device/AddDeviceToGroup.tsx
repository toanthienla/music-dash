"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/utils/constants";
import axiosClient from "@/utils/axiosClient";

type Device = {
  id: string;
  macAddress: string;
  name: string;
  type: string;
  status: string;
  volume: number;
  muted: boolean;
  createdAt: string;
  lastHeartbeat?: string;
};

type GroupDevice = {
  id: string;
  mac_address: string;
  name: string;
  type: string;
  status: string;
  volume: number;
  muted: boolean;
  created_at: string;
  last_heartbeat?: string;
};

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
  success: boolean;
};

type BatchResult = {
  device_id: string;
  success: boolean;
  error?: string;
};

type ApiBatchResponse = {
  code: number;
  message: string;
  data: {
    total_requested: number;
    successful: number;
    failed: number;
    results: BatchResult[];
  };
  success: boolean;
};

interface AddDeviceToGroupModalProps {
  open: boolean;
  groupId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddDeviceToGroupModal: React.FC<AddDeviceToGroupModalProps> = ({
  open,
  groupId,
  onClose,
  onSuccess,
}) => {
  const [groupDevices, setGroupDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deviceIdsInput, setDeviceIdsInput] = useState<string>("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"add" | "view">("view");

  useEffect(() => {
    if (open && groupId) {
      fetchGroupDevices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, groupId]);

  const fetchGroupDevices = async () => {
    if (!groupId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axiosClient.get<ApiResponse<GroupDevice[]>>(
        `${API_URL}/groups/${groupId}/devices`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch devices");
      }

      const devices = (response.data.data || []).map((d: GroupDevice) => ({
        id: d.id,
        macAddress: d.mac_address,
        name: d.name || "Unknown Device",
        type: d.type || "N/A",
        status: d.status || "unknown",
        volume: d.volume || 0,
        muted: d.muted || false,
        createdAt: d.created_at,
        lastHeartbeat: d.last_heartbeat,
      }));

      setGroupDevices(devices);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch devices";
      setError(errorMessage);
      console.error("[Add Device] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * New: Support adding multiple device IDs at once.
   * The input accepts a single UUID or multiple UUIDs separated by commas, newlines or whitespace.
   * We call the batch endpoint and present per-device results to the user.
   */
  const handleAddDevice = async () => {
    if (!groupId) {
      setError("Missing group id");
      return;
    }

    // parse device ids from input
    const raw = deviceIdsInput || "";
    const ids = raw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (ids.length === 0) {
      setError("Please enter at least one device ID (comma/newline/space separated)");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Call the new batch endpoint
      const response = await axiosClient.post<ApiBatchResponse>(
        `${API_URL}/groups/${groupId}/devices/batch`,
        { device_ids: ids }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to add devices");
      }

      const batch = response.data.data;
      const failed = batch.results.filter((r) => !r.success);
      const succeeded = batch.results.filter((r) => r.success);

      if (failed.length > 0) {
        const failedMsgs = failed.map((f) => `${f.device_id}: ${f.error || "failed"}`).join("; ");
        setError(`Added ${succeeded.length}. Failed ${failed.length}: ${failedMsgs}`);
      } else {
        setSuccess(`Added ${succeeded.length} device${succeeded.length > 1 ? "s" : ""} successfully.`);
        setDeviceIdsInput("");
      }

      // refresh if any success
      if (succeeded.length > 0) {
        setTimeout(() => {
          fetchGroupDevices();
          setSuccess(null);
          onSuccess?.();
          setActiveTab("view");
        }, 1000);
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to add device(s)";
      setError(errorMessage);
      console.error("[Add Device] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!groupId) return;

    if (!confirm("Are you sure you want to remove this device from the group?")) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axiosClient.delete<ApiResponse<any>>(
        `${API_URL}/groups/${groupId}/devices/${deviceId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to remove device");
      }

      setSuccess("Device removed successfully");
      setTimeout(() => {
        fetchGroupDevices();
        setSuccess(null);
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to remove device";
      setError(errorMessage);
      console.error("[Remove Device] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = groupDevices.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.macAddress.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q)
    );
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99998]">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      <aside className="fixed left-0 top-0 h-full w-full max-w-[600px] bg-white dark:bg-gray-900 p-6 overflow-y-auto rounded-r-2xl shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-6 top-6 w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
            Manage Devices
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add or remove devices from this group.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("view")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "view"
              ? "text-brand-600 border-brand-600 dark:text-brand-400 dark:border-brand-400"
              : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-300"
              }`}
          >
            Devices ({groupDevices.length})
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "add"
              ? "text-brand-600 border-brand-600 dark:text-brand-400 dark:border-brand-400"
              : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-300"
              }`}
          >
            Add Device
          </button>
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
            {success}
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

        {/* View Devices Tab */}
        {activeTab === "view" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M21 21l-4.35-4.35"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="11"
                  cy="11"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search devices..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Devices List */}
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading devices…
              </div>
            ) : filteredDevices.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto mb-2 text-gray-300"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 6V12L16 16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  {search ? "No devices found" : "No devices in this group"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDevices.map((device) => (
                  <div
                    key={device.id}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {device.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                          {device.macAddress}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {device.type}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium gap-1 ${device.status === "online"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                              }`}
                          >
                            <span
                              className="flex h-1.5 w-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  device.status === "online" ? "#10b981" : "#9ca3af",
                              }}
                            />
                            {device.status === "online" ? "Online" : "Offline"}
                          </span>
                          {device.muted && (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                              Muted
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDevice(device.id)}
                        disabled={loading}
                        className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove device"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Device Tab */}
        {activeTab === "add" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Device ID(s)
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Paste one or more device UUIDs (separated by commas, spaces or newlines). We will call the batch add endpoint.
              </p>

              <textarea
                value={deviceIdsInput}
                onChange={(e) => setDeviceIdsInput(e.target.value)}
                placeholder="550e8400-e29b-41d4-a716-446655440000
550e8400-e29b-41d4-a716-446655440001"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white text-sm min-h-[120px]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setActiveTab("view");
                  setDeviceIdsInput("");
                  setError(null);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddDevice}
                disabled={loading || !deviceIdsInput.trim()}
                className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Adding..." : "Add Device(s)"}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default AddDeviceToGroupModal;