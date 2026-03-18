"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { WEB_DEVELOPMENT_STUDIO_MANIFEST } from "./manifest";

export default function WebDevelopmentStudio() {
  return (
    <StudioTabs
      manifest={WEB_DEVELOPMENT_STUDIO_MANIFEST}
      componentProps={{}}
      listClassName="grid h-auto w-full grid-cols-2 p-1 md:grid-cols-4 xl:grid-cols-8"
    />
  );
}
