import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import {
  characterHeightPx,
  mergeSettings,
} from "@/character/companionSettings";
import { CompanionSprite } from "@/character/components/CompanionSprite";
import {
  CharacterEngine,
  getCursorPosition,
  setOverlayClickthrough,
  setupOverlayWindow,
} from "@/character/engine/CharacterEngine";
import { useOverlaySettingsSync } from "@/character/hooks/useOverlaySettingsSync";
import { SceneManager } from "@/character/renderer/SceneManager";
import { useCharacterStore } from "@/character/store/characterStore";
import { SpeechBubble } from "./SpeechBubble";
import { SpawnedObjectsLayer } from "./SpawnedObjectsLayer";
import { WidgetPanel } from "./WidgetPanel";
import type { CharacterDefinition, SpawnableObject } from "@/types/character";
import type { AppSettings } from "@/types/character";

function hitCompanion(
  x: number,
  y: number,
  position: { x: number; y: number },
  character: CharacterDefinition,
  settings: AppSettings,
): boolean {
  const radius = characterHeightPx(character.scale, settings.companion_scale) * 0.45;
  const dx = x - position.x;
  const dy = y - position.y;
  return dx * dx + dy * dy < radius * radius;
}

export function CharacterOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CharacterEngine | null>(null);
  const sceneRef = useRef<SceneManager | null>(null);
  const loadedCharacterIdRef = useRef<string | null>(null);
  const [spawned, setSpawned] = useState<SpawnableObject[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [characterLoading, setCharacterLoading] = useState(false);
  const [engineReady, setEngineReady] = useState(false);

  const activeCharacter = useCharacterStore((s) => s.activeCharacter);
  const settings = useCharacterStore((s) => s.settings);
  const currentActivity = useCharacterStore((s) => s.currentActivity);
  const speechBubble = useCharacterStore((s) => s.speechBubble);
  const activeWidget = useCharacterStore((s) => s.activeWidget);
  const setActivity = useCharacterStore((s) => s.setActivity);
  const setSpeechBubble = useCharacterStore((s) => s.setSpeechBubble);
  const openWidget = useCharacterStore((s) => s.openWidget);

  const mergedSettings = mergeSettings(settings);

  useOverlaySettingsSync(engineRef, sceneRef, engineReady);

  useEffect(() => {
    let mounted = true;

    async function init() {
      await setupOverlayWindow();
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      const engine = new CharacterEngine({
        onActivityChange: setActivity,
        onSpeech: setSpeechBubble,
        onWidgetOpen: openWidget,
      });
      engineRef.current = engine;

      const w = window.innerWidth;
      const h = window.innerHeight;
      engine.resize(w, h);
      setPosition({ x: w / 2, y: h * 0.88 });

      if (canvasRef.current) {
        const scene = new SceneManager(canvasRef.current);
        sceneRef.current = scene;
        scene.resize(w, h);
        scene.startLoop(
          () => engine.getPosition(),
          () => engine.getActivity(),
          (pos) => {
            if (mounted) setPosition(pos);
          },
          () =>
            mergeSettings(useCharacterStore.getState().settings).companion_scale,
        );
      }

      engine.spawner.subscribe((objects) => {
        if (mounted) setSpawned(objects);
      });

      const bootSettings = mergeSettings(useCharacterStore.getState().settings);
      if (useCharacterStore.getState().activeCharacter) {
        engine.loadCharacter(
          useCharacterStore.getState().activeCharacter!,
          bootSettings,
        );
        engine.applyCompanionSettings(bootSettings);
        sceneRef.current?.setCompanionScale(bootSettings.companion_scale);
      }

      engine.start();

      const onResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        engine.resize(width, height);
        sceneRef.current?.resize(width, height);
        engine.applyCompanionSettings(
          mergeSettings(useCharacterStore.getState().settings),
        );
      };
      window.addEventListener("resize", onResize);

      if (mounted) setEngineReady(true);

      return () => {
        window.removeEventListener("resize", onResize);
      };
    }

    const cleanupResize = init();

    return () => {
      mounted = false;
      setEngineReady(false);
      loadedCharacterIdRef.current = null;
      cleanupResize.then((fn) => fn?.());
      sceneRef.current?.dispose();
      engineRef.current?.stop();
    };
  }, [setActivity, setSpeechBubble, openWidget]);

  useEffect(() => {
    if (!engineReady || !activeCharacter || !sceneRef.current) return;

    const merged = mergeSettings(settings);
    engineRef.current?.loadCharacter(activeCharacter, merged);
    sceneRef.current.setCompanionScale(merged.companion_scale);

    if (loadedCharacterIdRef.current === activeCharacter.id) return;

    let cancelled = false;
    loadedCharacterIdRef.current = activeCharacter.id;
    setCharacterLoading(true);

    sceneRef.current
      .setCharacter(activeCharacter)
      .then(() => {
        if (!cancelled) {
          sceneRef.current?.setCompanionScale(merged.companion_scale);
        }
      })
      .catch((err) => console.error("Failed to load character renderer:", err))
      .finally(() => {
        if (!cancelled) setCharacterLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [engineReady, activeCharacter?.id, settings?.active_character_id]);

  useEffect(() => {
    if (
      !mergedSettings.companion_enabled ||
      !mergedSettings.follow_cursor ||
      mergedSettings.reduce_motion ||
      !activeCharacter?.behaviors.follow_cursor
    ) {
      return;
    }

    const trackCursor = async () => {
      try {
        const pos = await getCursorPosition();
        engineRef.current?.setCursorPosition(pos.x, pos.y);
      } catch {
        // unavailable outside Tauri
      }
    };

    trackCursor();
    const id = setInterval(trackCursor, 100);
    return () => clearInterval(id);
  }, [
    mergedSettings.companion_enabled,
    mergedSettings.follow_cursor,
    mergedSettings.reduce_motion,
    activeCharacter?.behaviors.follow_cursor,
    mergedSettings.position_y_percent,
  ]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    listen<{ action: string }>("companion-action", (event) => {
      if (event.payload.action === "feed_treat") {
        engineRef.current?.feedTreat();
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    if (!speechBubble) return;
    const id = setTimeout(() => setSpeechBubble(null), 3500);
    return () => clearTimeout(id);
  }, [speechBubble, setSpeechBubble]);

  const isHit = (x: number, y: number) => {
    if (!activeCharacter) return false;
    const rendererHit = sceneRef.current
      ?.getCharacterRenderer()
      ?.hitTest(x, y);
    if (rendererHit) return true;
    return hitCompanion(x, y, position, activeCharacter, mergedSettings);
  };

  const handlePointerMove = async (e: React.PointerEvent) => {
    await setOverlayClickthrough(!isHit(e.clientX, e.clientY));
  };

  const handlePointerDown = async (e: React.PointerEvent) => {
    if (isHit(e.clientX, e.clientY)) {
      await setOverlayClickthrough(false);
      engineRef.current?.handlePointerDown(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    engineRef.current?.handlePointerUp(e.clientX, e.clientY);
    setOverlayClickthrough(true);
  };

  if (!mergedSettings.companion_enabled || !activeCharacter) {
    return <div className="overlay-root" />;
  }

  return (
    <div
      className="overlay-root"
      style={{ opacity: mergedSettings.companion_opacity }}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <canvas ref={canvasRef} className="overlay-canvas" />
      <CompanionSprite
        character={activeCharacter}
        settings={mergedSettings}
        position={position}
      />
      {characterLoading && (
        <div className="overlay-loading" aria-live="polite">
          Loading {activeCharacter.name}...
        </div>
      )}
      <SpawnedObjectsLayer
        objects={spawned}
        onRemove={(id) => engineRef.current?.spawner.remove(id)}
      />
      {speechBubble && (
        <SpeechBubble
          text={speechBubble}
          position={position}
          emoji={activeCharacter.emoji}
        />
      )}
      {activeWidget && (
        <WidgetPanel
          widget={activeWidget}
          character={activeCharacter}
          onClose={() => openWidget(null)}
        />
      )}
      <div
        className="character-hud"
        style={{
          left: position.x,
          top: position.y + 12,
          transform: "translateX(-50%)",
          fontSize: `${10 + mergedSettings.companion_scale * 1.5}px`,
        }}
      >
        <span className="character-hud-activity">{currentActivity}</span>
      </div>
    </div>
  );
}
