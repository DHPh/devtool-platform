"use client";

import { useState } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
import { Shuffle, User } from "lucide-react";
import { toast } from "sonner";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  CopyableResult,
  StatusIndicator,
} from "@/components/layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const metadata = {
  id: "name-generator",
  name: "Name Generator",
  description: "Generate random names for people, companies, projects, and more",
  category: "Generators",
  tags: ["name", "generator", "random", "people", "company"],
  path: "/tools/name-generator",
  icon: "👤",
};

const firstNames = {
  male: ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Christopher", "Charles", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua"],
  female: ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Nancy", "Lisa", "Betty", "Helen", "Sandra", "Donna", "Carol", "Ruth", "Sharon", "Michelle"],
  unisex: ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Avery", "Quinn", "Sage", "River", "Emery", "Phoenix", "Cameron", "Blake", "Rowan", "Jamie", "Finley", "Peyton", "Skyler", "Reese"]
};

const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];

const companyPrefixes = ["Tech", "Digital", "Smart", "Future", "Global", "Creative", "Dynamic", "Innovative", "Advanced", "Next"];
const companySuffixes = ["Solutions", "Systems", "Technologies", "Enterprises", "Corporation", "Industries", "Group", "Associates", "Partners", "Holdings"];

const projectAdjectives = ["Amazing", "Awesome", "Brilliant", "Creative", "Dynamic", "Epic", "Fantastic", "Great", "Incredible", "Innovative"];
const projectNouns = ["Project", "App", "Platform", "System", "Tool", "Framework", "Engine", "Solution", "Service", "Application"];

export default function NameGenerator() {
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [nameType, setNameType] = useState<"person" | "company" | "project">("person");
  const [personGender, setPersonGender] = useState<"male" | "female" | "unisex">("unisex");
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePersonName = (gender: "male" | "female" | "unisex"): string => {
    const firstNameList = firstNames[gender];
    const firstName = firstNameList[Math.floor(Math.random() * firstNameList.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  };

  const generateCompanyName = (): string => {
    const prefix = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
    const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
    return `${prefix} ${suffix}`;
  };

  const generateProjectName = (): string => {
    const adjective = projectAdjectives[Math.floor(Math.random() * projectAdjectives.length)];
    const noun = projectNouns[Math.floor(Math.random() * projectNouns.length)];
    return `${adjective} ${noun}`;
  };

  const generateNames = async () => {
    setIsGenerating(true);
    
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      let name: string;
      switch (nameType) {
        case "person":
          name = generatePersonName(personGender);
          break;
        case "company":
          name = generateCompanyName();
          break;
        case "project":
          name = generateProjectName();
          break;
        default:
          name = generatePersonName("unisex");
      }
      names.push(name);
    }
    
    setGeneratedNames(names);
    setIsGenerating(false);
    toast.success(`Generated ${names.length} ${nameType} names!`);
  };

  const copyName = async (name: string) => {
    await writeClipboardText(name);
    toast.success("Name copied to clipboard!");
  };

  const copyAllNames = async () => {
    const allNames = generatedNames.join("\n");
    await writeClipboardText(allNames);
    toast.success("All names copied to clipboard!");
  };

  const regenerate = () => {
    generateNames();
  };

  const clearAll = () => {
    setGeneratedNames([]);
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        title="Name Generator"
        description="Generate random names for people, companies, projects, and more"
        icon={User}
      />

      <QuickActions
        actions={[
          {
            id: "generate",
            label: isGenerating ? "Generating..." : "Generate Names",
            onClick: generateNames,
            disabled: isGenerating,
            variant: "default" as const,
          },
          {
            id: "regenerate",
            label: "Regenerate",
            onClick: regenerate,
            disabled: isGenerating || generatedNames.length === 0,
            variant: "outline" as const,
          },
          {
            id: "copy-all",
            label: "Copy All",
            onClick: copyAllNames,
            disabled: generatedNames.length === 0,
            variant: "outline" as const,
          },
          {
            id: "clear",
            label: "Clear All",
            onClick: clearAll,
            disabled: generatedNames.length === 0,
            variant: "outline" as const,
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="space-y-4">
          <ResultCard
            title="Generator Settings"
            description="Configure name generation options"
            status="info"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="name-type">Name Type</Label>
                <Select value={nameType} onValueChange={(value) => setNameType(value as typeof nameType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">Person Names</SelectItem>
                    <SelectItem value="company">Company Names</SelectItem>
                    <SelectItem value="project">Project Names</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {nameType === "person" && (
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={personGender} onValueChange={(value) => setPersonGender(value as typeof personGender)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unisex">Unisex</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="count">Number of Names</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="50"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                />
              </div>

              <Button onClick={generateNames} disabled={isGenerating} className="w-full">
                <Shuffle className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate Names"}
              </Button>
            </div>
          </ResultCard>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          <ResultCard
            title="Generated Names"
            description={`${generatedNames.length} ${nameType} names generated`}
            status={generatedNames.length > 0 ? "success" : "info"}
            onCopy={generatedNames.length > 0 ? copyAllNames : undefined}
            copyLabel="Copy All Names"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center p-8">
                <StatusIndicator status="loading" message="Generating names..." />
              </div>
            ) : generatedNames.length > 0 ? (
              <div className="space-y-2">
                {generatedNames.map((name, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span className="font-medium">{name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyName(name)}
                    >
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <CopyableResult
                value=""
                placeholder="Generated names will appear here..."
                rows={8}
              />
            )}
          </ResultCard>
        </div>
      </div>

      {/* Information */}
      <ResultCard
        title="About Name Generation"
        status="info"
        description="Learn about different types of names and their uses"
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="font-medium mb-2">Person Names</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Character development</li>
                <li>User testing personas</li>
                <li>Sample data generation</li>
                <li>Creative writing</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Company Names</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Business brainstorming</li>
                <li>Startup ideas</li>
                <li>Demo applications</li>
                <li>Fictional companies</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Project Names</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Code repositories</li>
                <li>Development projects</li>
                <li>Feature codenames</li>
                <li>App naming ideas</li>
              </ul>
            </div>
          </div>
          <p className="text-xs bg-muted p-2 rounded">
            <strong>Note:</strong> Names are generated randomly and may not represent real people or entities.
          </p>
        </div>
      </ResultCard>
    </div>
  );
}
