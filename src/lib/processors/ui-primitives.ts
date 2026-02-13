export type DiffLevel = "line" | "word" | "char";
export type DiffEntry = { type: "added" | "removed" | "unchanged"; text: string; lineNumber: number };

export function calculateTextDiff(
  left: string,
  right: string,
  options: { level?: DiffLevel; ignoreWhitespace?: boolean; ignoreCase?: boolean } = {},
): { lines: DiffEntry[]; stats: { additions: number; deletions: number; changes: number } } {
  const level = options.level ?? "line";
  const preprocess = (value: string) => {
    let result = options.ignoreCase ? value.toLowerCase() : value;
    if (options.ignoreWhitespace) result = result.replace(/\s+/g, " ").trim();
    return result;
  };
  const tokenize = (value: string) => level === "line"
    ? value.split("\n")
    : level === "word" ? value.split(/(\s+)/).filter(Boolean) : value.split("");
  const a = tokenize(preprocess(left));
  const b = tokenize(preprocess(right));
  const lines: DiffEntry[] = [];
  let additions = 0;
  let deletions = 0;
  let changes = 0;

  if (level === "line") {
    for (let index = 0; index < Math.max(a.length, b.length); index++) {
      const before = a[index];
      const after = b[index];
      if (before === after) lines.push({ type: "unchanged", text: before ?? "", lineNumber: index + 1 });
      else {
        if (before !== undefined) { lines.push({ type: "removed", text: before, lineNumber: index + 1 }); deletions++; }
        if (after !== undefined) { lines.push({ type: "added", text: after, lineNumber: index + 1 }); additions++; }
        if (before !== undefined && after !== undefined) changes++;
      }
    }
    return { lines, stats: { additions, deletions, changes } };
  }

  const matrix = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    matrix[i][j] = a[i - 1] === b[j - 1] ? matrix[i - 1][j - 1] + 1 : Math.max(matrix[i - 1][j], matrix[i][j - 1]);
  }
  const tokens: Array<{ type: DiffEntry["type"]; text: string }> = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) { tokens.unshift({ type: "unchanged", text: a[--i] }); j--; }
    else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) tokens.unshift({ type: "added", text: b[--j] });
    else tokens.unshift({ type: "removed", text: a[--i] });
  }
  let lineNumber = 1;
  for (const token of tokens) {
    lines.push({ ...token, lineNumber: lineNumber++ });
    if (token.type === "added") additions++;
    if (token.type === "removed") deletions++;
    if (token.type !== "unchanged") changes++;
  }
  return { lines, stats: { additions, deletions, changes } };
}

export type WeightedWheelItem = { weight: number };
export function calculateWheelSegments<T extends WeightedWheelItem>(items: readonly T[]) {
  if (items.length === 0) return [];
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (!Number.isFinite(totalWeight) || totalWeight <= 0 || items.some((item) => !Number.isFinite(item.weight) || item.weight < 0)) {
    throw new Error("Wheel weights must be non-negative and total more than zero");
  }
  let startAngle = 0;
  return items.map((item) => {
    const segmentAngle = item.weight / totalWeight * 360;
    const segment = { item, startAngle, endAngle: startAngle + segmentAngle, segmentAngle };
    startAngle += segmentAngle;
    return segment;
  });
}

export function getWheelWinner<T extends WeightedWheelItem>(items: readonly T[], finalRotation: number): T | null {
  if (!Number.isFinite(finalRotation)) throw new Error("Wheel rotation must be finite");
  const normalized = (360 - (finalRotation % 360) + 360) % 360;
  return calculateWheelSegments(items).find((segment) => normalized >= segment.startAngle && normalized < segment.endAngle)?.item ?? null;
}

export function calculateConstrainedImageSize(
  original: { width: number; height: number },
  next: { width: number; height: number },
  changed: "width" | "height",
  maintainAspectRatio: boolean,
) {
  const values = [original.width, original.height, next.width, next.height];
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) throw new Error("Image dimensions must be positive numbers");
  if (!maintainAspectRatio) return { width: Math.round(next.width), height: Math.round(next.height) };
  const ratio = original.width / original.height;
  return changed === "width"
    ? { width: Math.round(next.width), height: Math.round(next.width / ratio) }
    : { width: Math.round(next.height * ratio), height: Math.round(next.height) };
}

export const ANDROID_ICON_SPECS = {
  adaptive: { foreground: { size: 432, name: "ic_launcher_foreground.png" }, background: { size: 432, name: "ic_launcher_background.png" } },
  legacy: [
    { density: "mdpi", size: 48, folder: "mipmap-mdpi" }, { density: "hdpi", size: 72, folder: "mipmap-hdpi" },
    { density: "xhdpi", size: 96, folder: "mipmap-xhdpi" }, { density: "xxhdpi", size: 144, folder: "mipmap-xxhdpi" },
    { density: "xxxhdpi", size: 192, folder: "mipmap-xxxhdpi" },
  ],
  playStore: { size: 512, name: "play_store_icon.png" },
} as const;

export const IOS_ICON_SPECS = [
  ["Icon-App-20x20@1x.png", 20, "iPhone Notification"], ["Icon-App-20x20@2x.png", 40, "iPhone Notification"],
  ["Icon-App-20x20@3x.png", 60, "iPhone Notification"], ["Icon-App-29x29@1x.png", 29, "iPhone Settings"],
  ["Icon-App-29x29@2x.png", 58, "iPhone Settings"], ["Icon-App-29x29@3x.png", 87, "iPhone Settings"],
  ["Icon-App-40x40@1x.png", 40, "iPad Spotlight"], ["Icon-App-40x40@2x.png", 80, "iPhone Spotlight"],
  ["Icon-App-40x40@3x.png", 120, "iPhone Spotlight"], ["Icon-App-60x60@2x.png", 120, "iPhone App"],
  ["Icon-App-60x60@3x.png", 180, "iPhone App"], ["Icon-App-76x76@1x.png", 76, "iPad App"],
  ["Icon-App-76x76@2x.png", 152, "iPad App"], ["Icon-App-83.5x83.5@2x.png", 167, "iPad Pro"],
  ["Icon-App-1024x1024@1x.png", 1024, "App Store"],
].map(([name, size, usage]) => ({ name: String(name), size: Number(size), usage: String(usage) }));
