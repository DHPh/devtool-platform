import { defineStudioManifest } from "@/lib/studio-manifest";

export const DATA_API_STUDIO_MANIFEST = defineStudioManifest(
  "data-api-studio",
  "data-api-studio",
  [
    { id: "json-to-typescript", shortLabel: "JSON → TS", icon: "FileCode", loadComponent: () => import("./tabs/JsonToTypeScriptTab").then((module) => ({ default: module.JsonToTypeScriptTab })) },
    { id: "json-flatten-unflatten", shortLabel: "Flatten", icon: "Layers", loadComponent: () => import("./tabs/JsonFlattenTab").then((module) => ({ default: module.JsonFlattenTab })) },
    { id: "sql-formatter", shortLabel: "SQL format", icon: "FileCode", loadComponent: () => import("./tabs/SqlFormatterTab").then((module) => ({ default: module.SqlFormatterTab })) },
    { id: "sql-query-builder", shortLabel: "SQL query", icon: "Wrench", loadComponent: () => import("./tabs/SqlQueryBuilderTab").then((module) => ({ default: module.SqlQueryBuilderTab })) },
    { id: "data-sql-generator", shortLabel: "Data → SQL", icon: "RefreshCw", loadComponent: () => import("./tabs/DataToSqlTab").then((module) => ({ default: module.DataToSqlTab })) },
    { id: "openapi-validator", shortLabel: "OpenAPI", icon: "CheckCircle", loadComponent: () => import("./tabs/OpenApiValidatorTab").then((module) => ({ default: module.OpenApiValidatorTab })) },
    { id: "graphql-formatter", shortLabel: "GraphQL", icon: "FileText", loadComponent: () => import("./tabs/GraphqlFormatterTab").then((module) => ({ default: module.GraphqlFormatterTab })) },
    { id: "fake-data-generator", shortLabel: "Fake data", icon: "Zap", loadComponent: () => import("./tabs/FakeDataGeneratorTab").then((module) => ({ default: module.FakeDataGeneratorTab })) },
  ],
);
