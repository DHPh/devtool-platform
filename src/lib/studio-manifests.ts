import { COLOR_STUDIO_MANIFEST } from "@/lib/tools/color-studio/manifest";
import { FILE_PROCESSING_STUDIO_MANIFEST } from "@/lib/tools/file-processing/manifest";
import { JSON_STUDIO_MANIFEST } from "@/lib/tools/json-studio/manifest";
import { NETWORK_STUDIO_MANIFEST } from "@/lib/tools/network-studio/manifest";
import { PASSWORD_STUDIO_MANIFEST } from "@/lib/tools/password-studio/manifest";
import { REGEX_STUDIO_MANIFEST } from "@/lib/tools/regex-studio/manifest";

import { ENCODING_SERIALIZATION_STUDIO_MANIFEST } from "@/lib/tools/encoding-serialization-studio/manifest";
import { DEVOPS_CONFIGURATION_STUDIO_MANIFEST } from "@/lib/tools/devops-configuration-studio/manifest";
import { DATA_API_STUDIO_MANIFEST } from "@/lib/tools/data-api-studio/manifest";
import { SECURITY_IDENTITY_STUDIO_MANIFEST } from "@/lib/tools/security-identity-studio/manifest";
import { WEB_DEVELOPMENT_STUDIO_MANIFEST } from "@/lib/tools/web-development-studio/manifest";
import { WEBSITE_DIAGNOSTICS_STUDIO_MANIFEST } from "@/lib/tools/website-diagnostics-studio/manifest";

export const STUDIO_MANIFESTS = [
  COLOR_STUDIO_MANIFEST,
  FILE_PROCESSING_STUDIO_MANIFEST,
  JSON_STUDIO_MANIFEST,
  NETWORK_STUDIO_MANIFEST,
  PASSWORD_STUDIO_MANIFEST,
  REGEX_STUDIO_MANIFEST,
  ENCODING_SERIALIZATION_STUDIO_MANIFEST,
  DEVOPS_CONFIGURATION_STUDIO_MANIFEST,
  DATA_API_STUDIO_MANIFEST,
  SECURITY_IDENTITY_STUDIO_MANIFEST,
  WEB_DEVELOPMENT_STUDIO_MANIFEST,
  WEBSITE_DIAGNOSTICS_STUDIO_MANIFEST,
] as const;
