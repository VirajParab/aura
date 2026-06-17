import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, type RefObject } from "react";
import { mergeSettings } from "@/character/companionSettings";
import type { CharacterEngine } from "@/character/engine/CharacterEngine";
import type { SceneManager } from "@/character/renderer/SceneManager";
import { settingsDiffer } from "@/character/settingsSync";
import { useCharacterStore } from "@/character/store/characterStore";
import type { AppSettings } from "@/types/character";

const POLL_MS = 200;

export function useOverlaySettingsSync(
  engineRef: RefObject<CharacterEngine | null>,
  sceneRef: RefObject<SceneManager | null>,
  enabled: boolean,
) {
  const applySettings = useCallback(
    (raw: Partial<AppSettings> | AppSettings) => {
      const merged = mergeSettings(raw);
      const store = useCharacterStore.getState();

      store.setSettings(merged);

      const manifest = store.manifest;
      if (manifest) {
        const character = manifest.characters.find(
          (c) => c.id === merged.active_character_id,
        );
        if (character) {
          store.setActiveCharacter(character);
        }
      }

      engineRef.current?.applyCompanionSettings(merged);
      sceneRef.current?.setCompanionScale(merged.companion_scale);
    },
    [engineRef, sceneRef],
  );

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    async function pullFromDb() {
      try {
        const remote = mergeSettings(
          await invoke<AppSettings>("get_app_settings"),
        );
        if (!mounted) return;

        const local = mergeSettings(useCharacterStore.getState().settings);
        if (settingsDiffer(local, remote)) {
          applySettings(remote);
        }
      } catch (err) {
        console.warn("Overlay settings sync failed:", err);
      }
    }

    pullFromDb();
    const pollId = setInterval(pullFromDb, POLL_MS);

    let unlisten: (() => void) | undefined;
    listen<AppSettings>("settings-updated", (event) => {
      applySettings(event.payload);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      mounted = false;
      clearInterval(pollId);
      unlisten?.();
    };
  }, [enabled, applySettings]);
}
