import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import { mergeSettings } from "@/character/companionSettings";
import { CompanionActionMenu } from "@/character/components/CompanionActionMenu";
import { CharacterHitTarget } from "@/character/components/CharacterHitTarget";
import { CompanionSprite } from "@/character/components/CompanionSprite";
import { CharacterEffects } from "@/character/components/CharacterEffects";
import { CompanionStateMachine } from "@/character/engine/CompanionStateMachine";
import {
  usesFloatIdle,
  usesUpsideDownSleep,
} from "@/character/engine/characterPlatform";
import { SPAWN_WIDGET_MAP } from "@/character/engine/spawnWidgets";
import {
  CharacterEngine,
  getCursorPosition,
  setupOverlayWindow,
} from "@/character/engine/CharacterEngine";
import { syncOverlayHitRegions } from "@/character/engine/overlayHit";
import { useOverlaySettingsSync } from "@/character/hooks/useOverlaySettingsSync";
import { SceneManager } from "@/character/renderer/SceneManager";
import { useCharacterStore } from "@/character/store/characterStore";
import { SpeechBubble } from "./SpeechBubble";
import { SpawnedObjectsLayer } from "./SpawnedObjectsLayer";
import { WidgetPanel } from "./WidgetPanel";
import type { SpawnableObject, CharacterActivity } from "@/types/character";

