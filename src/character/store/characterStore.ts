import { create } from "zustand";
import type {
  AppSettings,
  CharacterDefinition,
  CharacterManifest,
  SpawnableObject,
  WidgetType,
} from "@/types/character";

interface CharacterStore {
  manifest: CharacterManifest | null;
  activeCharacter: CharacterDefinition | null;
  settings: AppSettings | null;
  currentActivity: string;
  speechBubble: string | null;
  activeWidget: WidgetType | null;
  widgetVariant: string | null;
  spawnedObjects: SpawnableObject[];
  isLoading: boolean;
  hideCompanionVisual: boolean;

  setManifest: (manifest: CharacterManifest) => void;
  setActiveCharacter: (character: CharacterDefinition) => void;
  setSettings: (settings: AppSettings) => void;
  setActivity: (activity: string) => void;
  setSpeechBubble: (text: string | null) => void;
  openWidget: (widget: WidgetType | null, variant?: string | null) => void;
  setHideCompanionVisual: (hide: boolean) => void;
  addSpawnedObject: (obj: SpawnableObject) => void;
  removeSpawnedObject: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useCharacterStore = create<CharacterStore>((set) => ({
  manifest: null,
  activeCharacter: null,
  settings: null,
  currentActivity: "sit",
  speechBubble: null,
  activeWidget: null,
  widgetVariant: null,
  spawnedObjects: [],
  isLoading: true,
  hideCompanionVisual: false,

  setManifest: (manifest) => set({ manifest }),
  setActiveCharacter: (activeCharacter) => set({ activeCharacter }),
  setSettings: (settings) => set({ settings }),
  setActivity: (currentActivity) => set({ currentActivity }),
  setSpeechBubble: (speechBubble) => set({ speechBubble }),
  openWidget: (activeWidget, variant = null) =>
    set({ activeWidget, widgetVariant: variant ?? null }),
  setHideCompanionVisual: (hideCompanionVisual) => set({ hideCompanionVisual }),
  addSpawnedObject: (obj) =>
    set((s) => ({ spawnedObjects: [...s.spawnedObjects, obj] })),
  removeSpawnedObject: (id) =>
    set((s) => ({
      spawnedObjects: s.spawnedObjects.filter((o) => o.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));
