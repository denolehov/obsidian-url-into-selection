import { describe, it, expect } from "vitest";
import { checkIfInMarkdownLink } from "./markdown";
import { Editor } from "../test/obsidian-mock";

describe("Markdown Utilities", () => {
  describe("checkIfInMarkdownLink", () => {
    it("should detect cursor inside basic markdown link parentheses", () => {
      const editor = new Editor("[Title]()", { line: 0, ch: 8 });
      const range = { from: { line: 0, ch: 8 }, to: { line: 0, ch: 8 } };
      expect(checkIfInMarkdownLink(editor, range)).toBe(true);
    });

    it("should detect cursor inside image link parentheses", () => {
      const editor = new Editor("![alt]()", { line: 0, ch: 7 });
      const range = { from: { line: 0, ch: 7 }, to: { line: 0, ch: 7 } };
      expect(checkIfInMarkdownLink(editor, range)).toBe(true);
    });

    it("should detect cursor inside parentheses with existing URL", () => {
      const editor = new Editor("[Title](https://example.com)", {
        line: 0,
        ch: 15,
      });
      const range = { from: { line: 0, ch: 15 }, to: { line: 0, ch: 15 } };
      expect(checkIfInMarkdownLink(editor, range)).toBe(true);
    });

    it("should handle nested parentheses in URLs", () => {
      const editor = new Editor("[Title](https://example.com/page(1))", {
        line: 0,
        ch: 20,
      });
      const range = { from: { line: 0, ch: 20 }, to: { line: 0, ch: 20 } };
      expect(checkIfInMarkdownLink(editor, range)).toBe(true);
    });

    it("should handle nested square brackets", () => {
      const editor = new Editor("[Title [nested]]()", { line: 0, ch: 17 });
      const range = { from: { line: 0, ch: 17 }, to: { line: 0, ch: 17 } };
      expect(checkIfInMarkdownLink(editor, range)).toBe(true);
    });

    it("should not detect when cursor is outside link parentheses", () => {
      const editor = new Editor("[Title]() some text", { line: 0, ch: 15 });
      const range = { from: { line: 0, ch: 15 }, to: { line: 0, ch: 15 } };
      expect(checkIfInMarkdownLink(editor, range)).toBe(false);
    });

    it("should not detect when cursor is in square brackets", () => {
      const editor = new Editor("[Title]()", { line: 0, ch: 3 });
      const range = { from: { line: 0, ch: 3 }, to: { line: 0, ch: 3 } };
      expect(checkIfInMarkdownLink(editor, range)).toBe(false);
    });

    it("should not detect when no markdown link present", () => {
      const editor = new Editor("regular text", { line: 0, ch: 5 });
      const range = { from: { line: 0, ch: 5 }, to: { line: 0, ch: 5 } };
      expect(checkIfInMarkdownLink(editor, range)).toBe(false);
    });

    it("should handle multiple links on same line", () => {
      const editor = new Editor("[First](url1) and [Second]()", {
        line: 0,
        ch: 27,
      });
      const range = { from: { line: 0, ch: 27 }, to: { line: 0, ch: 27 } };
      expect(checkIfInMarkdownLink(editor, range)).toBe(true);
    });

    it("should handle complex parentheses nesting", () => {
      const editor = new Editor("[Title](https://example.com/func(a, b))", {
        line: 0,
        ch: 25,
      });
      const range = { from: { line: 0, ch: 25 }, to: { line: 0, ch: 25 } };
      expect(checkIfInMarkdownLink(editor, range)).toBe(true);
    });

    it("should return false when cursor is before the opening parenthesis", () => {
      const editor = new Editor("[Title]()", { line: 0, ch: 7 });
      const range = { from: { line: 0, ch: 7 }, to: { line: 0, ch: 7 } };
      expect(checkIfInMarkdownLink(editor, range)).toBe(false);
    });

    it("should return false when cursor is after closing parenthesis", () => {
      const editor = new Editor("[Title]()", { line: 0, ch: 10 });
      const range = { from: { line: 0, ch: 10 }, to: { line: 0, ch: 10 } };
      expect(checkIfInMarkdownLink(editor, range)).toBe(false);
    });
  });
});
