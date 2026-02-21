import { defineStudioManifest } from "@/lib/studio-manifest";

export const JSON_STUDIO_MANIFEST = defineStudioManifest(
  "json-studio",
  "json-studio",
  [
    { id: "formatter", shortLabel: "Format", icon: "FileCode", loadComponent: () => import("./JsonFormatterTab").then((module) => ({ default: module.JsonFormatterTab })) },
    { id: "path", shortLabel: "Path", icon: "Search", loadComponent: () => import("./JsonPathTab").then((module) => ({ default: module.JsonPathTab })) },
    { id: "schema", shortLabel: "Schema", icon: "Shield", loadComponent: () => import("./JsonSchemaTab").then((module) => ({ default: module.JsonSchemaTab })) },
    { id: "diff", shortLabel: "Diff", icon: "GitCompare", loadComponent: () => import("./JsonDiffTab").then((module) => ({ default: module.JsonDiffTab })) },
    // create-tool:tabs
  ],
);
