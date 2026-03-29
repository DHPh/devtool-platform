"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { DATA_API_STUDIO_MANIFEST } from "./manifest";

export default function DataApiStudio() {
  return <StudioTabs manifest={DATA_API_STUDIO_MANIFEST} componentProps={{}} />;
}
