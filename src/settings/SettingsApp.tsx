import { useState } from "react";
import {
  MAX_COMPANION_SCALE,
  MIN_COMPANION_SCALE,
  mergeSettings,
} from "@/character/companionSettings";
import { feedTreat, selectCharacter, saveSettings } from "@/character/hooks/useAuraBootstrap";
import { useCharacterStore } from "@/character/store/characterStore";
import { OnboardingModal } from "@/features/onboarding/OnboardingModal";
import type { AppSettings, CharacterDefinition } from "@/types/character";

type SettingsTab = "characters" | "appearance" | "movement" | "display";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "characters", label: "Characters" },
  { id: "appearance", label: "Appearance" },
  { id: "movement", label: "Movement" },
  { id: "display", label: "Display" },
];

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatScale(value: number): string {
  return `${value.toFixed(1)}×`;
}

export function SettingsApp() {
  const [tab, setTab] = useState<SettingsTab>("characters");
  const manifest = useCharacterStore((s) => s.manifest);
  const activeCharacter = useCharacterStore((s) => s.activeCharacter);
  const rawSettings = useCharacterStore((s) => s.settings);
  const settings = mergeSettings(rawSettings);
  const setSettings = useCharacterStore((s) => s.setSettings);
  const isLoading = useCharacterStore((s) => s.isLoading);

  if (isLoading) {
    return <div className="settings-app loading">Loading AuraOS...</div>;
  }

  if (!rawSettings) {
    return <div className="settings-app loading">Loading settings...</div>;
  }

  const launchCharacters =
    manifest?.characters.filter((c) =>
      manifest.launch_lineup.includes(c.id),
    ) ?? [];

  const handleSelect = async (character: CharacterDefinition) => {
    await selectCharacter(character);
    if (!settings.onboarding_completed) {
      const next = { ...settings, onboarding_completed: true };
      setSettings(next);
      await saveSettings(next);
    }
  };

  const showOnboarding =
    !settings.onboarding_completed && launchCharacters.length > 0;

  const toggle = async (key: keyof AppSettings) => {
    if (!settings) return;
    const value = settings[key];
    if (typeof value !== "boolean") return;
    const next = { ...settings, [key]: !value };
    setSettings(next);
    await saveSettings(next);
  };

  const patch = async (partial: Partial<AppSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...partial };
    setSettings(next);
    await saveSettings(next);
  };

  const cursorFollowActive =
    settings.follow_cursor && !!activeCharacter?.behaviors.follow_cursor;

  return (
    <div className="settings-app">
      {showOnboarding && (
        <OnboardingModal characters={launchCharacters} onSelect={handleSelect} />
      )}
      <header className="settings-header">
        <h1>AuraOS</h1>
        <p>Companion settings</p>
      </header>

      <nav className="settings-tabs" aria-label="Settings sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`settings-tab ${tab === item.id ? "active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="settings-content">
        {tab === "characters" && (
          <>
            <div className="character-grid">
              {launchCharacters.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  className={`character-card ${
                    activeCharacter?.id === character.id ? "active" : ""
                  }`}
                  onClick={() => handleSelect(character)}
                >
                  <span className="character-card-emoji">{character.emoji}</span>
                  <strong>{character.name}</strong>
                  <small>{character.personality_prompt.slice(0, 60)}...</small>
                </button>
              ))}
            </div>

            {activeCharacter && (
              <section className="settings-section settings-section-first">
                <h2>Active: {activeCharacter.name}</h2>
                <ul className="settings-details">
                  <li>Widget: {activeCharacter.widget}</li>
                  <li>Tricks: {activeCharacter.special_tricks.join(", ")}</li>
                  <li>Spawns: {activeCharacter.spawn_objects.join(", ")}</li>
                </ul>
                <div className="settings-actions">
                  <button
                    type="button"
                    className="settings-button"
                    onClick={() => feedTreat()}
                  >
                    Feed treat 🦴
                  </button>
                </div>
                <div className="settings-hints">
                  <h3>Interactions</h3>
                  <ul>
                    <li>
                      Click — {activeCharacter.interactions.single_click.replace(/_/g, " ")}
                    </li>
                    <li>
                      Double-click — {activeCharacter.interactions.double_click.replace(/_/g, " ")}
                      {" "}(alternates on repeat)
                    </li>
                    <li>
                      Long press — {activeCharacter.interactions.long_press.replace(/_/g, " ")}
                    </li>
                    <li>
                      Spawns — {activeCharacter.spawn_objects.join(", ").replace(/_/g, " ")}
                    </li>
                  </ul>
                </div>
              </section>
            )}
          </>
        )}

        {tab === "appearance" && (
          <section className="settings-section settings-section-first">
            <h2>Size &amp; position</h2>
            <label className="settings-row">
              <span>
                Size{" "}
                <em className="settings-value">
                  {formatScale(settings.companion_scale)}
                </em>
              </span>
              <input
                type="range"
                min={MIN_COMPANION_SCALE}
                max={MAX_COMPANION_SCALE}
                step={0.1}
                value={settings.companion_scale}
                onChange={(e) =>
                  patch({ companion_scale: parseFloat(e.target.value) })
                }
              />
            </label>
            <label className="settings-row">
              <span>
                Horizontal{" "}
                <em className="settings-value">
                  {formatPercent(settings.position_x_percent)}
                </em>
              </span>
              <input
                type="range"
                min={5}
                max={95}
                step={1}
                value={settings.position_x_percent}
                disabled={cursorFollowActive}
                onChange={(e) =>
                  patch({ position_x_percent: parseFloat(e.target.value) })
                }
              />
            </label>
            <label className="settings-row">
              <span>
                Vertical{" "}
                <em className="settings-value">
                  {formatPercent(settings.position_y_percent)}
                </em>
              </span>
              <input
                type="range"
                min={10}
                max={95}
                step={1}
                value={settings.position_y_percent}
                onChange={(e) =>
                  patch({ position_y_percent: parseFloat(e.target.value) })
                }
              />
            </label>
            {cursorFollowActive ? (
              <p className="settings-note">
                Mochi follows the cursor horizontally. Use <strong>Vertical</strong>{" "}
                to move the floor line up/down (updates within a moment).
              </p>
            ) : settings.follow_cursor && activeCharacter && !activeCharacter.behaviors.follow_cursor ? (
              <p className="settings-note">
                {activeCharacter.name} does not follow the cursor — use the
                horizontal and vertical sliders to place them.
              </p>
            ) : (
              <p className="settings-note">
                Drag both sliders to place the companion. Turn on follow cursor
                in Movement (Mochi only) to chase the mouse horizontally.
              </p>
            )}
            <p className="settings-note">
              Size range is {MIN_COMPANION_SCALE}×–{MAX_COMPANION_SCALE}×. At 10×
              the companion fills most of the screen height.
            </p>
          </section>
        )}

        {tab === "movement" && (
          <section className="settings-section settings-section-first">
            <h2>Movement &amp; physics</h2>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.follow_cursor}
                onChange={() => toggle("follow_cursor")}
              />
              Follow cursor
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.locomotion_enabled}
                onChange={() => toggle("locomotion_enabled")}
              />
              Walk &amp; run animations
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.idle_bob}
                onChange={() => toggle("idle_bob")}
              />
              Idle bobbing
            </label>
            <label className="settings-row">
              <span>
                Move speed{" "}
                <em className="settings-value">
                  {Math.round(settings.move_speed)} px/s
                </em>
              </span>
              <input
                type="range"
                min={50}
                max={250}
                step={10}
                value={settings.move_speed}
                disabled={!settings.locomotion_enabled}
                onChange={(e) =>
                  patch({ move_speed: parseFloat(e.target.value) })
                }
              />
            </label>
          </section>
        )}

        {tab === "display" && (
          <section className="settings-section settings-section-first">
            <h2>Display</h2>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.companion_enabled}
                onChange={() => toggle("companion_enabled")}
              />
              Show companion on desktop
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.reaction_preferences}
                onChange={() => toggle("reaction_preferences")}
              />
              Activity reactions (coding, trading, captures)
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.reduce_motion}
                onChange={() => toggle("reduce_motion")}
              />
              Reduce motion
            </label>
            <label className="settings-row">
              <span>
                Opacity{" "}
                <em className="settings-value">
                  {Math.round(settings.companion_opacity * 100)}%
                </em>
              </span>
              <input
                type="range"
                min={0.5}
                max={1}
                step={0.05}
                value={settings.companion_opacity}
                onChange={(e) =>
                  patch({ companion_opacity: parseFloat(e.target.value) })
                }
              />
            </label>
          </section>
        )}

        {!rawSettings && tab !== "characters" && (
          <p className="settings-note">Settings failed to load. Restart the app.</p>
        )}
      </div>
    </div>
  );
}
