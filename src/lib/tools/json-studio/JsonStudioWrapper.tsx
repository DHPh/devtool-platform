"use client";

import React, { Suspense } from "react";
import { JsonStudio } from "./JsonStudio";

interface JsonStudioProps {
  defaultTab?: string;
  className?: string;
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
      <JsonStudio {...props} />
    </Suspense>
  );
}

export function JsonStudioFormatterView() {
  return <JsonStudioWithSuspense defaultTab="formatter" />;
}

export function JsonStudioValidatorView() {
  return <JsonStudioWithSuspense defaultTab="schema" />;
}
