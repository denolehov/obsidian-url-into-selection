import { describe, it, expect } from "vitest";
import { stripSurroundingQuotes } from "./quotes";

describe("Quote Utilities", () => {
  describe("stripSurroundingQuotes", () => {
    it("should strip double quotes from both ends", () => {
      expect(stripSurroundingQuotes('"https://example.com"')).toBe(
        "https://example.com",
      );
      expect(stripSurroundingQuotes('"C:\\path\\file.txt"')).toBe(
        "C:\\path\\file.txt",
      );
    });

    it("should strip single quotes from both ends", () => {
      expect(stripSurroundingQuotes("'https://example.com'")).toBe(
        "https://example.com",
      );
      expect(stripSurroundingQuotes("'/Users/name/file.txt'")).toBe(
        "/Users/name/file.txt",
      );
    });

    it("should not strip mismatched quotes", () => {
      expect(stripSurroundingQuotes("\"https://example.com'")).toBe(
        "\"https://example.com'",
      );
      expect(stripSurroundingQuotes("'https://example.com\"")).toBe(
        "'https://example.com\"",
      );
    });

    it("should not strip single-sided quotes", () => {
      expect(stripSurroundingQuotes('"https://example.com')).toBe(
        '"https://example.com',
      );
      expect(stripSurroundingQuotes('https://example.com"')).toBe(
        'https://example.com"',
      );
      expect(stripSurroundingQuotes("'https://example.com")).toBe(
        "'https://example.com",
      );
      expect(stripSurroundingQuotes("https://example.com'")).toBe(
        "https://example.com'",
      );
    });

    it("should handle empty strings and edge cases", () => {
      expect(stripSurroundingQuotes("")).toBe("");
      expect(stripSurroundingQuotes('"')).toBe('"');
      expect(stripSurroundingQuotes("'")).toBe("'");
      expect(stripSurroundingQuotes('""')).toBe("");
      expect(stripSurroundingQuotes("''")).toBe("");
    });

    it("should preserve quotes that are part of the content", () => {
      expect(
        stripSurroundingQuotes('https://example.com/search?q="quoted text"'),
      ).toBe('https://example.com/search?q="quoted text"');
      expect(stripSurroundingQuotes('"url with "quoted" content"')).toBe(
        'url with "quoted" content',
      );
    });

    it("should handle URLs with quotes in the middle", () => {
      expect(
        stripSurroundingQuotes(
          '"https://example.com/search?q="test"&other=value"',
        ),
      ).toBe('https://example.com/search?q="test"&other=value');
    });
  });
});
