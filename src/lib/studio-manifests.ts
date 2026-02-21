import { COLOR_STUDIO_MANIFEST } from "@/lib/tools/color-studio/manifest";
import { FILE_PROCESSING_STUDIO_MANIFEST } from "@/lib/tools/file-processing/manifest";
import { JSON_STUDIO_MANIFEST } from "@/lib/tools/json-studio/manifest";
import { NETWORK_STUDIO_MANIFEST } from "@/lib/tools/network-studio/manifest";
import { PASSWORD_STUDIO_MANIFEST } from "@/lib/tools/password-studio/manifest";
import { REGEX_STUDIO_MANIFEST } from "@/lib/tools/regex-studio/manifest";

export const STUDIO_MANIFESTS = [
  COLOR_STUDIO_MANIFEST,
  FILE_PROCESSING_STUDIO_MANIFEST,
  JSON_STUDIO_MANIFEST,
  NETWORK_STUDIO_MANIFEST,
  PASSWORD_STUDIO_MANIFEST,
  REGEX_STUDIO_MANIFEST,
] as const;
