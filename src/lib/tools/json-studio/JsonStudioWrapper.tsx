"use client";

import React, { Suspense } from "react";
import { JsonStudio } from "./JsonStudio";

interface JsonStudioProps {
  defaultTab?: string;
  className?: string;
}

function JsonStudioContent(props: JsonStudioProps) {
  return <JsonStudio {...props} />;
}

export function JsonStudioWithSuspense(props: JsonStudioProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-96">
          Loading...
        </div>
      }
    >
      <JsonStudioContent {...props} />
    </Suspense>
  );
}
