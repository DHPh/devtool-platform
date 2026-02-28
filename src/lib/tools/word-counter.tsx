"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
} from "@/components/layout";
import { countText } from "@/lib/processors";

export const metadata = {
  id: "word-counter",
  name: "Word Counter",
  description: "Count words, characters, lines, and paragraphs in text",
  category: "Utilities",
  tags: ["word", "count", "character", "text", "analysis"],
  path: "/tools/word-counter",
  icon: "📊",
};

export default function WordCounter() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const counts = countText(text);
    const { characters, words, lines, paragraphs } = counts;
    const charactersNoSpaces = counts.charactersWithoutSpaces;

    // Enhanced sentence detection for Vietnamese
    const sentences =
      text.trim() === ""
        ? 0
        : text.split(/[.!?…:;]+/).filter((s) => s.trim() !== "").length;

    // Reading time estimation (average 200 words per minute)
    const readingTime = Math.ceil(words / 200);

    // Speaking time estimation (average 150 words per minute)
    const speakingTime = Math.ceil(words / 150);

    return {
      characters,
      charactersNoSpaces,
      words,
      lines,
      paragraphs,
      sentences,
      readingTime,
      speakingTime,
    };
  }, [text]);

  // Get word frequency
  const getWordFrequency = () => {
    if (!text.trim()) return [];

    const words = text
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u017F\u1EA0-\u1EF9]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2);

    const frequency: Record<string, number> = {};
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  };

  const wordFrequency = getWordFrequency();

  // Example texts for different languages
  const languageExamples = [
    {
      name: "English",
      text: "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once.",
      category: "Latin-based",
    },
    {
      name: "Tiếng Việt",
      text: "Chào mừng bạn đến với công cụ đếm từ. Đây là một văn bản tiếng Việt có dấu để kiểm tra tính năng đếm từ.",
      category: "Latin-based",
    },
    {
      name: "中文",
      text: "这是一个中文文本示例。中文文字计数与拉丁文字不同，因为中文不使用空格分隔单词。",
      category: "East Asian",
    },
    {
      name: "日本語",
      text: "これは日本語のテキストサンプルです。ひらがな、カタカナ、漢字が混在しています。",
      category: "East Asian",
    },
    {
      name: "한국어",
      text: "이것은 한국어 텍스트 샘플입니다. 한글은 표음문자이며 공백으로 단어를 구분합니다.",
      category: "East Asian",
    },
    {
      name: "Русский",
      text: "Это пример текста на русском языке. Кириллица используется во многих славянских языках.",
      category: "Cyrillic",
    },
    {
      name: "العربية",
      text: "هذا مثال على النص العربي. اللغة العربية تُكتب من اليمين إلى اليسار وتحتوي على 28 حرفاً.",
      category: "Arabic",
    },
    {
      name: "ไทย",
      text: "นี่คือตัวอย่างข้อความภาษาไทย ภาษาไทยเป็นภาษาที่มีระบบการเขียนที่ไม่ใช้การเว้นวรรคระหว่างคำ",
      category: "Southeast Asian",
    },
  ];

  return (
    <div className="space-y-6">
      <ToolHeader
        title="Word Counter"
        description="Analyze your text with detailed statistics including word count, reading time, and more. Supports multiple languages."
        icon={FileText}
      />

      <QuickActions
        actions={[
          {
            id: "clear",
            label: "Clear Text",
            onClick: () => setText(""),
            variant: "outline" as const,
          },
          ...languageExamples.slice(0, 4).map((example) => ({
            id: example.name.toLowerCase(),
            label: example.name,
            onClick: () => setText(example.text),
          })),
        ]}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Text Input Section */}
        <div className="space-y-4">
          <ResultCard
            title="Text Analysis"
            description="Enter or paste your text below for comprehensive analysis"
            status="info"
          >
            <div className="space-y-4">
              <Textarea
                placeholder="Enter or paste your text here... 
Nhập hoặc dán văn bản của bạn vào đây...
例: テキストをここに入力してください..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />

              {/* Language Examples */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Try different languages:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {languageExamples.map((example, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => setText(example.text)}
                      className="p-2 text-left text-xs border rounded hover:bg-accent transition-colors"
                    >
                      <div className="font-medium">{example.name}</div>
                      <div className="text-muted-foreground">
                        {example.category}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ResultCard>
        </div>

        {/* Statistics Section */}
        <div className="space-y-4">
          <ResultCard
            title="Text Statistics"
            description="Comprehensive analysis of your text"
            status={text ? "success" : "info"}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-center p-3 border rounded">
                  <div className="text-2xl font-bold text-blue-600">{stats.characters}</div>
                  <div className="text-sm text-muted-foreground">Characters</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="text-2xl font-bold text-green-600">{stats.words}</div>
                  <div className="text-sm text-muted-foreground">Words</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="text-2xl font-bold text-purple-600">{stats.sentences}</div>
                  <div className="text-sm text-muted-foreground">Sentences</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="text-2xl font-bold text-orange-600">{stats.readingTime}</div>
                  <div className="text-sm text-muted-foreground">Min to Read</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-center p-3 border rounded">
                  <div className="text-2xl font-bold text-cyan-600">{stats.charactersNoSpaces}</div>
                  <div className="text-sm text-muted-foreground">No Spaces</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="text-2xl font-bold text-red-600">{stats.lines}</div>
                  <div className="text-sm text-muted-foreground">Lines</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="text-2xl font-bold text-indigo-600">{stats.paragraphs}</div>
                  <div className="text-sm text-muted-foreground">Paragraphs</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="text-2xl font-bold text-pink-600">{stats.speakingTime}</div>
                  <div className="text-sm text-muted-foreground">Min to Speak</div>
                </div>
              </div>
            </div>
          </ResultCard>

          {/* Word Frequency Analysis */}
          {wordFrequency.length > 0 && (
            <ResultCard
              title="Most Frequent Words"
              description="Top 10 most commonly used words in your text"
              status="success"
            >
              <div className="space-y-2">
                {wordFrequency.map(([word, count], index) => (
                  <div
                    key={word}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-mono">{word}</span>
                    </div>
                    <Badge>{count}</Badge>
                  </div>
                ))}
              </div>
            </ResultCard>
          )}
        </div>
      </div>

      {/* Language Support Information */}
      <ResultCard
        title="Multi-Language Support"
        description="This tool accurately counts words and characters across different writing systems"
        status="info"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-600 mb-2">
              Latin-based Languages
            </h4>
            <p className="text-muted-foreground">
              English, Vietnamese, French, Spanish, German, and other European
              languages that use spaces to separate words.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-red-600 mb-2">
              East Asian Languages
            </h4>
            <p className="text-muted-foreground">
              Chinese, Japanese, and Korean. Special handling for
              character-based writing systems where words may not be separated
              by spaces.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-purple-600 mb-2">
              Right-to-Left Languages
            </h4>
            <p className="text-muted-foreground">
              Arabic, Hebrew, and other RTL scripts with proper character and
              word counting.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-green-600 mb-2">
              Cyrillic Scripts
            </h4>
            <p className="text-muted-foreground">
              Russian, Bulgarian, Serbian, and other Slavic languages using
              Cyrillic alphabet.
            </p>
          </div>
        </div>
      </ResultCard>
    </div>
  );
}
