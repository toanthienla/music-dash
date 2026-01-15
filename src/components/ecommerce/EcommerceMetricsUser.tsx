"use client";
import React, { useEffect, useState } from "react";
import axiosClient from "@/utils/axiosClient";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, Clock, Tick } from "@/icons";
import { API_URL } from "@/utils/constants";

interface DeviceStatistics {
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  total_runtime_seconds: number;
  total_runtime_formatted: string;
  max_runtime_seconds: number;
  max_runtime_formatted: string;
  average_runtime_seconds: number;
  average_runtime_formatted: string;
}

interface ApiResponse {
  code: number;
  message: string;
  data: DeviceStatistics;
  success: boolean;
}

export const EcommerceMetrics = () => {
  const [stats, setStats] = useState<DeviceStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axiosClient.get<ApiResponse>(
          `${API_URL}/devices/statistics`,
          {
            withCredentials: true,
          }
        );

        console.log("Device statistics:", res.data.data);

        if (res.data.success && res.data.data) {
          setStats(res.data.data);
        } else {
          setError("Failed to fetch device statistics");
        }
      } catch (err: any) {
        console.error("Failed to fetch device stats:", err.message);
        setError(err.message || "An error occurred while fetching statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <p className="text-gray-500 dark:text-gray-400">Loading stats...</p>;
  }

  if (error) {
    return <p className="text-red-500 dark:text-red-400">Error: {error}</p>;
  }

  if (!stats) {
    return <p className="text-gray-500 dark:text-gray-400">No statistics available</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric 1: Devices Online --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <Tick className="text-gray-800 w-12 h-12 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total number of devices online
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {`${stats.online_devices}/${stats.total_devices}`}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {stats.offline_devices} offline
            </p>
          </div>
        </div>
      </div>

      {/* <!-- Metric 2: Total Runtime --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <Clock className="text-gray-800 w-12 h-12 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total current continuous runtime
            </span>

            <div className="mt-2 flex items-center gap-2">
              <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90 whitespace-nowrap">
                {stats.total_runtime_formatted}
              </h4>

              <Badge color="info">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="text-xs">
                    Max: {stats.max_runtime_formatted}
                  </span>
                </div>
              </Badge>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Avg: {stats.average_runtime_formatted}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};