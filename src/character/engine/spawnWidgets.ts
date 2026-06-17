import type { SpawnObjectType, WidgetType } from "@/types/character";

export const SPAWN_WIDGET_MAP: Partial<Record<SpawnObjectType, WidgetType>> = {
  sticky_note: "quick_notes",
  task_card: "quick_notes",
  mini_calendar: "journal",
  memory_orb: "clipboard_history",
  treasure_chest: "vault",
  chart_board: "trading_chart",
  terminal_screen: "ai_search",
};
