"use client";
"use client";
import React from "react";
// import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";

import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function AnalyticsBarChart() {
  // sample data series
  const series = [
    {
      name: "Sales",
      data: [
        168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112, 123, 212,
        270, 190, 310, 115, 90, 380, 112, 223, 292, 170, 290, 110, 115, 290,
        380, 312,
      ],
    },
  ];

  // compute max and scale factor so data fits the fixed 0..20000 Y axis
  const rawMax = Math.max(...(series.flatMap((s) => s.data as number[]) || [0]));
  const scaleFactor = rawMax > 0 ? Math.max(1, Math.floor(20000 / rawMax)) : 1;
  const scaledSeries = series.map((s) => ({
    ...s,
    data: (s.data as number[]).map((v) => v * scaleFactor),
  }));

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 350,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "45%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: {
      categories: Array.from({ length: 30 }, (_, i) => String(i + 1)),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
    grid: { yaxis: { lines: { show: true } } },

    // Force Y-axis to match design: show labels 0, 10k, 15k, 20k
    yaxis: {
      min: 0,
      max: 20000,
      tickAmount: 4,
      labels: {
        formatter: (val: number) => {
          const v = Math.round(val);
          if (v === 0) return "0";
          if (v === 10000) return "10k";
          if (v === 15000) return "15k";
          if (v === 20000) return "20k";
          return "";
        },
        style: { colors: ["#9CA3AF"] },
      },
    },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: {
        formatter: (val: number) => {
          // val is from scaled series; show original by dividing by scaleFactor
          const orig = Math.round(val / scaleFactor);
          return `${orig}`;
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Streaming time by time Period</h3>
          <span className="block text-gray-500 text-theme-sm dark:text-gray-400">Total streaming time in 30 days</span>
        </div>
        <ChartTab />
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[1300px] xl:min-w-full pl-2">
          <ReactApexChart options={options} series={scaledSeries} type="bar" height={350} />
        </div>
      </div>
    </div>
  );
}
