import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store";
import { updateLiveTaskFields } from "../store/tasksSlice";
import { selectAllTasks } from "../store/tasksSelectors"; // Fixed import location!
import { normalizeStatus } from "../utils/normalize";

// 1. Strict shapes for incoming WebSocket events as defined in the appendix
interface TaskUpdatedPayload {
  id: string;
  status: string;
  updatedAt: number;
}

interface TaskAssignedPayload {
  id: string;
  assignee: { id: string; name: string } | null;
}

interface AnnotationCreatedPayload {
  taskId: string;
  by: string;
  at: number;
}

type WebSocketEvent =
  | { kind: "task.updated"; payload: TaskUpdatedPayload }
  | { kind: "task.assigned"; payload: TaskAssignedPayload }
  | { kind: "annotation.created"; payload: AnnotationCreatedPayload };

export function useTaskFeed() {
  const dispatch = useDispatch<AppDispatch>();
  // Grab current tasks in state to check if an incoming event references an existing record
  const existingTasks = useSelector(selectAllTasks);
  const existingIdsRef = useRef<Set<string>>(new Set());

  // Keep tracking references synchronized for immediate synchronous checks inside listener closures
  useEffect(() => {
    existingIdsRef.current = new Set(existingTasks.map((t) => t.id));
  }, [existingTasks]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectionTimeoutId: NodeJS.Timeout | null = null;

    function connect() {
      ws = new WebSocket("ws://localhost:4000/ws");

      ws.onopen = () => {
        console.log("WebSocket connection established successfully.");
      };

      ws.onmessage = (messageEvent) => {
        try {
          const eventData: WebSocketEvent = JSON.parse(messageEvent.data);

          switch (eventData.kind) {
            case "task.updated": {
              const { id, status, updatedAt } = eventData.payload;
              // Guard: If task isn't loaded on current page slice, drop gracefully to avoid pollution
              if (!existingIdsRef.current.has(id)) return;

              dispatch(
                updateLiveTaskFields({
                  id,
                  changes: {
                    status: normalizeStatus(status),
                    updatedAt: updatedAt,
                  },
                })
              );
              break;
            }

            case "task.assigned": {
              const { id, assignee } = eventData.payload;
              if (!existingIdsRef.current.has(id)) return;

              dispatch(
                updateLiveTaskFields({
                  id,
                  changes: { assignee },
                })
              );
              break;
            }

            case "annotation.created": {
              const { taskId } = eventData.payload;
              if (!existingIdsRef.current.has(taskId)) return;

              // Increment count securely without needing to mutate state values out of sync
              const currentTask = existingTasks.find((t) => t.id === taskId);
              if (currentTask) {
                dispatch(
                  updateLiveTaskFields({
                    id: taskId,
                    changes: {
                      annotationCount: currentTask.annotationCount + 1,
                    },
                  })
                );
              }
              break;
            }
          }
        } catch (err) {
          console.error("Failed parsing incoming stream frame:", err);
        }
      };

      ws.onclose = () => {
        console.warn("WebSocket closed. Attempting reconnect sequence in 3 seconds...");
        reconnectionTimeoutId = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        // Browsers hide exact network drop details from JS code due to security rules.
        console.warn("WebSocket stream handshake interrupted. Forcing closure to trigger recovery loop...");
        // Explicitly trigger ws.close() so our built-in onclose auto-recovery fallback takes over safely!
        ws?.close();
      };
    }

    connect();

    // Cleanup resources explicitly when components unmount
    return () => {
      if (reconnectionTimeoutId) clearTimeout(reconnectionTimeoutId);
      if (ws) {
        ws.onclose = null; // Unbind hook lifecycle to prevent retry loops during cleanup
        ws.close();
      }
    };
  }, [dispatch]);
}