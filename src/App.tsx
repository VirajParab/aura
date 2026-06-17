import { useEffect, useState } from "react";
import { useAuraBootstrap } from "@/character/hooks/useAuraBootstrap";
import { CharacterOverlay } from "@/character/components/CharacterOverlay";
import { SettingsApp } from "@/settings/SettingsApp";
import { CommandPalette } from "@/features/command-palette/CommandPalette";
import { CapturePopup } from "@/features/capture/CapturePopup";
import { listen } from "@tauri-apps/api/event";
import "@/styles/global.css";

function getWindowMode(): "overlay" | "settings" {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("window");
  return mode === "overlay" ? "overlay" : "settings";
}

export default function App() {
  useAuraBootstrap();
  const mode = getWindowMode();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("overlay-mode", "settings-mode");
    root.classList.add(mode === "overlay" ? "overlay-mode" : "settings-mode");
    return () => {
      root.classList.remove("overlay-mode", "settings-mode");
    };
  }, [mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen<{ action: string }>("global-shortcut", (event) => {
      if (event.payload.action === "palette") setPaletteOpen(true);
      if (event.payload.action === "capture") setCaptureOpen(true);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => unlisten?.();
  }, []);

  if (mode === "overlay") {
    return (
      <>
        <CharacterOverlay />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <CapturePopup open={captureOpen} onClose={() => setCaptureOpen(false)} />
      </>
    );
  }

  return (
    <>
      <SettingsApp />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <CapturePopup open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </>
  );
}
