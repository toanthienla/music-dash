"use client";

import React from "react";
import dynamic from "next/dynamic";
import { worldMill } from "@react-jvectormap/world";

const VectorMap = dynamic(
  () => import("@react-jvectormap/core").then((mod) => mod.VectorMap),
  { ssr: false }
);

interface CountryMapProps {
  mapColor?: string;
  markers?: Marker[];
}

export type Marker = {
  id: string;
  latLng: [number, number];
  name: string;
  status: string;
  style?: {
    fill?: string;
    borderWidth?: number;
    borderColor?: string;
  };
};

const CountryMap: React.FC<CountryMapProps> = ({ mapColor, markers = [] }) => {
  return (
    <VectorMap
      map={worldMill}
      backgroundColor="transparent"
      markers={markers.map(marker => ({
        ...marker,
        style: {
          ...marker.style,
          fill: marker.status === 'online' ? '#465FFF' : '#A0AEC0', // Blue for online, gray for offline
        }
      }))}
      markerStyle={{
        initial: {
          fill: "#465FFF",
          stroke: "white",
          strokeWidth: 2,
          opacity: 1,
        },
        hover: {
          fill: "#6B7DFF",
          stroke: "white",
          strokeWidth: 2,
          cursor: "pointer",
        },
      }}
      zoomOnScroll={true} // Enabled zooming
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