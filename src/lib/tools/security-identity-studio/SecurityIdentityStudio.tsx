"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { SECURITY_IDENTITY_STUDIO_MANIFEST } from "./manifest";

export default function SecurityIdentityStudio() {
  return <StudioTabs manifest={SECURITY_IDENTITY_STUDIO_MANIFEST} componentProps={{}} listClassName="grid h-auto w-full grid-cols-2 p-1" />;
}
