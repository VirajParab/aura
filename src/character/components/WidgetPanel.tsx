import { useEffect, useState } from "react";
import {
  memoryApi,
  type Capture,
  type ClipboardEntry,
  type Task,
  type TimelineEvent,
} from "@/features/memory/api";
import type { CharacterDefinition, WidgetType } from "@/types/character";

const WIDGET_TITLES: Record<WidgetType, string> = {
  quick_notes: "Quick Notes",
  clipboard_history: "Clipboard History",
  journal: "Journal",
  ai_search: "AI Search",
  trading_chart: "Trading Chart",
  vault: "Vault",
};

const CHARACTER_WIDGET_COPY: Record<
  string,
  Partial<Record<WidgetType, { intro: string; placeholder: string }>>
> = {
  mochi: {
    quick_notes: {
      intro: "Mochi fetches quick notes and drops them at your feet.",
      placeholder: "What should Mochi remember?",
    },
  },
  pixel: {
    clipboard_history: {
      intro: "Pixel climbed over to share your clipboard history.",
      placeholder: "Recent clips appear below…",
    },
  },
  sakura: {
    journal: {
      intro: "Sakura opens her journal for gentle reflection.",
      placeholder: "How are you feeling today?",
    },
  },
  nova: {
    ai_search: {
      intro: "Nova searches your memory timeline.",
      placeholder: "Ask Nova about your timeline…",
    },
  },
  ember: {
    trading_chart: {
      intro: "Ember guards your trading journal.",
      placeholder: "Trade notes and journal entries…",
    },
    vault: {
      intro: "Ember unlocks the vault.",
      placeholder: "Protected notes…",
    },
  },
};

const VARIANT_COPY: Record<string, { title: string; intro: string }> = {
  tasks: { title: "Today's Tasks", intro: "Tasks Mochi fetched for you." },
  screenshots: { title: "Screenshot Gallery", intro: "Pixel's visual memory." },
  reminders: { title: "Reminders", intro: "Sakura's gentle reminders." },
  summary: { title: "Memory Summary", intro: "Nova's timeline summary." },
};

interface WidgetPanelProps {
  widget: WidgetType;
  character: CharacterDefinition;
  variant?: string | null;
  onClose: () => void;
}

export function WidgetPanel({
  widget,
  character,
  variant,
  onClose,
}: WidgetPanelProps) {
  const [notes, setNotes] = useState<Capture[]>([]);
  const [clipboard, setClipboard] = useState<ClipboardEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TimelineEvent[]>([]);

  const variantMeta = variant ? VARIANT_COPY[variant] : null;
  const themed =
    CHARACTER_WIDGET_COPY[character.id]?.[widget] ?? {
      intro: `${character.name} connects this panel to your memory.`,
      placeholder: `${character.name} is ready…`,
    };
  const title = variantMeta?.title ?? WIDGET_TITLES[widget];

  useEffect(() => {
    void memoryApi.listNotes().then(setNotes).catch(() => setNotes([]));
    void memoryApi.listClipboard().then(setClipboard).catch(() => setClipboard([]));
    void memoryApi.listTasks().then(setTasks).catch(() => setTasks([]));
    void memoryApi.listTimeline().then(setTimeline).catch(() => setTimeline([]));
  }, [widget]);

  const saveNote = async () => {
    if (!draft.trim()) return;
    if (variant === "tasks") {
      const task = await memoryApi.createTask(draft);
      setTasks((prev) => [task, ...prev]);
    } else {
      const note = await memoryApi.createNote(draft, `${character.name} note`);
      setNotes((prev) => [note, ...prev]);
    }
    setDraft("");
  };

  const runSearch = async () => {
    if (!searchQuery.trim()) return;
    const results = await memoryApi.searchMemory(searchQuery);
    setSearchResults(results);
  };

  return (
    <div
      className="widget-panel"
      style={{ borderColor: `${character.color}55` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="widget-panel-header"
        style={{ background: `linear-gradient(90deg, ${character.color}33, transparent)` }}
      >
        <span>
          {character.emoji} {title}
        </span>
        <button type="button" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="widget-panel-body">
        <p className="widget-character-badge">
          {character.name} · {character.category.replace(/_/g, " ")}
        </p>
        <p>{variantMeta?.intro ?? themed.intro}</p>

        {widget === "quick_notes" && (
          <>
            <textarea
              className="widget-textarea"
              placeholder={themed.placeholder}
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="button" className="widget-action-btn" onClick={() => void saveNote()}>
              Save note
            </button>
            <ul className="widget-list">
              {(variant === "tasks" ? [] : notes).map((n) => (
                <li key={n.id}>{n.content}</li>
              ))}
              {variant === "tasks" &&
                tasks.map((t) => (
                  <li key={t.id} className={t.done ? "done" : ""}>
                    {t.title}
                  </li>
                ))}
            </ul>
          </>
        )}

        {widget === "clipboard_history" && (
          <ul className="widget-list widget-list--clipboard">
            {clipboard.map((c) => (
              <li key={c.id}>
                <code>{c.text.slice(0, 120)}</code>
                <small>{c.copied_at}</small>
              </li>
            ))}
          </ul>
        )}

        {widget === "journal" && (
          <>
            <textarea
              className="widget-textarea"
              placeholder={themed.placeholder}
              rows={4}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="button" className="widget-action-btn" onClick={() => void saveNote()}>
              Save journal entry
            </button>
            <ul className="widget-list">
              {notes.map((n) => (
                <li key={n.id}>{n.content}</li>
              ))}
            </ul>
          </>
        )}

        {widget === "ai_search" && (
          <>
            <input
              className="widget-search"
              placeholder="Search your timeline…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void runSearch()}
            />
            <button type="button" className="widget-action-btn" onClick={() => void runSearch()}>
              Search
            </button>
            <ul className="widget-list">
              {(searchResults.length ? searchResults : timeline.slice(0, 8)).map((e) => (
                <li key={e.id}>
                  <strong>{e.title}</strong>
                  <small>{e.summary ?? e.event_type}</small>
                </li>
              ))}
            </ul>
          </>
        )}

        {(widget === "trading_chart" || widget === "vault") && (
          <ul className="widget-list">
            {timeline
              .filter((e) =>
                widget === "trading_chart"
                  ? e.event_type === "trade"
                  : e.event_type !== "clipboard_copy",
              )
              .slice(0, 10)
              .map((e) => (
                <li key={e.id}>
                  {e.title} — {e.summary}
                </li>
              ))}
            {widget === "trading_chart" && (
              <textarea
                className="widget-textarea"
                placeholder="Log a trade…"
                rows={3}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            )}
            {widget === "trading_chart" && (
              <button
                type="button"
                className="widget-action-btn"
                onClick={() =>
                  void memoryApi
                    .createCapture("trade", draft, "Trade entry")
                    .then(() => memoryApi.listTimeline().then(setTimeline))
                }
              >
                Save trade note
              </button>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
