import { CharacterOverlay } from "@/character/components/CharacterOverlay";
import { useAuraBootstrap } from "@/character/hooks/useAuraBootstrap";
import { SettingsApp } from "@/settings/SettingsApp";
import "@/styles/global.css";

function getWindowMode(): "overlay" | "settings" {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("window");
  return mode === "overlay" ? "overlay" : "settings";
}

export default function App() {
  useAuraBootstrap();
  const mode = getWindowMode();

  if (mode === "overlay") {
    return <CharacterOverlay />;
  }

  return <SettingsApp />;
}
