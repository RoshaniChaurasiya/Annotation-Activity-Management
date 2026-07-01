import { createSlice, createAsyncThunk, createEntityAdapter, PayloadAction } from "@reduxjs/toolkit";
import { Task } from "../app/types/task";
import { normalizeTask } from "../utils/normalize";
import localforage from "localforage";

// Configure localforage engine instance
localforage.config({
  name: "AnnotationConsole",
  storeName: "tasks_cache"
});

interface TasksStateAdditional {
  loading: boolean;
  isStale: boolean; // True if displaying IndexedDB data waiting for fresh network resolution
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  selectedTaskId: string | null;
}

export const tasksAdapter = createEntityAdapter<Task>();

const initialState = tasksAdapter.getInitialState<TasksStateAdditional>({
  loading: false,
  isStale: false,
  error: null,
  page: 1,
  pageSize: 20,
  total: 0,
  selectedTaskId: null,
});

// Thunk action to pull the offline cache from IndexedDB on startup
export const loadCachedTasks = createAsyncThunk(
  "tasks/loadCache",
  async (_, { rejectWithValue }) => {
    try {
      const cached = await localforage.getItem<{ items: Task[]; total: number }>("latest_page_data");
      if (!cached) throw new Error("No local cache found.");
      return cached;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async ({ page, pageSize }: { page: number; pageSize: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:4000/api/tasks?page=${page}&pageSize=${pageSize}`);
      if (!response.ok) throw new Error("Server network error occurred.");
      
      const data = await response.json();
      const normalizedItems = data.items.map((item: any) => normalizeTask(item));
      
      // Async background write to IndexedDB cache so main thread stays non-blocking
      localforage.setItem("latest_page_data", {
        items: normalizedItems,
        total: data.total
      }).catch(err => console.error("IndexedDB write failure:", err));
      
      return {
        items: normalizedItems,
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch tasks");
    }
  }
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    selectTask: (state, action: PayloadAction<string | null>) => {
      state.selectedTaskId = action.payload;
    },
    upsertLiveTask: (state, action: PayloadAction<Task>) => {
      tasksAdapter.upsertOne(state, action.payload);
    },
    updateLiveTaskFields: (state, action: PayloadAction<{ id: string; changes: Partial<Task> }>) => {
      tasksAdapter.updateOne(state, { id: action.payload.id, changes: action.payload.changes });
    }
  },
  extraReducers: (builder) => {
    builder
      // 1. Local IndexedDB Cache Handlers
      .addCase(loadCachedTasks.fulfilled, (state, action) => {
        state.total = action.payload.total;
        state.isStale = true; // Mark as stale until network revalidation arrives
        tasksAdapter.setAll(state, action.payload.items);
      })
      // 2. Network Fetch Handlers
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.isStale = false; // Fresh data arrived, clear stale indicator flag
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
        state.total = action.payload.total;
        tasksAdapter.setAll(state, action.payload.items);
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.isStale = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectTask, upsertLiveTask, updateLiveTaskFields } = tasksSlice.actions;
export default tasksSlice.reducer;