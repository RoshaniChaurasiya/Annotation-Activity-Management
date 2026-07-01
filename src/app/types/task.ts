export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  QA = "QA",
  DONE = "done",
  BLOCKED = "blocked",
}

export interface BaseTask {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: { id: string; name: string } | null;
  annotationCount: number;
  updatedAt: number; // Normalized strictly into a numerical Unix timestamp (ms)
  meta: {
    priority?: string;
    note?: string;
    [key: string]: unknown;
  };
}

export interface ImageTask extends BaseTask {
  type: "image";
}

export interface AudioTask extends BaseTask {
  type: "audio";
}

export interface TextTask extends BaseTask {
  type: "text";
}

export interface UnknownTask extends BaseTask {
  type: "unknown";
  rawType: string; // Retains the messy type for debugging/safeguards
}

// Discriminator payload block
export type Task = ImageTask | AudioTask | TextTask | UnknownTask;