import { invoke } from "@tauri-apps/api/core";

export interface ClipboardEntry {
  id: string;
  text: string;
  content_hash: string;
  source_app?: string;
  copied_at: string;
  is_sensitive: boolean;
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  timestamp: string;
  title: string;
  summary?: string;
  content_ref: string;
  content_table: string;
  source_app?: string;
  metadata?: string;
}

export interface Capture {
  id: string;
  capture_type: string;
  title?: string;
  content?: string;
  source_app?: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  due_at?: string;
  created_at: string;
}

export interface ActiveWindow {
  id: number;
  title: string;
  app_name: string;
}

export const memoryApi = {
  listClipboard: (limit = 50) =>
    invoke<ClipboardEntry[]>("list_clipboard_cmd", { limit }),
  searchClipboard: (query: string, limit = 30) =>
    invoke<ClipboardEntry[]>("search_clipboard_cmd", { query, limit }),
  listTimeline: (limit = 50) =>
    invoke<TimelineEvent[]>("list_timeline_cmd", { limit }),
  searchMemory: (query: string, limit = 30) =>
    invoke<TimelineEvent[]>("search_memory_cmd", { query, limit }),
  listNotes: (limit = 50) => invoke<Capture[]>("list_notes_cmd", { limit }),
  listTasks: (limit = 50) => invoke<Task[]>("list_tasks_cmd", { limit }),
  createNote: (content: string, title?: string) =>
    invoke<Capture>("create_note_cmd", { content, title }),
  createTask: (title: string) => invoke<Task>("create_task_cmd", { title }),
  toggleTask: (id: string) => invoke<boolean>("toggle_task_cmd", { id }),
  createCapture: (captureType: string, content: string, title?: string) =>
    invoke<Capture>("create_capture_cmd", {
      captureType,
      content,
      title,
    }),
  getActiveWindow: () =>
    invoke<ActiveWindow | null>("get_active_window_cmd"),
};
