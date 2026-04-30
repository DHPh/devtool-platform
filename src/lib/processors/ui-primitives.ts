export type DiffLevel = "line" | "word" | "char";
export type DiffEntry = {
  type: "added" | "removed" | "unchanged";
  text: string;
  lineNumber: number;
  oldLineNumber?: number;
  newLineNumber?: number;
};

export type DiffSplitCell = {
  type: "added" | "removed" | "unchanged";
  text: string;
  lineNumber: number;
};

export type DiffSplitRow = {
  left: DiffSplitCell | null;
  right: DiffSplitCell | null;
};

type RawDiffOp =
  | { kind: "unchanged"; oldIndex: number; newIndex: number }
  | { kind: "removed"; oldIndex: number }
  | { kind: "added"; newIndex: number };

const MAX_LCS_CELLS = 4_000_000;

function computeMiddleDiffOps(
  compA: readonly string[],
  compB: readonly string[],
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): RawDiffOp[] {
  const m = endA - startA;
  const n = endB - startB;
  if (m === 0 && n === 0) return [];
  if (m === 0) {
    return Array.from({ length: n }, (_, k) => ({
      kind: "added" as const,
      newIndex: startB + k,
    }));
  }
  if (n === 0) {
    return Array.from({ length: m }, (_, k) => ({
      kind: "removed" as const,
      oldIndex: startA + k,
    }));
  }

  if (m * n > MAX_LCS_CELLS) {
    const ops: RawDiffOp[] = [];
    const maxLen = Math.max(m, n);
    for (let k = 0; k < maxLen; k++) {
      if (k < m && k < n && compA[startA + k] === compB[startB + k]) {
        ops.push({ kind: "unchanged", oldIndex: startA + k, newIndex: startB + k });
      } else {
        if (k < m) ops.push({ kind: "removed", oldIndex: startA + k });
        if (k < n) ops.push({ kind: "added", newIndex: startB + k });
      }
    }
    return ops;
  }

  const width = n + 1;
  const dp = new Int32Array((m + 1) * width);

  for (let i = 1; i <= m; i++) {
    const rowOffset = i * width;
    const prevRowOffset = (i - 1) * width;
    const aToken = compA[startA + i - 1];
    for (let j = 1; j <= n; j++) {
      if (aToken === compB[startB + j - 1]) {
        dp[rowOffset + j] = dp[prevRowOffset + j - 1] + 1;
      } else {
        const up = dp[prevRowOffset + j];
        const leftVal = dp[rowOffset + j - 1];
        dp[rowOffset + j] = up >= leftVal ? up : leftVal;
      }
    }
  }

  const opsReversed: RawDiffOp[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && compA[startA + i - 1] === compB[startB + j - 1]) {
      i -= 1;
      j -= 1;
      opsReversed.push({
        kind: "unchanged",
        oldIndex: startA + i,
        newIndex: startB + j,
      });
    } else if (j > 0 && (i === 0 || dp[i * width + j - 1] >= dp[(i - 1) * width + j])) {
      j -= 1;
      opsReversed.push({ kind: "added", newIndex: startB + j });
    } else {
      i -= 1;
      opsReversed.push({ kind: "removed", oldIndex: startA + i });
    }
  }

  opsReversed.reverse();
  return opsReversed;
}

export function calculateTextDiff(
  left: string,
  right: string,
  options: { level?: DiffLevel; ignoreWhitespace?: boolean; ignoreCase?: boolean } = {},
): {
  lines: DiffEntry[];
  splitRows: DiffSplitRow[];
  stats: { additions: number; deletions: number; changes: number };
} {
  const level = options.level ?? "line";

  const prepareNonLine = (value: string) => {
    if (!options.ignoreWhitespace) return value;
    return value.replace(/\s+/g, " ");
  };

  const tokenize = (value: string) =>
    level === "line"
      ? value.split("\n")
      : level === "word"
        ? value.split(/(\s+)/).filter(Boolean)
        : value.split("");

  const normalizeToken = (token: string) => {
    let result = options.ignoreCase ? token.toLowerCase() : token;
    if (options.ignoreWhitespace) {
      result =
        level === "line"
          ? result.replace(/\s+/g, " ").trim()
          : /^\s+$/.test(result)
            ? " "
            : result;
    }
    return result;
  };

  const rawA = tokenize(level === "line" ? left : prepareNonLine(left));
  const rawB = tokenize(level === "line" ? right : prepareNonLine(right));
  const compA = rawA.map(normalizeToken);
  const compB = rawB.map(normalizeToken);

  let prefix = 0;
  const minLen = Math.min(compA.length, compB.length);
  while (prefix < minLen && compA[prefix] === compB[prefix]) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < minLen - prefix &&
    compA[compA.length - 1 - suffix] === compB[compB.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const endA = compA.length - suffix;
  const endB = compB.length - suffix;

  const ops: RawDiffOp[] = [];
  for (let k = 0; k < prefix; k++) {
    ops.push({ kind: "unchanged", oldIndex: k, newIndex: k });
  }
  for (const op of computeMiddleDiffOps(compA, compB, prefix, endA, prefix, endB)) {
    ops.push(op);
  }
  for (let k = 0; k < suffix; k++) {
    ops.push({
      kind: "unchanged",
      oldIndex: endA + k,
      newIndex: endB + k,
    });
  }

  const lines: DiffEntry[] = [];
  const splitRows: DiffSplitRow[] = [];
  let additions = 0;
  let deletions = 0;
  let changes = 0;

  let pendingRemoved: DiffSplitCell[] = [];
  let pendingAdded: DiffSplitCell[] = [];

  const flushHunk = () => {
    if (pendingRemoved.length === 0 && pendingAdded.length === 0) return;

    for (const item of pendingRemoved) {
      lines.push({
        type: "removed",
        text: item.text,
        lineNumber: item.lineNumber,
        oldLineNumber: item.lineNumber,
      });
      deletions += 1;
    }
    for (const item of pendingAdded) {
      lines.push({
        type: "added",
        text: item.text,
        lineNumber: item.lineNumber,
        newLineNumber: item.lineNumber,
      });
      additions += 1;
    }

    const hunkSize = Math.max(pendingRemoved.length, pendingAdded.length);
    changes += hunkSize;
    for (let k = 0; k < hunkSize; k++) {
      splitRows.push({
        left: pendingRemoved[k] ?? null,
        right: pendingAdded[k] ?? null,
      });
    }

    pendingRemoved = [];
    pendingAdded = [];
  };

  for (const op of ops) {
    if (op.kind === "unchanged") {
      flushHunk();
      const oldLine = op.oldIndex + 1;
      const newLine = op.newIndex + 1;
      const text = rawA[op.oldIndex];
      lines.push({
        type: "unchanged",
        text,
        lineNumber: oldLine,
        oldLineNumber: oldLine,
        newLineNumber: newLine,
      });
      splitRows.push({
        left: { type: "unchanged", text, lineNumber: oldLine },
        right: { type: "unchanged", text: rawB[op.newIndex], lineNumber: newLine },
      });
    } else if (op.kind === "removed") {
      pendingRemoved.push({
        type: "removed",
        text: rawA[op.oldIndex],
        lineNumber: op.oldIndex + 1,
      });
    } else {
      pendingAdded.push({
        type: "added",
        text: rawB[op.newIndex],
        lineNumber: op.newIndex + 1,
      });
    }
  }
  flushHunk();

  return {
    lines,
    splitRows,
    stats: { additions, deletions, changes },
  };
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
