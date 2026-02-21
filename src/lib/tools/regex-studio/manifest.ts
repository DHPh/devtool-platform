import { defineStudioManifest } from "@/lib/studio-manifest";

export const REGEX_STUDIO_MANIFEST = defineStudioManifest(
  "regex-studio",
  "regex-studio",
  [
    { id: "tester", shortLabel: "Tester", icon: "TestTube", loadComponent: () => import("./tabs/RegexTesterTab").then((module) => ({ default: module.RegexTesterTab })) },
    { id: "replace", shortLabel: "Replace", icon: "Replace", loadComponent: () => import("./tabs/RegexReplaceTab").then((module) => ({ default: module.RegexReplaceTab })) },
    { id: "library", shortLabel: "Library", icon: "BookOpen", loadComponent: () => import("./tabs/RegexLibraryTab").then((module) => ({ default: module.RegexLibraryTab })) },
    // create-tool:tabs
  ],
);
