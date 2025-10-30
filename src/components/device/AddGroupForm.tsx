"use client";

import React, { useEffect, useState } from "react";
import PaginationWithTextWitIcon from "../ui/pagination/PaginationWithTextWitIcon";
import Image from "next/image";
import Checkbox from "../form/input/Checkbox";
import axiosClient from "@/utils/axiosClient";
import { MOCK_API_URL } from "@/utils/constants";

type Device = {
  id: number;
  image: string;
  name: string;
  address: string;
  group: string;
  volume: number;
  enabled: boolean;
  lat?: number;
  lng?: number;
  category?: string;
  variants?: number;
  user_id?: number;
};

type Props = {
  open: boolean;
  devices: Device[];
  initialGroupName?: string;
  onClose: () => void;
  onSave: (groupName: string, selectedDeviceIds: number[]) => void;
};

export default function AddGroupForm({
  open,
  devices,
  initialGroupName = "",
  onClose,
  onSave,
}: Props) {
  const [groupName, setGroupName] = useState(initialGroupName);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setGroupName(initialGroupName);
      setSelected({});
      setRowsPerPage(10);
      setCurrentPage(1);
      setSearch("");
    }
  }, [open, initialGroupName]);

  // If the parent devices list changes (for example after a fetch), reset pagination
  useEffect(() => {
    setRowsPerPage(10);
    setCurrentPage(1);
  }, [devices.length]);

  // Lọc & phân trang
  const filtered = devices.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.address.toLowerCase().includes(q) ||
      String(d.id).includes(q)
    );
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, total);
  const visible = filtered.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  if (!open) return null;

  const toggle = (id: number) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  //  Gọi API tạo devices mới dựa trên groupName và devices đã chọn
  const handleSave = async () => {
    const ids = Object.keys(selected)
      .filter((k) => selected[Number(k)])
      .map((k) => Number(k));

    if (!groupName.trim()) {
      alert("Vui lòng nhập tên nhóm (Group Device Name)!");
      return;
    }

    if (ids.length === 0) {
      alert(" Vui lòng chọn ít nhất một thiết bị!");
      return;
    }

    setSaving(true);

    try {
      for (const id of ids) {
        const baseDevice = devices.find((d) => d.id === id);
        if (!baseDevice) continue;

        // Payload KHỚP 100% với schema từ backend (Postman sample bạn gửi)
        const payload = {
          lat: baseDevice.lat ?? 10.233,
          lng: baseDevice.lng ?? 106.376,
          // Use the original device name for the new device so the table shows device names
          name: baseDevice.name,
          image: baseDevice.image,
          volume: baseDevice.volume,
          address: baseDevice.address,
          enabled: baseDevice.enabled,
          category: baseDevice.category ?? "Laptop",
          variants: baseDevice.variants ?? 1,
          deviceGroup: groupName, //Nhóm mới
          // ⚠️ KHÔNG gửi user_id vì backend không cho phép
        };

        console.log("🔹 Sending payload:", payload);

        const res = await axiosClient.post(
          `${MOCK_API_URL}/api/v1/devices`,
          payload,
          { headers: { "Content-Type": "application/json" } }
        );

        console.log("✅ Device created:", res.data);
      }

      alert(`✅ Đã tạo thành công ${ids.length} thiết bị mới trong nhóm "${groupName}"`);
      onSave(groupName, ids);
      onClose();
    } catch (err: any) {
      console.error("❌ Create device failed:", err.response?.data || err.message);
      alert(`❌ Lỗi khi tạo thiết bị: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };


  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newRowsPerPage = parseInt(e.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="fixed inset-0 z-[99999]">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 h-full w-full max-w-[860px] bg-white dark:bg-gray-900 p-6 overflow-y-auto rounded-l-2xl shadow-xl">
        <button
          onClick={onClose}
          className="absolute -left-5 top-4 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-gray-500"
        >
          ✕
        </button>

        <h3 className="text-xl font-semibold text-gray-800 mb-1">
          Add new group device
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Update your group device details.
        </p>

        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-1">
            Group Device Name
          </label>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Enter group name (e.g., Play Music)"
          />
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3">Device list</h4>

          {/* Bộ lọc + tìm kiếm */}
          <div className="flex items-center gap-3 w-wfull p-5">
            <span className="text-gray-500 dark:text-gray-400"> Show </span>
            <select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="border rounded-lg px-2 py-1 text-sm"
            >
              <option value="10">10</option>
              <option value="8">8</option>
              <option value="5">5</option>
            </select>
            <span className="text-gray-500 dark:text-gray-400"> entries </span>
            <div className="ml-auto w-full max-w-[520px] flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search device..."
                className="h-10 w-full rounded-lg border px-3 text-sm"
              />
            </div>
          </div>

          {/* Danh sách thiết bị */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-600 border-b">
                  <th className="p-3">Select</th>
                  <th className="p-3">Device</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Image</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="p-3">
                      <Checkbox
                        checked={!!selected[d.id]}
                        onChange={() => toggle(d.id)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{d.name}</span>
                        <span className="text-xs text-gray-500">
                          #{d.id.toString(16)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">{d.address}</td>
                    <td className="p-3 w-20">
                      <div className="w-10 h-10 relative">
                        <Image
                          src={d.image}
                          alt={d.name}
                          fill
                          className="object-contain rounded"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Showing {startIndex + 1} to {endIndex} of {total} entries
            </p>
            <PaginationWithTextWitIcon
              totalPages={totalPages}
              initialPage={currentPage}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm">
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Add new"}
          </button>
        </div>
      </aside>
    </div>
  );
}
