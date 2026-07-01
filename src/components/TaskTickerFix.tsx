"use client";

import React, { useEffect, useState, useMemo } from "react";

type Task = { id: string; title: string; updatedAt: number };

export function TaskTicker({ apiBase }: { apiBase: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Fix A: running clock tracker without stale closures
  useEffect(() => {
    const id = setInterval(() => {
      setTick((prev) => prev + 1); // Use functional update
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Fix B: refetch with active protection guards against null targets
  useEffect(() => {
    if (!selectedId) return; // Guard clause protection

    fetch(`${apiBase}/api/tasks/${selectedId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Ticker retrieval failed.");
        return r.json();
      })
      .then((t) => {
        // Fix C: Prevent state mutation by spreading into a fresh array reference
        setTasks((prev) => {
          // Check for duplicates to prevent rendering rendering inflation loops
          if (prev.some((item) => item.id === t.id)) return prev;
          return [...prev, t];
        });
      })
      .catch((err) => console.error("Ticker fetch error:", err));
  }, [selectedId, apiBase]);

  // Fix D: Compute views through useMemo to prevent mutations during render cycles
  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [tasks]);

  return (
    <ul className="space-y-2 p-2 bg-gray-950 border border-gray-800 rounded">
      {sorted.map((t) => (
        // Fix E: Rely on stable domain unique IDs instead of fragile array indices
        <li 
          key={t.id} 
          onClick={() => setSelectedId(t.id)}
          className="cursor-pointer text-sm text-gray-300 hover:text-white transition-colors"
        >
          {t.title} (updated {Math.floor((Date.now() - t.updatedAt) / 1000)}s ago)
        </li>
      ))}
    </ul>
  );
}