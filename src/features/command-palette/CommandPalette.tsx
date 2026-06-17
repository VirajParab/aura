import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useCharacterStore } from "@/character/store/characterStore";
import { memoryApi } from "@/features/memory/api";
import type { WidgetType } from "@/types/character";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const ACTIONS: { id: string; label: string; widget?: WidgetType }[] = [
  { id: "notes", label: "Open Quick Notes", widget: "quick_notes" },
  { id: "clipboard", label: "Open Clipboard History", widget: "clipboard_history" },
  { id: "journal", label: "Open Journal", widget: "journal" },
  { id: "search", label: "AI Search", widget: "ai_search" },
  { id: "trading", label: "Trading Chart", widget: "trading_chart" },
  { id: "vault", label: "Open Vault", widget: "vault" },
  { id: "capture", label: "Quick Capture (note)" },
  { id: "settings", label: "Open Settings" },
  { id: "feed", label: "Feed Treat" },
];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const openWidget = useCharacterStore((s) => s.openWidget);
  const manifest = useCharacterStore((s) => s.manifest);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const id = setTimeout(() => {
      memoryApi.searchMemory(query).then((events) => {
        setResults(events.map((e) => `${e.title} — ${e.summary ?? e.event_type}`));
      }).catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(id);
  }, [query, open]);

  if (!open) return null;

  const filtered = ACTIONS.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()),
  );

  const run = async (id: string) => {
    const action = ACTIONS.find((a) => a.id === id);
    if (!action) return;
    if (action.widget) openWidget(action.widget);
    if (id === "settings") await invoke("show_settings_window");
    if (id === "feed") await invoke("feed_treat");
    if (id === "capture") {
      await memoryApi.createNote("Quick capture from palette");
    }
    onClose();
  };

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="command-palette-input"
          placeholder="Search memory or type a command…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filtered[0]) void run(filtered[0].id);
          }}
        />
        <ul className="command-palette-list">
          {filtered.map((action) => (
            <li key={action.id}>
              <button type="button" onClick={() => void run(action.id)}>
                {action.label}
              </button>
            </li>
          ))}
          {results.map((line) => (
            <li key={line} className="command-palette-result">
              {line}
            </li>
          ))}
        </ul>
        {manifest && (
          <p className="command-palette-foot">
            Active lineup: {manifest.launch_lineup.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
