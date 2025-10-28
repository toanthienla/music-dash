import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetricsUser";
import QueuePanel from "@/components/control-panel/QueuePanel";
import DemographicCard from "@/components/ecommerce/DemographicCardUser";
import RecentOrders from "@/components/ecommerce/RecentOrdersUser";
import React from "react";


export const metadata: Metadata = {
  title:
    "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};

export default function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics />

        <DemographicCard />

        <RecentOrders />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <QueuePanel />
      </div>
    </div>
  );
}
