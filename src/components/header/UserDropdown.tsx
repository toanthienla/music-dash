"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

interface StoredUser {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  avatarUrl?: string;
  [key: string]: any;
}

/**
 * Return simple initials for the placeholder (e.g. "KH" or "K").
 */
function getInitials(user: StoredUser | null) {
  if (!user) return "U";
  const first = (user.firstName || "").trim();
  const last = (user.lastName || "").trim();
  if (first || last) {
    const f = first ? first.charAt(0).toUpperCase() : "";
    const l = last ? last.charAt(0).toUpperCase() : "";
    return (f + l) || "U";
  }
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  return "U";
}

/**
 * Deterministic color selection from a small palette using a seed.
 */
function pickColor(seed?: string) {
  const palette = [
    "#0EA5A4", // teal
    "#2563EB", // blue
    "#7C3AED", // purple
    "#EF4444", // red
    "#F59E0B", // amber
    "#10B981", // green
    "#F97316", // orange
    "#6B7280", // gray
  ];
  if (!seed) return palette[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return palette[Math.abs(h) % palette.length];
}

export default function UserDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  function toggleDropdown() {
    setIsOpen((s) => !s);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("user");
        if (raw) {
          const parsed = JSON.parse(raw) as StoredUser;
          setUser(parsed);
        } else {
          setUser(null);
        }
      }
    } catch (err) {
      console.error("Failed to parse localStorage user:", err);
      try {
        localStorage.removeItem("user");
      } catch {
        /* ignore */
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignOut = () => {
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("rememberMe");
    } catch (err) {
      console.warn("Failed to clear localStorage during sign out", err);
    } finally {
      closeDropdown();
      router.push("/signin");
    }
  };

  const displayName = (() => {
    if (!user) return "Unknown User";
    const first = user.firstName?.trim() ?? "";
    const last = user.lastName?.trim() ?? "";
    const full = `${first} ${last}`.trim();
    if (full) return full;
    if (user.email) return user.email;
    return "No Name";
  })();

  const displayEmail = user?.email ?? "No Email";

  // Basic placeholder: initials inside a colored circle.
  const initials = getInitials(user);
  const bgColor = pickColor(user?.id ?? user?.email);

  // If avatar is a local path (starts with '/'), use next/image to render it.
  // Otherwise show the simple initials placeholder (this avoids next/image host config issues).
  const rawAvatar = user?.avatar || user?.avatarUrl;
  const isLocalPath = typeof rawAvatar === "string" && rawAvatar.startsWith("/");

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center dropdown-toggle text-gray-700 dark:text-gray-400"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11 bg-transparent flex items-center justify-center">
          {isLocalPath ? (
            <Image
              width={44}
              height={44}
              src={rawAvatar as string}
              alt={displayName}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div
              className="h-11 w-11 rounded-full flex items-center justify-center text-white font-medium select-none"
              style={{ backgroundColor: bgColor }}
              aria-hidden
            >
              <span className="text-sm">{initials}</span>
            </div>
          )}
        </span>

        <span className="block mr-1 font-medium text-theme-sm">
          {loading ? "Loading..." : displayName}
        </span>

        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {displayName}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {displayEmail}
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Edit profile
            </DropdownItem>
          </li>
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/account"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Account settings
            </DropdownItem>
          </li>
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/support"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Support
            </DropdownItem>
          </li>
        </ul>

        <button
          onClick={handleSignOut}
          className="w-full text-left flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          Sign out
        </button>
      </Dropdown>
    </div>
  );
}