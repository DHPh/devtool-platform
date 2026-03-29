"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { SECURITY_IDENTITY_STUDIO_MANIFEST } from "./manifest";

export default function SecurityIdentityStudio() {
  return <StudioTabs manifest={SECURITY_IDENTITY_STUDIO_MANIFEST} componentProps={{}} />;
}
