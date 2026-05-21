import type { DragEvent } from "react";

export function readDroppedFiles(event: DragEvent): FileList {
  event.preventDefault();
  if (typeof DataTransfer !== "function") {
    return event.dataTransfer.files;
  }
  // Snapshot files while the browser's drag data store is readable.
  const selection = new DataTransfer();
  for (const file of Array.from(event.dataTransfer.files)) {
    selection.items.add(file);
  }
  return selection.files;
}
