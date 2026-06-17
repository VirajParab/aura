import { useEffect, useRef } from "react";
import { characterHeightPx } from "@/character/companionSettings";
import { computeActivityTransform, type PoseContext } from "@/character/engine/activityPose";
import type { CharacterActivity, CharacterDefinition } from "@/types/character";
import type { AppSettings } from "@/types/character";

interface CompanionSpriteProps {
  character: CharacterDefinition;
  settings: AppSettings;
  position: { x: number; y: number };
  activity: CharacterActivity;
  velocityX?: number;
  upsideDown?: boolean;
  hanging?: boolean;
  floating?: boolean;
}

export function CompanionSprite({
  character,
  settings,
  position,
  activity,
  velocityX = 0,
  upsideDown = false,
  hanging = false,
  floating = false,
}: CompanionSpriteProps) {
  const activityStartedAt = useRef(Date.now());
  const lastActivity = useRef(activity);
  const frameRef = useRef<number | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const heightPx = characterHeightPx(character.scale, settings.companion_scale);
  const fontSize = Math.max(28, heightPx * 0.55);

  useEffect(() => {
    if (activity !== lastActivity.current) {
      lastActivity.current = activity;
      activityStartedAt.current = Date.now();
    }
  }, [activity]);

  useEffect(() => {
    const animate = () => {
      const el = nodeRef.current;
      if (el) {
        const pose = computeActivityTransform(activity, {
          timeMs: performance.now(),
          activityElapsedMs: performance.now() - activityStartedAt.current,
          velocityX,
          moving: Math.abs(velocityX) > 8,
          upsideDown,
          hanging,
          floating,
        } satisfies PoseContext);
        const flip = pose.rotationY > Math.PI / 2 ? -1 : 1;
        el.style.transform = `translate(-50%, -92%) translate(${pose.offsetX}px, ${pose.offsetY}px) rotate(${pose.rotationZ}rad) scale(${pose.scaleX * flip}, ${pose.scaleY})`;
      }
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [activity, velocityX, upsideDown, hanging, floating]);

  return (
    <div
      ref={nodeRef}
      className="companion-sprite"
      style={{
        left: position.x,
        top: position.y,
        fontSize: `${fontSize}px`,
      }}
      aria-hidden
    >
      {character.emoji}
    </div>
  );
}
