import {
  getCompanionMenuActions,
  type CompanionMenuAction,
} from "@/character/engine/characterPlatform";
import type { CharacterDefinition } from "@/types/character";

interface CompanionActionMenuProps {
  character: CharacterDefinition;
  position: { x: number; y: number };
  onSelect: (action: CompanionMenuAction) => void;
  onClose: () => void;
}

export function CompanionActionMenu({
  character,
  position,
  onSelect,
  onClose,
}: CompanionActionMenuProps) {
  const actions = getCompanionMenuActions(character);

  return (
    <>
      <button
        type="button"
        className="companion-action-menu-backdrop"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        className="companion-action-menu"
        style={{
          left: position.x,
          top: position.y - 24,
          transform: "translate(-50%, -100%)",
        }}
        role="menu"
        aria-label={`${character.name} actions`}
      >
        <div className="companion-action-menu-header">
          <span>
            {character.emoji} {character.name}
          </span>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="companion-action-menu-grid">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={`companion-action-menu-item companion-action-menu-item--${action.kind}`}
              role="menuitem"
              onClick={() => onSelect(action)}
            >
              <span className="companion-action-menu-emoji">{action.emoji}</span>
              <span className="companion-action-menu-label">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
