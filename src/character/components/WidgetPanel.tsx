import type { CharacterDefinition, WidgetType } from "@/types/character";

const WIDGET_TITLES: Record<WidgetType, string> = {
  quick_notes: "Quick Notes",
  clipboard_history: "Clipboard History",
  journal: "Journal",
  ai_search: "AI Search",
  trading_chart: "Trading Chart",
  vault: "Vault",
};

const WIDGET_STUB: Record<WidgetType, string> = {
  quick_notes: "Capture a thought — wired to real notes in Phase 2.",
  clipboard_history: "Your copied commands and snippets will appear here.",
  journal: "Daily reflections and emotional check-ins.",
  ai_search: "Ask Aura anything about your memory.",
  trading_chart: "Trading stats and journal entries.",
  vault: "Protected secrets and sensitive captures.",
};

interface WidgetPanelProps {
  widget: WidgetType;
  character: CharacterDefinition;
  onClose: () => void;
}

export function WidgetPanel({ widget, character, onClose }: WidgetPanelProps) {
  return (
    <div className="widget-panel" onClick={(e) => e.stopPropagation()}>
      <div className="widget-panel-header">
        <span>
          {character.emoji} {WIDGET_TITLES[widget]}
        </span>
        <button type="button" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="widget-panel-body">
        <p className="widget-stub-badge">Phase 1 stub — Phase 2 wires live data</p>
        <p>{WIDGET_STUB[widget]}</p>
        <textarea
          className="widget-textarea"
          placeholder={`${character.name} is ready...`}
          rows={4}
        />
      </div>
    </div>
  );
}
