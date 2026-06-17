interface SpeechBubbleProps {
  text: string;
  position: { x: number; y: number };
  emoji: string;
}

export function SpeechBubble({ text, position, emoji }: SpeechBubbleProps) {
  return (
    <div
      className="speech-bubble"
      style={{
        left: position.x,
        top: position.y - 80,
        transform: "translateX(-50%)",
      }}
    >
      <span className="speech-bubble-emoji">{emoji}</span>
      <p>{text}</p>
    </div>
  );
}
