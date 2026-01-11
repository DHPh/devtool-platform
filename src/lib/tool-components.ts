import type { ComponentType } from "react";

import Base64Encoder from "@/lib/tools/base64-encoder";
import CaseConverter from "@/lib/tools/case-converter";
import ColorStudio from "@/lib/tools/color-studio/ColorStudio";
import CssFormatter from "@/lib/tools/css-formatter";
import CsvViewer from "@/lib/tools/csv-viewer";
import DataExplorer from "@/lib/tools/data-explorer";
import DiffChecker from "@/lib/tools/diff-checker";
import EmailValidator from "@/lib/tools/email-validator";
import FileProcessingStudio from "@/lib/tools/file-processing/FileProcessingStudio";
import HtmlEntities from "@/lib/tools/html-entities";
import HtmlFormatter from "@/lib/tools/html-formatter";
import IconPackGenerator from "@/lib/tools/icon-pack-generator";
import { JsonFormatter } from "@/lib/tools/json-formatter";
import { JsonStudio } from "@/lib/tools/json-studio";
import JsonTableViewer from "@/lib/tools/json-table-viewer";
import JsonValidator from "@/lib/tools/json-validator";
import LoremIpsum from "@/lib/tools/lorem-ipsum";
import MarkdownPreview from "@/lib/tools/markdown-preview";
import { NetworkStudio } from "@/lib/tools/network-studio";
import { PasswordStudio } from "@/lib/tools/password-studio/PasswordStudio";
import QrGenerator from "@/lib/tools/qr-generator";
import RandomWheel from "@/lib/tools/random-wheel";
import { RegexStudio } from "@/lib/tools/regex-studio";
import TimestampConverter from "@/lib/tools/timestamp-converter";
import UrlEncoder from "@/lib/tools/url-encoder";
import UuidGenerator from "@/lib/tools/uuid-generator";
import WordCounter from "@/lib/tools/word-counter";

export const TOOL_COMPONENTS: Record<string, ComponentType> = {
  "json-formatter": JsonFormatter,
  "base64-encoder": Base64Encoder,
  "regex-studio": RegexStudio,
  "uuid-generator": UuidGenerator,
  "timestamp-converter": TimestampConverter,
  "password-studio": PasswordStudio,
  "color-studio": ColorStudio,
  "case-converter": CaseConverter,
  "url-encoder": UrlEncoder,
  "word-counter": WordCounter,
  "qr-generator": QrGenerator,
  "json-validator": JsonValidator,
  "html-entities": HtmlEntities,
  "lorem-ipsum": LoremIpsum,
  "email-validator": EmailValidator,
  "html-formatter": HtmlFormatter,
  "diff-checker": DiffChecker,
  "css-formatter": CssFormatter,
  "markdown-preview": MarkdownPreview,
  "csv-viewer": CsvViewer,
  "json-table-viewer": JsonTableViewer,
  "data-explorer": DataExplorer,
  "random-wheel": RandomWheel,
  "json-studio": JsonStudio,
  "network-studio": NetworkStudio,
  "file-processing-studio": FileProcessingStudio,
  "icon-pack-generator": IconPackGenerator,
};
