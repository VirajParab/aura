import { feedTreat, selectCharacter, saveSettings } from "@/character/hooks/useAuraBootstrap";
import { useCharacterStore } from "@/character/store/characterStore";
import type { CharacterDefinition } from "@/types/character";

export function SettingsApp() {
  const manifest = useCharacterStore((s) => s.manifest);
  const activeCharacter = useCharacterStore((s) => s.activeCharacter);
  const settings = useCharacterStore((s) => s.settings);
  const setSettings = useCharacterStore((s) => s.setSettings);
  const isLoading = useCharacterStore((s) => s.isLoading);

  if (isLoading) {
    return <div className="settings-app loading">Loading AuraOS...</div>;
  }

  const launchCharacters =
    manifest?.characters.filter((c) =>
      manifest.launch_lineup.includes(c.id),
    ) ?? [];

  const handleSelect = async (character: CharacterDefinition) => {
    await selectCharacter(character);
  };

  const toggle = async (key: keyof NonNullable<typeof settings>) => {
    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    await saveSettings(next);
  };

  return (
    <div className="settings-app">
      <header className="settings-header">
        <h1>AuraOS</h1>
        <p>Choose your companion</p>
      </header>

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
        <section className="settings-section">
          <h2>Active: {activeCharacter.name}</h2>
          <ul className="settings-details">
            <li>Widget: {activeCharacter.widget}</li>
            <li>
              Tricks: {activeCharacter.special_tricks.join(", ")}
            </li>
            <li>
              Spawns: {activeCharacter.spawn_objects.join(", ")}
            </li>
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
              <li>Click — wave, bark, or character trick</li>
              <li>Double-click — open widget</li>
              <li>Long press — spawn object or special action</li>
              <li>Feed treat — plays eat animation on overlay</li>
            </ul>
          </div>
        </section>
      )}

      {settings && (
        <section className="settings-section">
          <h2>Preferences</h2>
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
              checked={settings.follow_cursor}
              onChange={() => toggle("follow_cursor")}
            />
            Follow cursor (Mochi)
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
            Opacity
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.05}
              value={settings.companion_opacity}
              onChange={async (e) => {
                const next = {
                  ...settings,
                  companion_opacity: parseFloat(e.target.value),
                };
                setSettings(next);
                await saveSettings(next);
              }}
            />
          </label>
        </section>
      )}
    </div>
  );
}
