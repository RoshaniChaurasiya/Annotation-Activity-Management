import { Task, TaskStatus } from "../app/types/task";

/**
 * Maps inconsistent casing or misspelled task statuses smoothly into neat enums.
 */
export function normalizeStatus(rawStatus: unknown): TaskStatus {
  if (typeof rawStatus !== "string") return TaskStatus.TODO;
  
  const statusClean = rawStatus.trim().toLowerCase();
  
  switch (statusClean) {
    case "todo":
      return TaskStatus.TODO;
    case "inprogress":
    case "in_progress":
      return TaskStatus.IN_PROGRESS;
    case "qa":
      return TaskStatus.QA;
    case "done":
      return TaskStatus.DONE;
    case "blocked":
      return TaskStatus.BLOCKED;
    default:
      return TaskStatus.TODO; // Sane fallback instead of throwing crashes
  }
}

/**
 * Standardizes dynamic date objects (ISO string or Epoch integers) into absolute unix ms numbers.
 */
export function normalizeTimestamp(rawTime: unknown): number {
  if (!rawTime) return Date.now();
  
  if (typeof rawTime === "string") {
    const parsed = Date.parse(rawTime);
    return isNaN(parsed) ? Date.now() : parsed;
  }
  
  if (typeof rawTime === "number") {
    return rawTime;
  }
  
  return Date.now();
}

/**
 * Transforms counts arriving as raw strings or numeric values securely into solid numbers.
 */
export function normalizeAnnotationCount(rawCount: unknown): number {
  if (typeof rawCount === "number") return rawCount;
  if (typeof rawCount === "string") {
    const parsed = parseInt(rawCount, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * The master structural entrypoint mapper protecting our application core from raw api data arrays.
 */
export function normalizeTask(raw: any): Task {
  const id = String(raw?.id || `gen-${Math.random()}`);
  const title = String(raw?.title || `Task (${id})`);
  const status = normalizeStatus(raw?.status);
  const updatedAt = normalizeTimestamp(raw?.updatedAt);
  const annotationCount = normalizeAnnotationCount(raw?.annotationCount);
  
  const assignee = raw?.assignee && typeof raw.assignee === "object"
    ? { id: String(raw.assignee.id), name: String(raw.assignee.name) }
    : null;
    
  const meta = raw?.meta && typeof raw.meta === "object" ? raw.meta : {};
  
  const baseData = {
    id,
    title,
    status,
    assignee,
    annotationCount,
    updatedAt,
    meta,
  };

  const rawType = raw?.type;
  if (rawType === "image" || rawType === "audio" || rawType === "text") {
    return {
      ...baseData,
      type: rawType,
    } as Task;
  }

  // Fallback map safely handles explicitly unexpected fields (like 'video')
  return {
    ...baseData,
    type: "unknown",
    rawType: String(rawType || "missing"),
  };
}