export function CharacterOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CharacterEngine | null>(null);
  const sceneRef = useRef<SceneManager | null>(null);
  const stateMachineRef = useRef(new CompanionStateMachine());
  const loadedCharacterIdRef = useRef<string | null>(null);
  const hitSyncRef = useRef(0);
  const actionMenuOpenRef = useRef(false);
  const [spawned, setSpawned] = useState<SpawnableObject[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [velocityX, setVelocityX] = useState(0);
  const [characterLoading, setCharacterLoading] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [show3dCanvas, setShow3dCanvas] = useState(false);
  const [domInput, setDomInput] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [activeEffect, setActiveEffect] = useState<
    "cherry_blossom" | "hologram" | "fire" | "none"
  >("none");

  const activeCharacter = useCharacterStore((s) => s.activeCharacter);
  const settings = useCharacterStore((s) => s.settings);
  const currentActivity = useCharacterStore((s) => s.currentActivity);
  const speechBubble = useCharacterStore((s) => s.speechBubble);
  const activeWidget = useCharacterStore((s) => s.activeWidget);
  const widgetVariant = useCharacterStore((s) => s.widgetVariant);
  const hideCompanionVisual = useCharacterStore((s) => s.hideCompanionVisual);
  const setActivity = useCharacterStore((s) => s.setActivity);
  const setSpeechBubble = useCharacterStore((s) => s.setSpeechBubble);
  const openWidget = useCharacterStore((s) => s.openWidget);
  const setHideCompanionVisual = useCharacterStore((s) => s.setHideCompanionVisual);

  const mergedSettings = mergeSettings(settings);

  useEffect(() => {
    actionMenuOpenRef.current = actionMenuOpen;
  }, [actionMenuOpen]);

  useOverlaySettingsSync(engineRef, sceneRef, engineReady);

  useEffect(() => {
    invoke<boolean>("overlay_uses_dom_input")
      .then(setDomInput)
      .catch(() => setDomInput(false));
  }, []);

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
        onHideVisual: setHideCompanionVisual,
        onEffectChange: setActiveEffect,
        onActionMenuChange: (open) => {
          if (open) {
            setActionMenuOpen((was) => !was);
          } else {
            setActionMenuOpen(false);
          }
        },
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
            if (mounted) {
              setPosition(pos);
              setVelocityX(engine.getVelocityX());

              const char = useCharacterStore.getState().activeCharacter;
              if (char) {
                const now = performance.now();
                if (now - hitSyncRef.current >= 16) {
                  hitSyncRef.current = now;
                  const s = mergeSettings(useCharacterStore.getState().settings);
                  const force =
                    !!useCharacterStore.getState().activeWidget ||
                    actionMenuOpenRef.current;
                  void syncOverlayHitRegions(
                    pos,
                    char,
                    s,
                    engine.spawner.getAll(),
                    force,
                  );
                }
              }
            }
          },
          () =>
            mergeSettings(useCharacterStore.getState().settings).companion_scale,
          () => engine.getVelocityX(),
          () => {
            const char = useCharacterStore.getState().activeCharacter;
            const activity = engine.getActivity();
            return {
              upsideDown:
                !!char &&
                usesUpsideDownSleep(char) &&
                activity === "sleep",
              hanging: engine.isHangMode(),
              floating: !!char && usesFloatIdle(char) && activity === "sit",
            };
          },
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

      const bootChar = useCharacterStore.getState().activeCharacter;
      if (bootChar) {
        void syncOverlayHitRegions(
          engine.getPosition(),
          bootChar,
          bootSettings,
          engine.spawner.getAll(),
          false,
        );
      }

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
          const hasVrm = sceneRef.current?.hasVrmModel() ?? false;
          setShow3dCanvas(hasVrm);
          if (!hasVrm) loadedCharacterIdRef.current = null;
        }
      })
      .catch((err) => {
        console.error("Failed to load character renderer:", err);
        if (!cancelled) {
          setShow3dCanvas(false);
          loadedCharacterIdRef.current = null;
        }
      })
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
    if (!engineReady || !activeCharacter) return;
    void syncOverlayHitRegions(
      position,
      activeCharacter,
      mergedSettings,
      spawned,
      !!activeWidget || actionMenuOpen,
    );
  }, [
    engineReady,
    activeCharacter,
    position.x,
    position.y,
    mergedSettings.companion_scale,
    activeWidget,
    actionMenuOpen,
    spawned,
  ]);

  useEffect(() => {
    if (domInput) return;

    let unlistenPointer: (() => void) | undefined;

    listen<{ phase: "down" | "up"; x: number; y: number }>(
      "companion-pointer",
      (event) => {
        const { phase, x, y } = event.payload;
        if (phase === "down") {
          engineRef.current?.handlePointerDown(x, y);
        } else {
          engineRef.current?.handlePointerUp(x, y);
        }
      },
    ).then((fn) => {
      unlistenPointer = fn;
    });

    return () => unlistenPointer?.();
  }, [domInput]);

  const handleCharacterPointerDown = (x: number, y: number) => {
    engineRef.current?.handlePointerDown(x, y);
  };

  const handleCharacterPointerUp = (x: number, y: number) => {
    engineRef.current?.handlePointerUp(x, y);
  };

  useEffect(() => {
    const id = setInterval(() => {
      void stateMachineRef.current.poll();
    }, 3000);
    const unsub = stateMachineRef.current.subscribe((_state, activity) => {
      const settings = mergeSettings(useCharacterStore.getState().settings);
      if (!settings.reaction_preferences) return;
      if (!engineRef.current?.animation.hasActiveOverlay) {
        engineRef.current?.animation.setBase(activity);
      }
    });
    return () => {
      clearInterval(id);
      unsub();
    };
  }, []);

  useEffect(() => {
    let unlistenAura: (() => void) | undefined;
    let unlisten: (() => void) | undefined;

    listen<{ type: string }>("aura-event", (event) => {
      stateMachineRef.current.onAuraEvent(event.payload.type);
      if (event.payload.type === "clipboard_copy") {
        engineRef.current?.animation.playOverlay("peek");
      }
    }).then((fn) => {
      unlistenAura = fn;
    });

    listen<{ action: string }>("companion-action", (event) => {
      if (event.payload.action === "feed_treat") {
        engineRef.current?.feedTreat();
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlistenAura?.();
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    if (!speechBubble) return;
    const id = setTimeout(() => setSpeechBubble(null), 3500);
    return () => clearTimeout(id);
  }, [speechBubble, setSpeechBubble]);

  if (!mergedSettings.companion_enabled || !activeCharacter) {
    return <div className="overlay-root" />;
  }

  return (
    <div
      className="overlay-root"
      style={{
        opacity:
          mergedSettings.companion_opacity * (hideCompanionVisual ? 0.25 : 1),
      }}
    >
      <canvas
        ref={canvasRef}
        className={`overlay-canvas${show3dCanvas ? "" : " overlay-canvas--hidden"}`}
      />
      {!show3dCanvas && activeCharacter && (
        <CompanionSprite
          character={activeCharacter}
          settings={mergedSettings}
          position={position}
          activity={currentActivity as CharacterActivity}
          velocityX={velocityX}
          upsideDown={
            usesUpsideDownSleep(activeCharacter) && currentActivity === "sleep"
          }
          hanging={engineRef.current?.isHangMode() ?? false}
          floating={usesFloatIdle(activeCharacter) && currentActivity === "sit"}
        />
      )}
      {activeCharacter && (
        <CharacterHitTarget
          character={activeCharacter}
          settings={mergedSettings}
          position={position}
          onPointerDown={domInput ? handleCharacterPointerDown : undefined}
          onPointerUp={domInput ? handleCharacterPointerUp : undefined}
        />
      )}
      {activeCharacter && (
        <CharacterEffects
          character={activeCharacter}
          effect={activeEffect}
          position={position}
        />
      )}
      {characterLoading && (
        <div className="overlay-loading" aria-live="polite">
          Loading {activeCharacter.name}...
        </div>
      )}
      <SpawnedObjectsLayer
        objects={spawned}
        characterPosition={position}
        onRemove={(id) => engineRef.current?.spawner.remove(id)}
        onOpen={(type) => {
          engineRef.current?.closeActionMenu();
          const widget = SPAWN_WIDGET_MAP[type];
          if (widget) openWidget(widget);
        }}
      />
      {speechBubble && (
        <SpeechBubble
          text={speechBubble}
          position={position}
          emoji={activeCharacter.emoji}
        />
      )}
      {actionMenuOpen && activeCharacter && (
        <CompanionActionMenu
          character={activeCharacter}
          settings={mergedSettings}
          position={position}
          onSelect={(action) => engineRef.current?.executeMenuAction(action)}
          onClose={() => engineRef.current?.closeActionMenu()}
        />
      )}
      {activeWidget && activeCharacter && (
        <WidgetPanel
          widget={activeWidget}
          character={activeCharacter}
          variant={widgetVariant}
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
