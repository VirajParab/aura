import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { useCharacterStore } from "@/character/store/characterStore";
import type {
  AppSettings,
  CharacterDefinition,
  CharacterManifest,
} from "@/types/character";
import { DEFAULT_APP_SETTINGS, mergeSettings } from "@/character/companionSettings";

export function useAuraBootstrap() {
  const setManifest = useCharacterStore((s) => s.setManifest);
  const setActiveCharacter = useCharacterStore((s) => s.setActiveCharacter);
  const setSettings = useCharacterStore((s) => s.setSettings);
  const setLoading = useCharacterStore((s) => s.setLoading);

  useEffect(() => {
    async function load() {
      try {
        const [manifest, settings] = await Promise.all([
          invoke<CharacterManifest>("get_character_manifest"),
          invoke<AppSettings>("get_app_settings"),
        ]);
        setManifest(manifest);
        setSettings(mergeSettings(settings));

        const character =
          manifest.characters.find(
            (c) => c.id === settings.active_character_id,
          ) ?? manifest.characters[0];

        if (character) {
          setActiveCharacter(character);
        }
      } catch (err) {
        console.error("Failed to bootstrap Aura:", err);
        const { default: manifest } = await import(
          "../../../characters/manifest.json"
        );
        const m = manifest as CharacterManifest;
        setManifest(m);
        setSettings(DEFAULT_APP_SETTINGS);
        setActiveCharacter(m.characters[0]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [setManifest, setActiveCharacter, setSettings, setLoading]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    listen<AppSettings>("settings-updated", (event) => {
      const settings = mergeSettings(event.payload);
      setSettings(settings);

      const manifest = useCharacterStore.getState().manifest;
      if (!manifest) return;

      const character = manifest.characters.find(
        (c) => c.id === settings.active_character_id,
      );
      if (character) {
        setActiveCharacter(character);
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, [setSettings, setActiveCharacter]);
}

export async function saveSettings(settings: AppSettings) {
  await invoke("set_app_settings", { settings });
}

export async function selectCharacter(character: CharacterDefinition) {
  const settings = useCharacterStore.getState().settings;
  if (!settings) return;
  const next = { ...settings, active_character_id: character.id };
  await saveSettings(next);
  useCharacterStore.getState().setSettings(next);
  useCharacterStore.getState().setActiveCharacter(character);
}

export async function feedTreat() {
  await invoke("feed_treat");
}
