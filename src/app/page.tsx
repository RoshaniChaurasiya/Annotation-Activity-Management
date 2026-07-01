"use client";

import React from "react";
import dynamic from "next/dynamic";
import { StoreProvider } from "../components/StoreProvider";

// Force Next.js to skip Server-Side Pre-rendering for the interactive dashboard shell.
// This completely bypasses hydration errors caused by browser extensions or client-side caching initializations.
const DashboardContentWithNoSSR = dynamic(
  () => import("../components/DashboardContent").then((mod) => mod.DashboardContent),
  { ssr: false }
);

export default function Page() {
  return (
    <StoreProvider>
      <DashboardContentWithNoSSR />
    </StoreProvider>
  );
}