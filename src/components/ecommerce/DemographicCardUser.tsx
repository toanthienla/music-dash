"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import mockapi from "@/utils/mockapi";
import CountryMap from "./CountryMap";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import PaginationWithTextWitIcon from "../ui/pagination/PaginationWithTextWitIcon";
import { MOCK_API_URL } from "@/utils/constants";

interface Device {
  id: number;
  name: string;
  variants: number;
  category: string;
  volume: number;
  enabled: boolean;
  image: string;
}

interface Category {
  id: number;
  name: string;
}

export default function DemographicCard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const devicesPerPage = 5;

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await mockapi.get(
          `${MOCK_API_URL}/api/v1/devices/categories`,
          { withCredentials: true }
        );
        console.log("Fetched categories:", res.data.data);
        setCategories(res.data.data);
      } catch (error: any) {
        console.error("Failed to fetch categories:", error.message);
      }
    };

    fetchCategories();
  }, []);

  //  Fetch all devices once
  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      try {
        const res = await mockapi.get(
          `${MOCK_API_URL}/api/v1/devices`,
          { withCredentials: true }
        );
        console.log("Fetched devices:", res.data.data);
        setDevices(res.data.data);
      } catch (error: any) {
        console.error("Failed to fetch devices:", error.message);
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  //  Filter devices by selected category
  const filteredDevices =
    selectedCategory === "All"
      ? devices
      : devices.filter((device) => {
        // some devices may have null/undefined category from the API — guard against that
        const deviceCategory = (device.category ?? "").toString();
        return deviceCategory.toLowerCase() === selectedCategory.toLowerCase();
      });

  //  Pagination logic
  const totalPages = Math.ceil(filteredDevices.length / devicesPerPage);
  const startIndex = (currentPage - 1) * devicesPerPage;
  const paginatedDevices = filteredDevices.slice(
    startIndex,
    startIndex + devicesPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="p-5 text-gray-500 dark:text-gray-400">
        Loading devices...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center w-full">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Group device
        </h3>
        <div className="flex gap-2">
          {/* ✅ Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            <option value="All">Select group devices</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setSelectedCategory("All")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            See all
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="px-4 py-6 my-6 overflow-hidden border border-gray-200 rounded-2xl bg-gray-50 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
        <div
          id="mapOne"
          className="mapOne map-btn -mx-4 -my-6 h-[212px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]"
        >
          <CountryMap />
        </div>
      </div>

      {/* Table */}
      <div className="max-w-full overflow-x-hidden">
        <Table>
          <TableHeader className="border-gray-100 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-xs"
              >
                Products
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-xs"
              >
                Volume
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-xs"
              >
                Enable
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedDevices.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <Image
                      width={40}
                      height={40}
                      src={device.image}
                      className="h-10 w-10 rounded-md"
                      alt={device.name}
                    />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {device.name}
                      </p>
                      <span className="text-gray-500 text-xs">
                        {device.variants} Variant
                        {device.variants > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3 w-40">
                  <div className="flex items-center gap-2">
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${device.volume}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {device.volume}%
                    </span>
                  </div>
                </TableCell>

                <TableCell className="py-3">
                  <label className="flex items-center justify-end w-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={device.enabled}
                      readOnly
                      className="sr-only peer"
                    />
                    <span className="w-11 h-6 flex items-center bg-gray-200 rounded-full p-1 peer-checked:bg-blue-500 transition-colors">
                      <span className="w-4 h-4 bg-white rounded-full shadow-md transform peer-checked:translate-x-5 transition-transform"></span>
                    </span>
                  </label>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="mt-4">
          <PaginationWithTextWitIcon
            totalPages={totalPages}
            initialPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
