"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function SessionChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const series = [4500, 6500, 1500];

  const totalValue = series.reduce((acc, n) => acc + n, 0); // Tổng các phần tử
  const formattedTotal = `${(totalValue / 1000).toFixed(1)}K`; 

  const options: ApexOptions = {
    colors: ["#3641f5", "#7592ff", "#dde9ff"],
    labels: ["Current Affairs", "Play Music", "Current Affairs"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      width: 445,
      height: 290,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          background: "transparent",
          labels: {
            show: true,
            name: {
              show: true,
              offsetY: 30,
              color: "#9CA3AF",
              fontSize: "16px",
              fontWeight: 400,
              formatter: () => "Total",
            },
            value: {
              show: true,
              fontSize: "32px",
              fontWeight: 700,
              color: "#111827",
              offsetY: -10,
              formatter: () => formattedTotal, // luôn hiển thị
            },
            total: {
              show: true, //  bắt buộc bật để hiển thị luôn
              showAlways: true, // luôn hiện, không phụ thuộc hover
              label: "Total",
              color: "#9CA3AF",
              fontSize: "16px",
              fontWeight: 400,
              formatter: () => formattedTotal,
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      show: false,
      width: 4,
    },
    legend: { show: false },
    tooltip: { enabled: false },
    states: {
      hover: { filter: { type: "none" } },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: { type: "darken" },
      },
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: { width: 340 },
          legend: { fontSize: "12px" },
        },
      },
    ],
  };

  const [isOpen, setIsOpen] = useState(false);
  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Device allocation by group
        </h3>
        <div className="relative h-fit">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-40 p-2">
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* Chart */}
      {mounted && (
        <div className="flex justify-center mx-auto">
          <ReactApexChart options={options} series={series} type="donut" height={290} />
        </div>
      )}

      {/* Legend (horizontal) */}
      <div className="mt-4 flex items-center justify-center gap-6">
        {options.labels?.map((label, idx) => (
          <div key={String(label) + idx} className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: (options.colors as string[] | undefined)?.[idx] || "#000" }}
            />
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
