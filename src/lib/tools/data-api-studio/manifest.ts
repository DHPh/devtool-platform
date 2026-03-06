import { defineStudioManifest } from "@/lib/studio-manifest";

export const DATA_API_STUDIO_MANIFEST = defineStudioManifest(
  "data-api-studio",
  "data-api-studio",
  [
    { id: "json-to-typescript", shortLabel: "JSON → TS", icon: "FileCode", loadComponent: () => import("./tabs/JsonToTypeScriptTab").then((module) => ({ default: module.JsonToTypeScriptTab })) },
    { id: "json-flatten-unflatten", shortLabel: "Flatten", icon: "Layers", loadComponent: () => import("./tabs/JsonFlattenTab").then((module) => ({ default: module.JsonFlattenTab })) },
  ],
);
