import type { CharacterDefinition } from "@/types/character";

interface OnboardingModalProps {
  characters: CharacterDefinition[];
  onSelect: (character: CharacterDefinition) => void;
}

export function OnboardingModal({ characters, onSelect }: OnboardingModalProps) {
  return (
    <div className="onboarding-backdrop">
      <div className="onboarding-modal">
        <h2>Welcome to AuraOS</h2>
        <p>Pick your companion — they are the UI for your second brain.</p>
        <div className="onboarding-grid">
          {characters.map((c) => (
            <button
              key={c.id}
              type="button"
              className="onboarding-card"
              onClick={() => onSelect(c)}
            >
              <span className="onboarding-emoji">{c.emoji}</span>
              <strong>{c.name}</strong>
              <small>{c.personality_prompt}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
