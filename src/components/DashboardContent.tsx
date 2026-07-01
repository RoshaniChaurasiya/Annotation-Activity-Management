"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store";
import { fetchTasks, loadCachedTasks } from "../store/tasksSlice";
import { useTaskFeed } from "../hooks/useTaskFeed";
import { TaskTable } from "./TaskTable";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { selectAllTasks, selectTasksIsStale, selectTasksLoading, selectTasksTotal } from "../store/tasksSelectors";
import { Panel } from "./ui/Panel";

export function DashboardContent() {
  useTaskFeed();
  const dispatch = useDispatch<AppDispatch>();
  const tasks = useSelector(selectAllTasks);
  const loading = useSelector(selectTasksLoading);
  const totalTasks = useSelector(selectTasksTotal);
  const isStale = useSelector(selectTasksIsStale);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const activeTasks = tasks.filter((task) => task.status === "in_progress" || task.status === "QA").length;
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  useEffect(() => {
    async function initializeDataPipeline() {
      await dispatch(loadCachedTasks());
      dispatch(fetchTasks({ page: currentPage, pageSize }));
    }
    initializeDataPipeline();
  }, [dispatch, currentPage]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_30%),linear-gradient(140deg,#020617_0%,#0f172a_50%,#111827_100%)] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
        <header className="relative overflow-hidden rounded-[28px] border border-cyan-400/20 bg-slate-900/70 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.18),transparent_35%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/80 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
                </span>
                Live annotation console
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Annotation Activity Management Console
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Monitor task health, live updates, and secure AI summaries in a calmer operational workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Panel className="min-w-[140px] p-3" hoverable>
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Visible rows</p>
                <p className="mt-2 text-xl font-semibold text-white">{tasks.length}</p>
              </Panel>
              <Panel className="min-w-[140px] p-3" hoverable>
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">In flight</p>
                <p className="mt-2 text-xl font-semibold text-cyan-300">{activeTasks}</p>
              </Panel>
              <Panel className="min-w-[140px] p-3" hoverable>
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Completion</p>
                <p className="mt-2 text-xl font-semibold text-emerald-300">{completionRate}%</p>
              </Panel>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Panel className="p-4" hoverable>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Data source</p>
            <p className="mt-2 text-sm font-semibold text-white">{isStale ? "Cached snapshot" : loading ? "Refreshing" : "Live stream"}</p>
            <p className="mt-1 text-sm text-slate-400">The console stays responsive while fresh rows arrive.</p>
          </Panel>
          <Panel className="p-4" hoverable>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Task coverage</p>
            <p className="mt-2 text-sm font-semibold text-white">{totalTasks} total tasks</p>
            <p className="mt-1 text-sm text-slate-400">Paged from the backend and merged with live updates.</p>
          </Panel>
          <Panel className="p-4" hoverable>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Summary stream</p>
            <p className="mt-2 text-sm font-semibold text-white">Secure markdown rendering</p>
            <p className="mt-1 text-sm text-slate-400">Untrusted content is sanitized before display.</p>
          </Panel>
        </section>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex min-h-[520px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-slate-900/70 shadow-[0_16px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl lg:h-[760px]">
            <TaskTable onPageChange={setCurrentPage} currentPage={currentPage} />
          </div>

          <div className="flex min-h-[520px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-slate-900/70 shadow-[0_16px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl lg:sticky lg:top-8 lg:h-[760px]">
            <TaskDetailPanel />
          </div>
        </div>
      </div>
    </div>
  );
}