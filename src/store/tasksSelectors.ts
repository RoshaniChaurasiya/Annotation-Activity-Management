import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./index";
import { tasksAdapter } from "./tasksSlice";

// Extract base entity selectors
const adapterSelectors = tasksAdapter.getSelectors((state: RootState) => state.tasks);

export const selectAllTasks = adapterSelectors.selectAll;
export const selectTaskEntities = adapterSelectors.selectEntities;

export const selectTasksLoading = (state: RootState) => state.tasks.loading;
export const selectTasksError = (state: RootState) => state.tasks.error;
export const selectTasksPage = (state: RootState) => state.tasks.page;
export const selectTasksPageSize = (state: RootState) => state.tasks.pageSize;
export const selectTasksTotal = (state: RootState) => state.tasks.total;
export const selectSelectedTaskId = (state: RootState) => state.tasks.selectedTaskId;
export const selectTasksIsStale = (state: RootState) => state.tasks.isStale;

// Memoized lookup for active workspace single component selection
export const selectCurrentTask = createSelector(
  selectTaskEntities,
  selectSelectedTaskId,
  (entities, selectedId) => (selectedId ? entities[selectedId] : null)
);