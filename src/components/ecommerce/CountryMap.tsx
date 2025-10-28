"use client";

import React, { useEffect, useState } from "react";
import mockapi from "@/utils/mockapi";
import dynamic from "next/dynamic";
import { worldMill } from "@react-jvectormap/world";
import { MOCK_API_URL } from "@/utils/constants";

const VectorMap = dynamic(
  () => import("@react-jvectormap/core").then((mod) => mod.VectorMap),
  { ssr: false }
);

interface CountryMapProps {
  mapColor?: string;
}

type DeviceLocation = {
  id: number;
  lat: number;
  lng: number;
  name: string;
  status: string;
};

type Marker = {
  id: number;
  latLng: [number, number];
  name: string;
  style: {
    fill: string;
    borderWidth: number;
    borderColor: string;
  };
};

const CountryMap: React.FC<CountryMapProps> = ({ mapColor }) => {
  const [markers, setMarkers] = useState<Marker[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await mockapi.get<{ data: DeviceLocation[] }>(
          `${MOCK_API_URL}/api/v1/devices/location`,
          { withCredentials: true }
        );

        console.log("Device API response:", res.data.data);

        //  Lấy ra mảng từ data
        const devices = res.data.data;

        //  Lọc chỉ thiết bị online
        const onlineDevices = devices.filter((d) => d.status === "online");

        //  Format cho map markers
        const formattedMarkers: Marker[] = onlineDevices.map((item) => ({
          id: item.id,
          latLng: [item.lat, item.lng],
          name: item.name,
          style: {
            fill: "#465FFF",
            borderWidth: 1,
            borderColor: "white",
          },
        }));

        setMarkers(formattedMarkers);
      } catch (err) {
        console.error("Error fetching device locations:", err);
      }
    };

    fetchLocations();
  }, []);

  return (
    <VectorMap
      map={worldMill}
      backgroundColor="transparent"
      markers={markers}
      markerStyle={{
        initial: {
          fill: "#465FFF",
          r: 5,
        },
      }}
      zoomOnScroll={false}
      regionStyle={{
        initial: {
          fill: mapColor || "#D0D5DD",
          stroke: "none",
        },
        hover: {
          fill: "#465fff",
          cursor: "pointer",
        },
      }}
    />
  );
};

export default CountryMap;
