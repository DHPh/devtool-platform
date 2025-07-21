"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search } from "lucide-react";
import { RegexPatternLibrary } from "../components";

interface RegexLibraryTabProps {
  onPatternSelect?: (pattern: string) => void;
}

export function RegexLibraryTab({ onPatternSelect }: RegexLibraryTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handlePatternSelect = (pattern: string) => {
    onPatternSelect?.(pattern);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Regex Pattern Library</CardTitle>
          <CardDescription>
            Browse and search through common regex patterns for various use
            cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="search">Search Patterns</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, description, or pattern..."
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pattern Library */}
      <Card>
        <CardContent className="p-6">
          <RegexPatternLibrary
            onPatternSelect={handlePatternSelect}
            searchQuery={searchQuery}
          />
        </CardContent>
      </Card>
    </div>
  );
}
