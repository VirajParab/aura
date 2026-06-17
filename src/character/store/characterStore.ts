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
  spawnedObjects: SpawnableObject[];
  isLoading: boolean;

  setManifest: (manifest: CharacterManifest) => void;
  setActiveCharacter: (character: CharacterDefinition) => void;
  setSettings: (settings: AppSettings) => void;
  setActivity: (activity: string) => void;
  setSpeechBubble: (text: string | null) => void;
  openWidget: (widget: WidgetType | null) => void;
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
  spawnedObjects: [],
  isLoading: true,

  setManifest: (manifest) => set({ manifest }),
  setActiveCharacter: (activeCharacter) => set({ activeCharacter }),
  setSettings: (settings) => set({ settings }),
  setActivity: (currentActivity) => set({ currentActivity }),
  setSpeechBubble: (speechBubble) => set({ speechBubble }),
  openWidget: (activeWidget) => set({ activeWidget }),
  addSpawnedObject: (obj) =>
    set((s) => ({ spawnedObjects: [...s.spawnedObjects, obj] })),
  removeSpawnedObject: (id) =>
    set((s) => ({
      spawnedObjects: s.spawnedObjects.filter((o) => o.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));
