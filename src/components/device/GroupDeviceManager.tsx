"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/utils/constants";
import axiosClient from "@/utils/axiosClient";

type Device = {
  id: string;
  macAddress: string;
  name: string;
  type: string;
  status: "online" | "offline";
  volume: number;
  muted: boolean;
  createdAt: string;
  lastHeartbeat?: string;
};

type AvailableDevice = {
  id: string;
  macAddress: string;
  name: string;
  type: string;
  model?: string;
  firmwareVersion?: string;
  status: "online" | "offline";
  volume: number;
  muted: boolean;
  lastHeartbeat?: string;
  lastIpAddress?: string;
  deviceGroupId?: string;
  deviceGroupName?: string;
  createdAt?: string;
  updatedAt?: string;
  totalStreams?: number;
};

type ApiDevice = {
  id: string;
  mac_address: string;
  name: string;
  type: string;
  status: "online" | "offline";
  volume: number;
  muted: boolean;
  created_at: string;
  last_heartbeat?: string;
};

type ApiAvailableDevice = {
  id: string;
  mac_address: string;
  name: string;
  type: string;
  model?: string;
  firmware_version?: string;
  status: "online" | "offline";
  volume: number;
  muted: boolean;
  last_heartbeat?: string;
  last_ip_address?: string;
  device_group_id?: string;
  device_group_name?: string;
  created_at?: string;
  updated_at?: string;
  total_streams?: number;
};

type ApiMusicListResponse = {
  code: number;
  message: string;
  data: {
    devices: ApiAvailableDevice[];
    total: number;
  };
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

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
  success: boolean;
};

interface GroupDeviceManagerProps {
  groupId: string;
  groupName?: string;
  onDeviceAdded?: () => void;
}

/**
 * Group Device Manager Component
 * Displays group devices and available devices with simple table titles
 */
