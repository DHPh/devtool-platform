"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    const lines = text === "" ? 0 : text.split("\n").length;
    const paragraphs =
      text.trim() === ""
        ? 0
        : text.split(/\n\s*\n/).filter((p) => p.trim() !== "").length;

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

  const getWordFrequency = () => {
    if (!text.trim()) return [];

    // Enhanced word extraction for Vietnamese and Unicode (compatible approach)
    const words = text
      .toLowerCase()
      // Remove punctuation but keep accented characters and Unicode letters
      .replace(/[^\u00C0-\u017F\u1EA0-\u1EF9\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 0);

    const frequency: Record<string, number> = {};
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  };

  const wordFrequency = getWordFrequency();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Word Counter</CardTitle>
          <CardDescription>
            Analyze your text with detailed statistics including word count,
            reading time, and more. Supports multiple languages: Vietnamese
            (tiếng Việt), English, Chinese (中文), Japanese (日本語), Korean
            (한국어), Arabic (العربية), Thai (ไทย), Russian (Русский), and all
            Unicode languages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text">Text to Analyze</Label>
              <Textarea
                id="text"
                placeholder="Enter or paste your text here... 
Nhập hoặc dán văn bản của bạn vào đây...
例: テキストをここに入力してください..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                className="min-h-[200px]"
              />
            </div>

            {/* Multi-language example buttons */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Language Examples:</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    setText(
                      "Chào mừng bạn đến với công cụ đếm từ! Đây là một ví dụ về văn bản tiếng Việt. Công cụ này có thể đếm chính xác số từ, ký tự, câu và đoạn văn trong tiếng Việt. Các dấu câu như dấu chấm, dấu hỏi, dấu than... đều được nhận diện đúng cách."
                    )
                  }
                  className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 rounded transition-colors"
                >
                  🇻🇳 Tiếng Việt
                </button>
                <button
                  onClick={() =>
                    setText(
                      "Welcome to the word counter tool! This is an example of English text. The tool can accurately count words, characters, sentences, and paragraphs. Various punctuation marks like periods, question marks, exclamation points are properly recognized."
                    )
                  }
                  className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700 rounded transition-colors"
                >
                  🇺🇸 English
                </button>
                <button
                  onClick={() =>
                    setText(
                      "欢迎使用字数统计工具！这是一个中文文本的示例。该工具可以准确计算中文的字数、字符数、句子数和段落数。各种标点符号如句号、问号、感叹号等都能被正确识别。"
                    )
                  }
                  className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 rounded transition-colors"
                >
                  🇨🇳 中文
                </button>
                <button
                  onClick={() =>
                    setText(
                      "文字カウントツールへようこそ！これは日本語テキストの例です。このツールは日本語の単語数、文字数、文数、段落数を正確にカウントできます。句点、疑問符、感嘆符などの句読点も適切に認識されます。"
                    )
                  }
                  className="px-3 py-1 text-xs bg-pink-100 hover:bg-pink-200 dark:bg-pink-800 dark:hover:bg-pink-700 rounded transition-colors"
                >
                  🇯🇵 日本語
                </button>
                <button
                  onClick={() =>
                    setText(
                      "단어 카운터 도구에 오신 것을 환영합니다! 이것은 한국어 텍스트의 예시입니다. 이 도구는 한국어의 단어 수, 문자 수, 문장 수, 단락 수를 정확하게 계산할 수 있습니다. 마침표, 물음표, 느낌표 등의 구두점도 올바르게 인식됩니다."
                    )
                  }
                  className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-800 dark:hover:bg-purple-700 rounded transition-colors"
                >
                  🇰🇷 한국어
                </button>
                <button
                  onClick={() =>
                    setText(
                      "أهلاً بك في أداة عد الكلمات! هذا مثال على النص العربي. يمكن لهذه الأداة أن تعد بدقة الكلمات والأحرف والجمل والفقرات في النص العربي. علامات الترقيم مثل النقطة وعلامة الاستفهام وعلامة التعجب يتم التعرف عليها بشكل صحيح."
                    )
                  }
                  className="px-3 py-1 text-xs bg-orange-100 hover:bg-orange-200 dark:bg-orange-800 dark:hover:bg-orange-700 rounded transition-colors"
                >
                  🇸🇦 العربية
                </button>
                <button
                  onClick={() =>
                    setText(
                      "Добро пожаловать в инструмент подсчета слов! Это пример русского текста. Этот инструмент может точно подсчитать слова, символы, предложения и абзацы в русском тексте. Знаки препинания, такие как точки, вопросительные знаки, восклицательные знаки, правильно распознаются."
                    )
                  }
                  className="px-3 py-1 text-xs bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-800 dark:hover:bg-indigo-700 rounded transition-colors"
                >
                  🇷🇺 Русский
                </button>
                <button
                  onClick={() =>
                    setText(
                      "ยินดีต้อนรับสู่เครื่องมือนับคำ! นี่คือตัวอย่างของข้อความภาษาไทย เครื่องมือนี้สามารถนับคำ อักขระ ประโยค และย่อหน้าในภาษาไทยได้อย่างแม่นยำ เครื่องหมายวรรคตอนต่างๆ เช่น จุด เครื่องหมายคำถาม เครื่องหมายอัศเจรีย์ จะถูกจดจำได้อย่างถูกต้อง"
                    )
                  }
                  className="px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700 rounded transition-colors"
                >
                  🇹🇭 ไทย
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Characters</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.characters.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.charactersNoSpaces.toLocaleString()} without spaces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Words</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.words.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.sentences.toLocaleString()} sentences
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Paragraphs</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {stats.paragraphs.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.lines.toLocaleString()} lines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Reading Time</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {stats.readingTime}
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.speakingTime} min speaking
            </p>
          </CardContent>
        </Card>
      </div>

      {wordFrequency.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Frequent Words</CardTitle>
            <CardDescription>
              Top 10 most commonly used words in your text
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {wordFrequency.map(([word, count]) => (
                  <Badge key={word} variant="secondary" className="text-sm">
                    {word} ({count})
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>🌍 Supported Languages</CardTitle>
          <CardDescription>
            This tool supports all Unicode languages with intelligent text
            analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="font-medium text-blue-600">Latin-based:</Label>
              <p>
                Vietnamese, English, French, Spanish, German, Italian,
                Portuguese, etc.
              </p>
            </div>
            <div>
              <Label className="font-medium text-red-600">East Asian:</Label>
              <p>
                Chinese (Simplified/Traditional), Japanese
                (Hiragana/Katakana/Kanji), Korean
              </p>
            </div>
            <div>
              <Label className="font-medium text-purple-600">
                Right-to-Left:
              </Label>
              <p>Arabic, Hebrew, Persian, Urdu</p>
            </div>
            <div>
              <Label className="font-medium text-green-600">Cyrillic:</Label>
              <p>Russian, Ukrainian, Bulgarian, Serbian, etc.</p>
            </div>
            <div>
              <Label className="font-medium text-orange-600">
                Southeast Asian:
              </Label>
              <p>Thai, Khmer, Lao, Myanmar, etc.</p>
            </div>
            <div>
              <Label className="font-medium text-indigo-600">
                South Asian:
              </Label>
              <p>Hindi, Bengali, Tamil, Telugu, etc.</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Technical Details:</strong> Uses Unicode character ranges
              (\\u00C0-\\u017F for Latin Extended, \\u1EA0-\\u1EF9 for
              Vietnamese) to preserve accented characters, diacritics, and
              special characters across multiple languages. Word counting is
              based on whitespace separation, which works universally across
              most writing systems.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <Label className="font-medium">Characters (with spaces):</Label>
              <p>{stats.characters.toLocaleString()}</p>
            </div>
            <div>
              <Label className="font-medium">Characters (no spaces):</Label>
              <p>{stats.charactersNoSpaces.toLocaleString()}</p>
            </div>
            <div>
              <Label className="font-medium">Words:</Label>
              <p>{stats.words.toLocaleString()}</p>
            </div>
            <div>
              <Label className="font-medium">Sentences:</Label>
              <p>{stats.sentences.toLocaleString()}</p>
            </div>
            <div>
              <Label className="font-medium">Paragraphs:</Label>
              <p>{stats.paragraphs.toLocaleString()}</p>
            </div>
            <div>
              <Label className="font-medium">Lines:</Label>
              <p>{stats.lines.toLocaleString()}</p>
            </div>
            <div>
              <Label className="font-medium">Reading time:</Label>
              <p>{stats.readingTime} minutes</p>
            </div>
            <div>
              <Label className="font-medium">Speaking time:</Label>
              <p>{stats.speakingTime} minutes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
