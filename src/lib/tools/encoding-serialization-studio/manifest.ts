import { defineStudioManifest } from "@/lib/studio-manifest";

export const ENCODING_SERIALIZATION_STUDIO_MANIFEST = defineStudioManifest(
  "encoding-serialization-studio",
  "encoding-serialization-studio",
  [
    {
      id: "yaml-formatter",
      shortLabel: "YAML",
      icon: "FileCode",
      loadComponent: () =>
        import("./tabs/YamlFormatterTab").then((loaded) => ({
          default: loaded.YamlFormatterTab,
        })),
    },
    {
      id: "yaml-validator",
      shortLabel: "YAML ✓",
      icon: "Shield",
      loadComponent: () =>
        import("./tabs/YamlValidatorTab").then((loaded) => ({
          default: loaded.YamlValidatorTab,
        })),
    },
    {
      id: "xml-formatter",
      shortLabel: "XML",
      icon: "FileCode",
      loadComponent: () =>
        import("./tabs/XmlFormatterTab").then((loaded) => ({
          default: loaded.XmlFormatterTab,
        })),
    },
    {
      id: "xml-validator",
      shortLabel: "XML ✓",
      icon: "Shield",
      loadComponent: () =>
        import("./tabs/XmlValidatorTab").then((loaded) => ({
          default: loaded.XmlValidatorTab,
        })),
    },
    {
      id: "toml-formatter",
      shortLabel: "TOML",
      icon: "FileCode",
      loadComponent: () =>
        import("./tabs/TomlFormatterTab").then((loaded) => ({
          default: loaded.TomlFormatterTab,
        })),
    },
    {
      id: "json-yaml-converter",
      shortLabel: "JSON/YAML",
      icon: "RefreshCw",
      loadComponent: () =>
        import("./tabs/JsonYamlConverterTab").then((loaded) => ({
          default: loaded.JsonYamlConverterTab,
        })),
    },
    {
      id: "csv-json-converter",
      shortLabel: "CSV/JSON",
      icon: "RefreshCw",
      loadComponent: () =>
        import("./tabs/CsvJsonConverterTab").then((loaded) => ({
          default: loaded.CsvJsonConverterTab,
        })),
    },
    {
      id: "number-base-converter",
      shortLabel: "Bases",
      icon: "Hash",
      loadComponent: () =>
        import("./tabs/NumberBaseConverterTab").then((loaded) => ({
          default: loaded.NumberBaseConverterTab,
        })),
    },
    // create-tool:tabs
  ],
);
