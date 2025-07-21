"use client";

import React, { Suspense } from "react";
import { RegexStudio } from "./RegexStudio";

interface RegexStudioProps {
  initialTab?: string;
  initialPattern?: string;
  initialText?: string;
}

function RegexStudioContent(props: RegexStudioProps) {
  return <RegexStudio {...props} />;
}

export function RegexStudioWithSuspense(props: RegexStudioProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-96">
          Loading...
        </div>
      }
    >
      <RegexStudioContent {...props} />
    </Suspense>
  );
}
