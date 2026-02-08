import { describe, expect, it } from "vitest";
import {
  detectDelimiter,
  parseCSV,
  parseCSVRecords,
  protectSpreadsheetCell,
  serializeCSV,
} from "@/lib/processors/csv";

describe("RFC 4180-style CSV processing", () => {
  it("parses CRLF records, escaped quotes, delimiters, and newlines inside fields", () => {
    const csv = 'name,notes\r\nAda,"first line\r\nsecond, line"\r\nGrace,"said ""hello"""\r\n';
    const result = parseCSV(csv);

    expect(result.data).toEqual([
      { name: "Ada", notes: "first line\r\nsecond, line" },
      { name: "Grace", notes: 'said "hello"' },
    ]);
    expect(result.issues).toEqual([]);
  });

  it("detects delimiters from logical records rather than quoted punctuation", () => {
    const csv = 'name;notes\nAda;"commas, stay, data"\nGrace;"still, data"';
    expect(detectDelimiter(csv)).toBe(";");
    expect(parseCSV(csv).data[0]).toEqual({ name: "Ada", notes: "commas, stay, data" });
  });

  it("reports unequal rows without silently merging fields", () => {
    const result = parseCSV("a,b\n1\n2,3,4");
    expect(result.headers).toEqual(["a", "b", "Column 3"]);
    expect(result.data).toEqual([
      { a: 1, b: null, "Column 3": null },
      { a: 2, b: 3, "Column 3": 4 },
    ]);
    expect(result.issues).toEqual([
      { row: 2, expectedColumns: 2, actualColumns: 1 },
      { row: 3, expectedColumns: 2, actualColumns: 3 },
    ]);
  });

  it("keeps generated header names unique even when suffixes collide", () => {
    const result = parseCSV("a,a,a (2)\n1,2,3");
    expect(result.headers).toEqual(["a", "a (2)", "a (2) (2)"]);
    expect(Object.values(result.data[0])).toEqual([1, 2, 3]);
  });

  it("handles a UTF-8 BOM and rejects malformed quoted input", () => {
    expect(parseCSV("\ufeffname,age\r\nAda,36").headers).toEqual(["name", "age"]);
    expect(() => parseCSVRecords('a,"unterminated')).toThrow("Unterminated quoted CSV field");
    expect(() => parseCSVRecords('a,"closed"junk')).toThrow("Unexpected character");
    expect(() => parseCSVRecords('a,"closed" ,b')).toThrow("Unexpected character");
    expect(() => parseCSVRecords('a, leading"quote"')).toThrow("Unexpected quote");
  });

  it("preserves RFC field whitespace and offers explicit conservative conversion", () => {
    expect(parseCSVRecords(" a , b ")).toEqual([[" a ", " b "]]);
    expect(parseCSV(" a , b \n1,2").headers).toEqual([" a ", " b "]);
    expect(parseCSV("code,value\n00123, 42 ").data).toEqual([
      { code: "00123", value: " 42 " },
    ]);
    expect(parseCSV("code,value\n00123,true", { convertValues: false }).data).toEqual([
      { code: "00123", value: "true" },
    ]);
  });

  it("distinguishes blank records from a trailing record terminator", () => {
    expect(parseCSVRecords("a,b\r\n")).toEqual([["a", "b"]]);
    expect(parseCSV("a,b\r\n\r\n1,2", { skipEmptyLines: false }).data).toEqual([
      { a: null, b: null },
      { a: 1, b: 2 },
    ]);
    expect(parseCSV("a,b,c\r\n,,\r\n1,2,3").rowCount).toBe(2);
  });

  it("does not let a wide inconsistent candidate beat a consistent delimiter", () => {
    const csv = "name,display;notes\nAda,Lovelace;one,two,three\nGrace;plain";
    expect(detectDelimiter(csv)).toBe(";");
  });

  it("exports round-trippable CSV with spreadsheet formula protection", () => {
    const rows = [
      { name: "Ada", notes: 'line 1\nline "2"', value: "=2+2" },
      { name: "Grace", notes: "comma, value", value: "ordinary" },
    ];
    const csv = serializeCSV(rows, ["name", "notes", "value"]);

    expect(csv).toContain("'=2+2");
    expect(parseCSV(csv).data).toEqual([
      { name: "Ada", notes: 'line 1\nline "2"', value: "'=2+2" },
      { name: "Grace", notes: "comma, value", value: "ordinary" },
    ]);
    expect(protectSpreadsheetCell("  @SUM(A1:A2)")).toBe("'  @SUM(A1:A2)");
    expect(protectSpreadsheetCell("\u0000\t=HYPERLINK(\"bad\")")).toBe(
      "'\u0000\t=HYPERLINK(\"bad\")"
    );
    expect(protectSpreadsheetCell("\ufeff+cmd|' /C calc'!A0")).toBe(
      "'\ufeff+cmd|' /C calc'!A0"
    );
  });
});
