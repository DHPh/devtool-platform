"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { ENCODING_SERIALIZATION_STUDIO_MANIFEST } from "./manifest";

export default function EncodingSerializationStudio() {
  return (
    <StudioTabs
      manifest={ENCODING_SERIALIZATION_STUDIO_MANIFEST}
      componentProps={{}}
      listClassName="grid h-auto w-full grid-cols-2 p-1 md:grid-cols-4"
    />
  );
}
