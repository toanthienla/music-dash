import type { Metadata } from "next";
import Device from "@/components/device/Device";
import React from "react";


export const metadata: Metadata = {
  title:
    "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};

export default function Ecommerce() {
  return (
    <div className="w-full min-h-screen">
      <Device />
    </div>
  );
}
