"use client";

import React from "react";
import { useSelector } from "react-redux";
import { selectCurrentTask } from "../store/tasksSelectors";
import { SummaryStream } from "./SummaryStream";
import { Panel } from "./ui/Panel";

export function TaskDetailPanel() {
  const currentTask = useSelector(selectCurrentTask);

  if (!currentTask) {
    return (
      <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center p-8 text-center text-slate-500">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-lg shadow-inner">
          📥
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">No workspace ingestion active</p>
        <p className="mt-2 max-w-[240px] text-xs leading-relaxed text-slate-500">
          Select a task from the queue to reveal its live state and the streamed AI summary.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-auto p-5">
      <Panel className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300">
              {currentTask.type} matrix node
            </span>
            <h2 className="mt-2.5 text-base font-semibold tracking-tight text-white">{currentTask.title}</h2>
            <p className="mt-1 font-mono text-[10px] text-slate-500">UUID: {currentTask.id}</p>
          </div>
        </div>
      </Panel>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Panel className="p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">State channel</p>
          <p className="mt-1 text-sm font-medium capitalize text-slate-200">{currentTask.status.replace("_", " ")}</p>
        </Panel>
        <Panel className="p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Running counts</p>
          <p className="mt-1 text-sm font-medium text-slate-200">{currentTask.annotationCount} units</p>
        </Panel>
      </div>

      <Panel className="mt-4 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Assigned operational unit</p>
        <p className="mt-2 text-sm text-slate-300">
          {currentTask.assignee ? `👩‍💻 ${currentTask.assignee.name} (${currentTask.assignee.id})` : "Awaiting human validation assignment"}
        </p>
      </Panel>

      {Object.keys(currentTask.meta).length > 0 && (
        <Panel className="mt-4 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Meta payload</p>
          <pre className="mt-2 max-h-28 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/70 p-3 font-mono text-[11px] text-emerald-400">
            {JSON.stringify(currentTask.meta, null, 2)}
          </pre>
        </Panel>
      )}

      <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-[20px] border border-white/10 bg-slate-950/70 p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Sanitized AI ingestion pipe</p>
        <div className="min-h-0 flex-1 overflow-auto">
          <SummaryStream taskId={currentTask.id} />
        </div>
      </div>
    </div>
  );
}