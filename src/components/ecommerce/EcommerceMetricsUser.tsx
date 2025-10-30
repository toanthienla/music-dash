"use client";
import React, { useEffect, useState } from "react";
import axiosClient from "@/utils/axiosClient";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, Clock, Tick } from "@/icons";
import { MOCK_API_URL } from "@/utils/constants";

interface DeviceStats {
  onlineDevices: number;
  totalDevices: number;
  runtime: string;
  changePercent: number;
}

export const EcommerceMetrics = () => {
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosClient.get(`${MOCK_API_URL}/api/v1/devices/status`, {
          withCredentials: true,
        });
        console.log("Device stats:", res.data.data);
        setStats(res.data.data[0]);
      } catch (err: any) {
        console.error("Failed to fetch device stats:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <p className="text-gray-500 dark:text-gray-400">Loading stats...</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric 1: Devices Online --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
          <Tick className="text-gray-800 w-12 h-12 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total number of devices online
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats
                ? `${stats.onlineDevices}/${stats.totalDevices}`
                : "N/A"}
            </h4>
          </div>
        </div>
      </div>

      {/* <!-- Metric 2: Runtime --> */}
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
                {stats?.runtime || "00:00:00"}
              </h4>

              <Badge color={stats?.changePercent && stats.changePercent < 0 ? "success" : "warning"}>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <ArrowDownIcon className="text-success-500 w-4 h-4" />
                  <span>
                    {stats?.changePercent
                      ? `${stats.changePercent.toFixed(2)}%`
                      : "0%"}
                  </span>
                </div>
              </Badge>

              <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Vs last time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};