"use client";
// import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";
import dynamic from "next/dynamic";
import { useState } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function AcquisitionChannelChart() {
  // grouped chart data (percent values) matching the design categories
  const series = [
    { name: "Online", data: [70, 55, 60, 30, 58] },
    { name: "Offline", data: [85, 40, 72, 18, 75] },
  ];
  // totals (for potential tooltip percent calculations)
  const totals = series[0].data.map((_, i) =>
    series.reduce((sum, s) => sum + (s.data[i] as number), 0)
  );
const options: ApexOptions = {
  colors: ["#cfe0ff", "#465fff"], // Online nhạt hơn, Offline đậm hơn
  chart: {
    fontFamily: "Outfit, sans-serif",
    type: "bar",
    stacked: false,
    height: 315,
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: "35%", // giảm để có khoảng cách giữa 2 cột
      
      borderRadius: 10,
      borderRadiusApplication: "end",
      borderRadiusWhenStacked: "last",
    },
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: [
      "Newsletter",
      "Current Affairs",
      "Play Music",
      "Weather Forecast",
      "Current Affairs",
    ],
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  legend: { show: false },
  yaxis: {
    min: 0,
    max: 100,
    tickAmount: 5,
    labels: {
      formatter: (val: number) => `${Math.round(val)}%`,
      style: { colors: ["#9CA3AF"] },
    },
  },
  grid: {
    yaxis: { lines: { show: true } },
  },
  fill: {
    opacity: [0.6, 1], // Online nhạt, Offline đậm
  },
  tooltip: {
    x: { show: false },
    y: {
      formatter: (val: number, opts?: any) => {
        try {
          const orig = series[opts.seriesIndex].data[opts.dataPointIndex];
          return `${orig}%`;
        } catch {
          return `${val}%`;
        }
      },
    },
  },
};


  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Number of devices by group</h3>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: '#cfe0ff' }} />
              <span className="text-sm text-gray-500">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: '#465fff' }} />
              <span className="text-sm text-gray-500">Offline</span>
            </div>
          </div>
        </div>
        <div className="relative h-fit">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
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
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[700px] xl:min-w-full pl-2">
          <ReactApexChart options={options} series={series} type="bar" height={360} />
        </div>
      </div>
    </div>
  );
}
