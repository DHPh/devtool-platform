"use client";

import React from "react";
import { ContrastChecker } from "../components";

export function ContrastCheckerTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Contrast Checker</h2>
        <p className="text-muted-foreground">
          Check text contrast ratios against WCAG 2.2 AA and AAA thresholds
        </p>
      </div>

      <ContrastChecker />
    </div>
  );
}
