import { useState, type CSSProperties } from "react";
import { companionBodyHitCircle } from "@/character/companionSettings";
import {
  getCompanionMenuLayout,
  radialMenuPosition,
  type CompanionMenuAction,
} from "@/character/engine/characterPlatform";
import type { CharacterDefinition } from "@/types/character";
import type { AppSettings } from "@/types/character";

interface CompanionActionMenuProps {
  character: CharacterDefinition;
  settings: AppSettings;
  position: { x: number; y: number };
  onSelect: (action: CompanionMenuAction) => void;
  onClose: () => void;
}

function ActionOrb({
  action,
  style,
  size = "md",
  onSelect,
}: {
  action: CompanionMenuAction;
  style: CSSProperties;
  size?: "sm" | "md" | "lg";
  onSelect: (action: CompanionMenuAction) => void;
}) {
  return (
    <button
      type="button"
      className={`companion-radial-item companion-radial-item--${size} companion-radial-item--${action.kind}`}
      style={style}
      role="menuitem"
      title={action.label}
      onClick={() => onSelect(action)}
    >
      <span className="companion-radial-item-emoji">{action.emoji}</span>
      <span className="companion-radial-item-label">{action.label}</span>
    </button>
  );
}

export function CompanionActionMenu({
  character,
  settings,
  position,
  onSelect,
  onClose,
}: CompanionActionMenuProps) {
  const [expanded, setExpanded] = useState(false);
  const layout = getCompanionMenuLayout(character);
  const hit = companionBodyHitCircle(position, character.scale, settings.companion_scale);
  const scale = settings.companion_scale;
  const bodyRadius = hit.radius;
  const arcRadius = bodyRadius + 36 + scale * 10;
  const primaryRadius = bodyRadius + 14 + scale * 4;

  const centerX = hit.x;
  const centerY = hit.y;

  const primaryAngles = [252, 288];
  const arcCount = layout.arc.length;
  const arcStart = 205;
  const arcEnd = 335;

  return (
    <>
      <button
        type="button"
        className="companion-action-menu-backdrop"
        aria-label="Close menu"
        onClick={onClose}
      />

      <div
        className="companion-radial-menu"
        style={{ left: centerX, top: centerY }}
        role="menu"
        aria-label={`${character.name} actions`}
      >
        {/* Body ring — model footprint */}
        <div
          className="companion-radial-body-ring"
          style={{
            width: bodyRadius * 2,
            height: bodyRadius * 2,
          }}
          aria-hidden
        />

        {!expanded ? (
          <button
            type="button"
            className="companion-radial-hub"
            style={{
              width: 52 + scale * 8,
              height: 52 + scale * 8,
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => setExpanded(true)}
            aria-expanded={false}
            aria-label="Show actions"
          >
            <span className="companion-radial-hub-emoji">{character.emoji}</span>
            <span className="companion-radial-hub-hint">Actions</span>
          </button>
        ) : (
          <>
            <div
              className="companion-radial-arc-guide"
              style={{
                width: arcRadius * 2 + 48,
                height: arcRadius + bodyRadius * 0.5,
              }}
              aria-hidden
            />

            {layout.primary.map((action, i) => {
              const pos = radialMenuPosition(
                0,
                0,
                primaryRadius,
                primaryAngles[i] ?? 270,
              );
              return (
                <ActionOrb
                  key={action.id}
                  action={action}
                  size="lg"
                  style={{
                    left: pos.left,
                    top: pos.top,
                    transform: "translate(-50%, -50%)",
                    animationDelay: `${i * 40}ms`,
                  }}
                  onSelect={onSelect}
                />
              );
            })}

            {layout.arc.map((action, i) => {
              const angle =
                arcCount <= 1
                  ? 270
                  : arcStart + ((arcEnd - arcStart) * i) / (arcCount - 1);
              const pos = radialMenuPosition(0, 0, arcRadius, angle);
              return (
                <ActionOrb
                  key={action.id}
                  action={action}
                  size="sm"
                  style={{
                    left: pos.left,
                    top: pos.top,
                    transform: "translate(-50%, -50%)",
                    animationDelay: `${80 + i * 35}ms`,
                  }}
                  onSelect={onSelect}
                />
              );
            })}

            <button
              type="button"
              className="companion-radial-close"
              style={{
                left: 0,
                top: -(primaryRadius + 22),
                transform: "translate(-50%, -50%)",
              }}
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </>
        )}
      </div>
    </>
  );
}
