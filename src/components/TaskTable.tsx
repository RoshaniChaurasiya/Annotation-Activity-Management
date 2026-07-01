"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store";
import { selectAllTasks, selectSelectedTaskId, selectTasksError, selectTasksIsStale, selectTasksLoading, selectTasksTotal } from "../store/tasksSelectors";
import { selectTask } from "../store/tasksSlice";
import { TaskStatus } from "../app/types/task";

interface TaskTableProps {
  currentPage: number;
  onPageChange: (page: number) => void;
}

interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  accentClass,
}: {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  accentClass: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function handleOutside(event: Event) {
      const target = event.target as Node;
      if (
        panelRef.current &&
        menuRef.current &&
        !panelRef.current.contains(target) &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("click", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("click", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    setAnchorRect(buttonRef.current.getBoundingClientRect());

    function updateRect() {
      if (buttonRef.current) {
        setAnchorRect(buttonRef.current.getBoundingClientRect());
      }
    }

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [isOpen]);

  return (
    <>
      <div ref={panelRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen((state) => !state)}
          className={`w-full rounded-2xl border px-3 py-3 text-left text-sm font-medium text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition ${accentClass} focus:outline-none focus:ring-2 focus:ring-cyan-400/30`}
        >
          <span>{options.find((option) => option.value === value)?.label ?? label}</span>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">▾</span>
        </button>
      </div>
      {isOpen && anchorRect && createPortal(
        <div
          ref={menuRef}
          className="z-[9999] rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl"
          style={{
            position: "fixed",
            left: anchorRect.left,
            top: anchorRect.bottom + 6,
            width: anchorRect.width,
          }}
        >
          <div className="max-h-56 overflow-auto rounded-2xl p-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full rounded-2xl px-3 py-2 text-left text-sm transition hover:bg-slate-800/70 hover:text-white"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export function TaskTable({ currentPage, onPageChange }: TaskTableProps) {
  const dispatch = useDispatch<AppDispatch>();
  const tasks = useSelector(selectAllTasks);
  const loading = useSelector(selectTasksLoading);
  const error = useSelector(selectTasksError);
  const totalItems = useSelector(selectTasksTotal);
  const selectedId = useSelector(selectSelectedTaskId);
  const isStale = useSelector(selectTasksIsStale);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"updatedAt" | "annotationCount">("updatedAt");

  const processedTasks = useMemo(() => {
    let result = [...tasks];
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      result = result.filter((task) => task.id.toLowerCase().includes(q) || task.title.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter);
    }
    if (typeFilter !== "all") {
      result = result.filter((task) => task.type === typeFilter);
    }
    result.sort((a, b) => (sortKey === "updatedAt" ? b.updatedAt - a.updatedAt : b.annotationCount - a.annotationCount));
    return result;
  }, [tasks, searchTerm, statusFilter, typeFilter, sortKey]);

  const totalPages = Math.ceil(totalItems / 20);

  return (
    <div className="flex h-full flex-1 flex-col bg-slate-950/40 overflow-visible">
      <div className="grid gap-4 border-b border-white/10 bg-slate-900/60 p-5 backdrop-blur-md overflow-visible">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300">Task queue</p>
            <p className="mt-2 text-sm text-slate-400">Search, filter, and prioritize active work.</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-200">
            {processedTasks.length} visible
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 pl-9 text-sm text-slate-200 shadow-inner outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
        </div>

        <div className="grid w-full gap-3 grid-cols-1 sm:grid-cols-3">
          <FilterDropdown
            label="All Statuses"
            value={statusFilter}
            onChange={setStatusFilter}
            accentClass="border-cyan-400/20 bg-[linear-gradient(135deg,rgba(2,6,23,0.98),rgba(30,41,59,0.92))]"
            options={[
              { value: "all", label: "All Statuses" },
              { value: TaskStatus.TODO, label: "Todo" },
              { value: TaskStatus.IN_PROGRESS, label: "In Progress" },
              { value: TaskStatus.QA, label: "QA" },
              { value: TaskStatus.DONE, label: "Done" },
              { value: TaskStatus.BLOCKED, label: "Blocked" },
            ]}
          />

          <FilterDropdown
            label="All Data Types"
            value={typeFilter}
            onChange={setTypeFilter}
            accentClass="border-indigo-400/20 bg-[linear-gradient(135deg,rgba(8,15,39,0.96),rgba(49,46,129,0.9))]"
            options={[
              { value: "all", label: "All Data Types" },
              { value: "image", label: "Image" },
              { value: "audio", label: "Audio" },
              { value: "text", label: "Text" },
              { value: "unknown", label: "Unknown (Video)" },
            ]}
          />

          <FilterDropdown
            label="Sort: Newest Update"
            value={sortKey}
            onChange={setSortKey}
            accentClass="border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(36,12,58,0.96),rgba(88,28,135,0.88))]"
            options={[
              { value: "updatedAt", label: "Sort: Newest Update" },
              { value: "annotationCount", label: "Sort: Annotations" },
            ]}
          />
        </div>
      </div>

      {isStale && (
        <div className="flex items-center gap-2 border-b border-amber-500/10 bg-amber-500/5 px-4 py-2.5 text-xs font-medium text-amber-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          Showing cached snapshot while fresh data validates.
        </div>
      )}

      <div className="relative flex-1 overflow-auto">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-slate-900/90 px-4 py-2.5 text-xs font-mono text-cyan-300 shadow-2xl">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              Syncing rows...
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="m-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {processedTasks.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-xs font-mono text-slate-500">
            No matching nodes detected in the current view.
          </div>
        ) : (
          <div className="min-w-full align-middle">
            <table className="min-w-full divide-y divide-white/10 text-left text-xs">
              <thead className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/80 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 backdrop-blur-md">
                <tr>
                  <th className="w-16 p-4">ID</th>
                  <th className="p-4">Task Details</th>
                  <th className="w-24 p-4">Type</th>
                  <th className="w-32 p-4">Status</th>
                  <th className="w-32 p-4">Assignee</th>
                  <th className="w-24 p-4 text-right">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-transparent">
                {processedTasks.map((task) => {
                  const isSelected = task.id === selectedId;
                  return (
                    <tr
                      key={task.id}
                      onClick={() => dispatch(selectTask(task.id))}
                      className={`group cursor-pointer border-l-2 transition-all duration-200 ${isSelected ? "border-cyan-400 bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 text-white" : "border-transparent text-slate-300 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-indigo-500/10 hover:text-slate-100"}`}
                    >
                      <td className="p-4 font-mono font-semibold text-cyan-300 transition-colors group-hover:text-cyan-200">{task.id}</td>
                      <td className="p-4">
                        <div className="font-medium text-slate-200 transition-colors group-hover:text-white">{task.title}</div>
                        <div className="mt-0.5 font-mono text-[10px] text-slate-500">{new Date(task.updatedAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-4">
                        <span className="rounded-full border border-white/10 bg-slate-900/80 px-2.5 py-1 text-[10px] font-mono capitalize text-slate-400">
                          {task.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${task.status === TaskStatus.DONE ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : task.status === TaskStatus.IN_PROGRESS ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-400" : task.status === TaskStatus.QA ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-400" : task.status === TaskStatus.BLOCKED ? "border-rose-500/20 bg-rose-500/10 text-rose-400" : "border-white/10 bg-slate-800/60 text-slate-400"}`}>
                          {task.status === TaskStatus.IN_PROGRESS ? "In Progress" : task.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        {task.assignee ? (
                          <span className="flex items-center gap-1.5 font-medium text-slate-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                            {task.assignee.name}
                          </span>
                        ) : (
                          <span className="text-[11px] italic text-slate-600">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-mono font-semibold text-slate-400 transition-colors group-hover:text-cyan-300">{task.annotationCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-white/10 bg-slate-900/40 px-4 py-3 text-xs text-slate-400 backdrop-blur-md">
        <div>
          Page <span className="font-semibold text-slate-200">{currentPage}</span> of <span className="font-semibold text-slate-200">{totalPages || 1}</span>
        </div>
        <div className="flex gap-2">
          <button
            disabled={currentPage <= 1 || loading}
            onClick={() => onPageChange(currentPage - 1)}
            className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-1.5 text-[11px] font-medium transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
          >
            Previous
          </button>
          <button
            disabled={currentPage >= totalPages || loading}
            onClick={() => onPageChange(currentPage + 1)}
            className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-1.5 text-[11px] font-medium transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}