export const GroupDeviceManager: React.FC<GroupDeviceManagerProps> = ({
  groupId,
  groupName,
  onDeviceAdded,
}) => {
  // Devices data
  const [devices, setDevices] = useState<Device[]>([]);
  const [allAvailableDevices, setAllAvailableDevices] = useState<AvailableDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAvailableDevices, setLoadingAvailableDevices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add device state
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [isAddingDevices, setIsAddingDevices] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Remove device state
  const [selectedDevicesToRemove, setSelectedDevicesToRemove] = useState<Set<string>>(new Set());
  const [isRemovingDevices, setIsRemovingDevices] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removeSuccess, setRemoveSuccess] = useState<string | null>(null);

  // Get available devices to add (not already in group)
  const getAvailableDevices = (): AvailableDevice[] => {
    return allAvailableDevices.filter(
      (available) => !devices.some((d) => d.id === available.id)
    );
  };

  useEffect(() => {
    fetchGroupDevices();
    fetchAvailableDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  /**
   * Maps API device data to Device type
   */
  const mapApiDevicesToDevices = (apiDevices: ApiDevice[]): Device[] => {
    return apiDevices.map((device: ApiDevice) => ({
      id: device.id,
      macAddress: device.mac_address,
      name: device.name,
      type: device.type,
      status: device.status,
      volume: device.volume,
      muted: device.muted,
      createdAt: device.created_at,
      lastHeartbeat: device.last_heartbeat,
    }));
  };

  /**
   * Maps API available device data to AvailableDevice type
   */
  const mapApiAvailableDevices = (apiDevices: ApiAvailableDevice[]): AvailableDevice[] => {
    return apiDevices.map((device: ApiAvailableDevice) => ({
      id: device.id,
      macAddress: device.mac_address,
      name: device.name,
      type: device.type,
      model: device.model,
      firmwareVersion: device.firmware_version,
      status: device.status,
      volume: device.volume,
      muted: device.muted,
      lastHeartbeat: device.last_heartbeat,
      lastIpAddress: device.last_ip_address,
      deviceGroupId: device.device_group_id,
      deviceGroupName: device.device_group_name,
      createdAt: device.created_at,
      updatedAt: device.updated_at,
      totalStreams: device.total_streams,
    }));
  };

  /**
   * Fetch devices in the group
   */
  const fetchGroupDevices = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosClient.get<ApiResponse<ApiDevice[]>>(
        `${API_URL}/api/v1/groups/${groupId}/devices`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch devices");
      }

      const mappedDevices = mapApiDevicesToDevices(response.data.data || []);
      setDevices(mappedDevices);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch devices";
      setError(errorMessage);
      console.error("[Group Devices] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch available devices from music list
   */
  const fetchAvailableDevices = async () => {
    setLoadingAvailableDevices(true);

    try {
      const response = await axiosClient.get<ApiMusicListResponse>(
        `${API_URL}/api/v1/devices/music/list`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch available devices");
      }

      const devicesList = response.data.data?.devices || [];
      const mappedAvailableDevices = mapApiAvailableDevices(devicesList);
      setAllAvailableDevices(mappedAvailableDevices);
    } catch (err: any) {
      console.error("[Available Devices] Error:", err);
    } finally {
      setLoadingAvailableDevices(false);
    }
  };

  /**
   * Toggle device selection for removal
   */
  const toggleDeviceRemovalSelection = (deviceId: string) => {
    setSelectedDevicesToRemove((prev) => {
      const updated = new Set(prev);
      if (updated.has(deviceId)) {
        updated.delete(deviceId);
      } else {
        updated.add(deviceId);
      }
      return updated;
    });
  };

  /**
   * Toggle all devices selection for removal
   */
  const toggleAllRemovalSelection = () => {
    if (selectedDevicesToRemove.size === devices.length && devices.length > 0) {
      setSelectedDevicesToRemove(new Set());
    } else {
      setSelectedDevicesToRemove(new Set(devices.map((d) => d.id)));
    }
  };

  /**
   * Remove selected devices from group (uses new batch endpoint)
   * Handles batch response and displays per-device errors if present.
   */
  const handleRemoveSelectedDevices = async () => {
    if (selectedDevicesToRemove.size === 0) {
      setRemoveError("Please select devices to remove");
      return;
    }

    if (!confirm(`Are you sure you want to remove ${selectedDevicesToRemove.size} device${selectedDevicesToRemove.size > 1 ? "s" : ""} from the group?`)) {
      return;
    }

    setIsRemovingDevices(true);
    setRemoveError(null);
    setRemoveSuccess(null);

    const deviceIds = Array.from(selectedDevicesToRemove);

    try {
      // axios delete with body: axios.delete(url, { data: payload })
      const response = await axiosClient.delete<ApiBatchResponse>(
        `${API_URL}/api/v1/groups/${groupId}/devices/batch`,
        { data: { device_ids: deviceIds } }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to remove devices");
      }

      const batch = response.data.data;
      // Build user-friendly messages
      const failed = batch.results.filter((r) => !r.success);
      const succeeded = batch.results.filter((r) => r.success);

      if (failed.length > 0) {
        const failedMsgs = failed.map((f) => `${f.device_id}: ${f.error || "failed"}`).join("; ");
        setRemoveError(`Removed ${succeeded.length}. Failed ${failed.length}: ${failedMsgs}`);
      } else {
        setRemoveSuccess(`Removed ${succeeded.length} device${succeeded.length > 1 ? "s" : ""} successfully.`);
      }

      // refresh lists if any success
      if (succeeded.length > 0) {
        setSelectedDevicesToRemove(new Set());
        setTimeout(() => {
          fetchGroupDevices();
          fetchAvailableDevices();
          setRemoveSuccess(null);
          if (onDeviceAdded) onDeviceAdded();
        }, 900);
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to remove devices";
      setRemoveError(errorMessage);
      console.error("[Remove Devices] Error:", err);
    } finally {
      setIsRemovingDevices(false);
    }
  };

  /**
   * Toggle device selection for adding
   */
  const toggleDeviceSelection = (deviceId: string) => {
    setSelectedDevices((prev) => {
      const updated = new Set(prev);
      if (updated.has(deviceId)) {
        updated.delete(deviceId);
      } else {
        updated.add(deviceId);
      }
      return updated;
    });
  };

  /**
   * Toggle all devices selection for adding
   */
  const toggleAllSelection = () => {
    const availableDevices = getAvailableDevices();
    if (selectedDevices.size === availableDevices.length && availableDevices.length > 0) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(availableDevices.map((d) => d.id)));
    }
  };

  /**
   * Add selected devices to group (uses new batch endpoint)
   * Handles partial successes and shows per-device errors returned by API.
   */
  const handleAddSelectedDevices = async () => {
    if (selectedDevices.size === 0) {
      setAddError("Please select devices to add");
      return;
    }

    setIsAddingDevices(true);
    setAddError(null);
    setAddSuccess(null);

    const deviceIds = Array.from(selectedDevices);

    try {
      const response = await axiosClient.post<ApiBatchResponse>(
        `${API_URL}/api/v1/groups/${groupId}/devices/batch`,
        { device_ids: deviceIds }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to add devices");
      }

      const batch = response.data.data;
      const failed = batch.results.filter((r) => !r.success);
      const succeeded = batch.results.filter((r) => r.success);

      if (failed.length > 0) {
        // Map device id -> display name if available
        const idToName = new Map(allAvailableDevices.map((d) => [d.id, d.name]));
        const failedMsgs = failed
          .map((f) => `${idToName.get(f.device_id) || f.device_id}: ${f.error || "failed"}`)
          .join("; ");
        setAddError(`Added ${succeeded.length}. Failed ${failed.length}: ${failedMsgs}`);
      } else {
        setAddSuccess(`Added ${succeeded.length} device${succeeded.length > 1 ? "s" : ""} successfully.`);
      }

      // refresh lists if any success
      if (succeeded.length > 0) {
        setSelectedDevices(new Set());
        setTimeout(() => {
          fetchGroupDevices();
          fetchAvailableDevices();
          setAddSuccess(null);
          if (onDeviceAdded) onDeviceAdded();
        }, 900);
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add devices";
      setAddError(errorMessage);
      console.error("[Add Devices] Error:", err);
    } finally {
      setIsAddingDevices(false);
    }
  };

  if (loading && loadingAvailableDevices) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:bg-gray-800 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Loading devices…
        </div>
      </div>
    );
  }

  const availableDevices = getAvailableDevices();

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 dark:bg-brand-900/20 dark:border-brand-800">
          <div className="flex items-start gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0 mt-0.5 text-brand-600 dark:text-brand-400"
            >
              <path
                d="M12 9v2m0 4v2m-9-15h18a2 2 0 012 2v18a2 2 0 01-2 2H3a2 2 0 01-2-2V2a2 2 0 012-2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                Failed to load devices
              </h4>
              <p className="text-sm text-brand-600 dark:text-brand-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Devices in Group Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Devices in Group
        </h3>

        {loading ? (
          <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
            Loading devices…
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-600 dark:text-gray-400">
            No devices in group
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedDevicesToRemove.size === devices.length &&
                          devices.length > 0
                        }
                        onChange={toggleAllRemovalSelection}
                        className="rounded border-brand-300 text-brand-600 focus:ring-2 focus:ring-brand-500 dark:border-brand-600 dark:bg-brand-900 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Device Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      MAC Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Muted
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => {
                    const isSelected = selectedDevicesToRemove.has(device.id);
                    return (
                      <tr
                        key={device.id}
                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isSelected ? "bg-brand-50 dark:bg-brand-900/10" : ""
                          }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleDeviceRemovalSelection(device.id)
                            }
                            className="rounded border-brand-300 text-brand-600 focus:ring-2 focus:ring-brand-500 dark:border-brand-600 dark:bg-brand-900 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {device.name}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {device.type}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {device.macAddress}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-brand-500 to-brand-600"
                                style={{
                                  width: `${Math.min(100, Math.max(0, device.volume))}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300 w-8">
                              {device.volume}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {device.muted ? "Yes" : "No"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="flex h-2 w-2 rounded-full"
                              style={{
                                backgroundColor:
                                  device.status === "online" ? "#3641f5" : "#d1d5db",
                              }}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {device.status === "online" ? "Online" : "Offline"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Action Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRemoveSelectedDevices}
                disabled={
                  isRemovingDevices ||
                  selectedDevicesToRemove.size === 0
                }
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${selectedDevicesToRemove.size === 0
                  ? "bg-brand-300 cursor-not-allowed opacity-50"
                  : "bg-brand-600 hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500"
                  } ${isRemovingDevices ? "opacity-50" : ""}`}
              >
                {isRemovingDevices ? "Removing..." : "Remove"}
              </button>
            </div>

            {/* Messages */}
            {removeError && (
              <div className="p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200 rounded-lg text-sm flex items-center gap-2 border border-brand-300 dark:border-brand-700">
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
                {removeError}
              </div>
            )}

            {removeSuccess && (
              <div className="p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200 rounded-lg text-sm flex items-center gap-2 border border-brand-300 dark:border-brand-700">
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
                {removeSuccess}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Available Devices Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Available Devices
        </h3>

        {loadingAvailableDevices ? (
          <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
            Loading devices…
          </div>
        ) : availableDevices.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-600 dark:text-gray-400">
            No devices available
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedDevices.size === availableDevices.length &&
                          availableDevices.length > 0
                        }
                        onChange={toggleAllSelection}
                        className="rounded border-brand-300 text-brand-600 focus:ring-2 focus:ring-brand-500 dark:border-brand-600 dark:bg-brand-900 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Device Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      MAC Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Muted
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {availableDevices.map((device) => {
                    const isSelected = selectedDevices.has(device.id);
                    return (
                      <tr
                        key={device.id}
                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isSelected ? "bg-brand-50 dark:bg-brand-900/10" : ""
                          }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleDeviceSelection(device.id)
                            }
                            className="rounded border-brand-300 text-brand-600 focus:ring-2 focus:ring-brand-500 dark:border-brand-600 dark:bg-brand-900 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {device.name}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {device.type}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {device.macAddress}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-brand-500 to-brand-600"
                                style={{
                                  width: `${Math.min(100, Math.max(0, device.volume))}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300 w-8">
                              {device.volume}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {device.muted ? "Yes" : "No"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="flex h-2 w-2 rounded-full"
                              style={{
                                backgroundColor:
                                  device.status === "online" ? "#3641f5" : "#d1d5db",
                              }}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {device.status === "online" ? "Online" : "Offline"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Action Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddSelectedDevices}
                disabled={
                  isAddingDevices ||
                  selectedDevices.size === 0
                }
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${selectedDevices.size === 0
                  ? "bg-brand-300 cursor-not-allowed opacity-50"
                  : "bg-brand-600 hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500"
                  } ${isAddingDevices ? "opacity-50" : ""}`}
              >
                {isAddingDevices ? "Adding..." : "Add"}
              </button>
            </div>

            {/* Messages */}
            {addError && (
              <div className="p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200 rounded-lg text-sm flex items-center gap-2 border border-brand-300 dark:border-brand-700">
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
                {addError}
              </div>
            )}

            {addSuccess && (
              <div className="p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200 rounded-lg text-sm flex items-center gap-2 border border-brand-300 dark:border-brand-700">
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
                {addSuccess}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDeviceManager;