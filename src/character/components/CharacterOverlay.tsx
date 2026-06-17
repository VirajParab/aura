import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import {
  CharacterEngine,
  getCursorPosition,
  setOverlayClickthrough,
  setupOverlayWindow,
} from "@/character/engine/CharacterEngine";
import { SceneManager } from "@/character/renderer/SceneManager";
import { useCharacterStore } from "@/character/store/characterStore";
import { SpeechBubble } from "./SpeechBubble";
import { SpawnedObjectsLayer } from "./SpawnedObjectsLayer";
import { WidgetPanel } from "./WidgetPanel";
import type { SpawnableObject } from "@/types/character";

const DEFAULT_POSITION = {
  x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
  y: typeof window !== "undefined" ? window.innerHeight - 80 : 0,
};

export function CharacterOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CharacterEngine | null>(null);
  const sceneRef = useRef<SceneManager | null>(null);
  const [spawned, setSpawned] = useState<SpawnableObject[]>([]);
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [characterLoading, setCharacterLoading] = useState(false);

  const activeCharacter = useCharacterStore((s) => s.activeCharacter);
  const settings = useCharacterStore((s) => s.settings);
  const currentActivity = useCharacterStore((s) => s.currentActivity);
  const speechBubble = useCharacterStore((s) => s.speechBubble);
  const activeWidget = useCharacterStore((s) => s.activeWidget);
  const setActivity = useCharacterStore((s) => s.setActivity);
  const setSpeechBubble = useCharacterStore((s) => s.setSpeechBubble);
  const openWidget = useCharacterStore((s) => s.openWidget);

  useEffect(() => {
    let mounted = true;

    async function init() {
      await setupOverlayWindow();

      const engine = new CharacterEngine({
        onActivityChange: setActivity,
        onSpeech: setSpeechBubble,
        onWidgetOpen: openWidget,
      });
      engineRef.current = engine;
      setPosition(engine.getPosition());

      if (canvasRef.current) {
        const scene = new SceneManager(canvasRef.current);
        sceneRef.current = scene;
        scene.startLoop(
          () => engine.getPosition(),
          () => engine.getActivity(),
          (pos) => {
            if (mounted) setPosition(pos);
          },
        );
      }

      engine.spawner.subscribe((objects) => {
        if (mounted) setSpawned(objects);
      });

      engine.start();

      const onResize = () => {
        engine.resize(window.innerWidth, window.innerHeight);
        sceneRef.current?.resize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
      };
    }

    const cleanupResize = init();

    return () => {
      mounted = false;
      cleanupResize.then((fn) => fn?.());
      sceneRef.current?.dispose();
      engineRef.current?.stop();
    };
  }, [setActivity, setSpeechBubble, openWidget]);

  useEffect(() => {
    if (!activeCharacter || !settings || !engineRef.current) return;

    let cancelled = false;
    setCharacterLoading(true);

    engineRef.current.loadCharacter(
      activeCharacter,
      settings.follow_cursor && !settings.reduce_motion,
    );

    sceneRef.current
      ?.setCharacter(activeCharacter)
      .catch((err) => console.error("Failed to load character renderer:", err))
      .finally(() => {
        if (!cancelled) setCharacterLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCharacter, settings]);

  useEffect(() => {
    if (!settings?.companion_enabled) return;

    const trackCursor = async () => {
      try {
        const pos = await getCursorPosition();
        engineRef.current?.setCursorPosition(pos.x, pos.y);
      } catch {
        // unavailable outside Tauri
      }
    };

    const id = setInterval(trackCursor, 100);
    return () => clearInterval(id);
  }, [settings?.companion_enabled]);

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

  const handlePointerMove = async (e: React.PointerEvent) => {
    const hit = sceneRef.current
      ?.getCharacterRenderer()
      ?.hitTest(e.clientX, e.clientY);

    await setOverlayClickthrough(!hit);
  };

  const handlePointerDown = async (e: React.PointerEvent) => {
    const hit = sceneRef.current
      ?.getCharacterRenderer()
      ?.hitTest(e.clientX, e.clientY);
    if (hit) {
      await setOverlayClickthrough(false);
      engineRef.current?.handlePointerDown(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    engineRef.current?.handlePointerUp(e.clientX, e.clientY);
    setOverlayClickthrough(true);
  };

  if (!settings?.companion_enabled || !activeCharacter) {
    return <div className="overlay-root" />;
  }

  return (
    <div
      className="overlay-root"
      style={{ opacity: settings.companion_opacity }}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <canvas ref={canvasRef} className="overlay-canvas" />
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
        style={{ left: position.x - 20, top: position.y + 20 }}
      >
        <span className="character-hud-emoji">{activeCharacter.emoji}</span>
        <span className="character-hud-activity">{currentActivity}</span>
      </div>
    </div>
  );
}
