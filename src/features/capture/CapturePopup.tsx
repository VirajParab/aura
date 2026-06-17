import { useState } from "react";
import { memoryApi } from "@/features/memory/api";

interface CapturePopupProps {
  open: boolean;
  onClose: () => void;
}

export function CapturePopup({ open, onClose }: CapturePopupProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("note");

  if (!open) return null;

  const save = async () => {
    if (!content.trim()) return;
    await memoryApi.createCapture(type, content, title || undefined);
    setTitle("");
    setContent("");
    onClose();
  };

  return (
    <div className="capture-backdrop" onClick={onClose}>
      <div className="capture-popup" onClick={(e) => e.stopPropagation()}>
        <h3>Universal Capture</h3>
        <p className="capture-hint">Ctrl+Shift+A — saves to timeline</p>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="note">Note</option>
          <option value="idea">Idea</option>
          <option value="trade">Trade journal</option>
          <option value="bookmark">Bookmark</option>
        </select>
        <input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="What do you want to remember?"
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="capture-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="capture-save" onClick={() => void save()}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
