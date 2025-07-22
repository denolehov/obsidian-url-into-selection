import { describe, it, expect } from "vitest";
import {
  testFilePath,
  isUrl,
  isWikilink,
  encodeAngleBrackets,
  needsAngleBrackets,
  isAlreadyWrapped,
  processUrl,
  isImgEmbed,
} from "./url";
import { DEFAULT_SETTINGS } from "../test/test-settings";

describe("URL Utilities", () => {
  describe("testFilePath", () => {
    it("should detect Windows file paths", () => {
      expect(testFilePath("C:\\Users\\Documents\\file.txt")).toBe(true);
      expect(testFilePath("D:\\path\\to\\file.exe")).toBe(true);
    });

    it("should detect Unix file paths", () => {
      expect(testFilePath("/home/user/documents/file.txt")).toBe(true);
      expect(testFilePath("/tmp/file")).toBe(true);
    });

    it("should reject command-like patterns", () => {
      expect(
        testFilePath("/worldconfigcreate bool colorAccurateWorldmap true"),
      ).toBe(false);
      expect(testFilePath("/help command")).toBe(false);
      expect(testFilePath("/command args")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(testFilePath("/foo-bar/baz")).toBe(true); // Should pass, dashes are valid
      expect(testFilePath("/")).toBe(false); // Single slash should fail
      expect(testFilePath("")).toBe(false);
    });
  });

  describe("isWikilink", () => {
    it("should detect basic wikilinks", () => {
      expect(isWikilink("[[Note Title]]")).toBe(true);
      expect(isWikilink("[[10. Links]]")).toBe(true);
    });

    it("should detect wikilinks with headers", () => {
      expect(isWikilink("[[Note Title#Header]]")).toBe(true);
      expect(isWikilink("[[10. Links#Header1]]")).toBe(true);
    });

    it("should handle whitespace in wikilinks", () => {
      expect(isWikilink("  [[Note Title]]  ")).toBe(true);
      expect(isWikilink("[[My Note With Spaces]]")).toBe(true);
    });

    it("should reject invalid wikilink formats", () => {
      expect(isWikilink("[Note Title]")).toBe(false);
      expect(isWikilink("[[Note Title]")).toBe(false);
      expect(isWikilink("[Note Title]]")).toBe(false);
      expect(isWikilink("[[]]")).toBe(false);
      expect(isWikilink("plain text")).toBe(false);
    });
  });

  describe("isUrl", () => {
    it("should detect valid HTTP/HTTPS URLs", () => {
      expect(isUrl("https://example.com", DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl("http://example.com/path", DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl("ftp://files.example.com", DEFAULT_SETTINGS)).toBe(true);
    });

    it("should detect wikilinks as URLs", () => {
      expect(isUrl("[[Note Title]]", DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl("[[10. Links#Header1]]", DEFAULT_SETTINGS)).toBe(true);
    });

    it("should detect mail and other schemes", () => {
      expect(isUrl("mailto:test@example.com", DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl("obsidian://vault/note", DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl("data:text/plain;base64,SGVsbG8=", DEFAULT_SETTINGS)).toBe(
        true,
      );
    });

    it("should detect file paths as URLs", () => {
      expect(isUrl("C:\\Users\\file.txt", DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl("/home/user/file.txt", DEFAULT_SETTINGS)).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(isUrl("", DEFAULT_SETTINGS)).toBe(false);
      expect(isUrl("plain text", DEFAULT_SETTINGS)).toBe(false);
      expect(isUrl("this has spaces", DEFAULT_SETTINGS)).toBe(false);
    });

    it("should use fallback regex when URL constructor fails", () => {
      const customSettings = {
        ...DEFAULT_SETTINGS,
        regex: "^example\\.(com|org)$",
      };
      expect(isUrl("example.com", customSettings)).toBe(true);
      expect(isUrl("example.net", customSettings)).toBe(false);
    });

    it("should still detect valid domains without protocol using anchored regex", () => {
      // These should still be detected as valid URLs by the new anchored fallback regex
      expect(isUrl("example.com", DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl("test.org", DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl("github.com", DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl("subdomain.example.com", DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl("site.co.uk", DEFAULT_SETTINGS)).toBe(true);
    });

    // Issue #39: False positives with current unanchored fallback regex
    describe("Issue #39: Should NOT detect false positive patterns as URLs", () => {
      it("should reject SSH signatures and cryptographic hashes", () => {
        // SSH signatures that contain dots but aren't URLs
        expect(
          isUrl(
            "SHA256:+LMe8hqm106I3FUuQrqBBSLPffRHf8GgnL+fPunc7ek 2022-02-11 obsidian-main repo",
            DEFAULT_SETTINGS,
          ),
        ).toBe(false);
        expect(
          isUrl("MD5:a1b2c3d4e5.f6g7h8i9j0 fingerprint", DEFAULT_SETTINGS),
        ).toBe(false);
        expect(isUrl("RSA-key:abc123.def456 keyname", DEFAULT_SETTINGS)).toBe(
          false,
        );
      });

      it("should reject CSS properties and styling", () => {
        expect(isUrl("font-style: italic", DEFAULT_SETTINGS)).toBe(false);
        expect(isUrl("color: red", DEFAULT_SETTINGS)).toBe(false);
        expect(isUrl("margin-top: 10px", DEFAULT_SETTINGS)).toBe(false);
        expect(isUrl("background: none", DEFAULT_SETTINGS)).toBe(false);
      });

      it("should reject function calls and parameters", () => {
        expect(isUrl("getUser: function", DEFAULT_SETTINGS)).toBe(false);
        expect(isUrl("config: true", DEFAULT_SETTINGS)).toBe(false);
        expect(isUrl("callback: null", DEFAULT_SETTINGS)).toBe(false);
        expect(isUrl("name: value", DEFAULT_SETTINGS)).toBe(false);
      });

      it("should reject text with colons but no protocol", () => {
        expect(isUrl("hello: world", DEFAULT_SETTINGS)).toBe(false);
        expect(isUrl("foo: bar", DEFAULT_SETTINGS)).toBe(false);
        expect(isUrl("key: value.property", DEFAULT_SETTINGS)).toBe(false);
        expect(isUrl("note: important.reminder", DEFAULT_SETTINGS)).toBe(false);
      });
    });

    // Issue #40: False positives with Templater/Dataview syntax
    describe("Issue #40: Should NOT detect Templater/Dataview syntax as URLs", () => {
      it("should reject basic Templater syntax", () => {
        expect(isUrl("tp.date.now: formatted", DEFAULT_SETTINGS)).toBe(false);
        expect(isUrl("tp.file.title: current", DEFAULT_SETTINGS)).toBe(false);
        expect(isUrl("tp.system.prompt: user", DEFAULT_SETTINGS)).toBe(false);
      });

      it("should reject Dataview queries", () => {
        expect(isUrl("dv.table: data", DEFAULT_SETTINGS)).toBe(false);
        expect(isUrl("dv.list: items", DEFAULT_SETTINGS)).toBe(false);
        expect(isUrl("dv.pages: filtered", DEFAULT_SETTINGS)).toBe(false);
      });

      it("should reject nested object property access", () => {
        expect(isUrl("file.name: basename", DEFAULT_SETTINGS)).toBe(false);
        expect(isUrl("page.title: heading", DEFAULT_SETTINGS)).toBe(false);
        expect(isUrl("meta.data: value", DEFAULT_SETTINGS)).toBe(false);
      });

      it("should reject multi-line text containing these patterns", () => {
        const multiLineText =
          "Some text with tp.date.now: formatted\nAnd more content here";
        expect(isUrl(multiLineText, DEFAULT_SETTINGS)).toBe(false);

        const configText = "config: settings\nother: properties";
        expect(isUrl(configText, DEFAULT_SETTINGS)).toBe(false);
      });

      it("should reject existing markdown links", () => {
        // Should not detect existing markdown links as URLs to avoid double-wrapping
        expect(isUrl("[test](test.com)", DEFAULT_SETTINGS)).toBe(false);
        expect(
          isUrl("[Example Link](https://example.com)", DEFAULT_SETTINGS),
        ).toBe(false);
        expect(isUrl("[GitHub](github.com/user/repo)", DEFAULT_SETTINGS)).toBe(
          false,
        );
        expect(
          isUrl("[File Link](file:///path/to/file.txt)", DEFAULT_SETTINGS),
        ).toBe(false);
      });
    });
  });

  describe("encodeAngleBrackets", () => {
    it("should encode single angle brackets", () => {
      expect(encodeAngleBrackets("https://example.com/<path>")).toBe(
        "https://example.com/%3Cpath%3E",
      );
    });

    it("should encode multiple angle brackets", () => {
      expect(encodeAngleBrackets("<start>middle<end>")).toBe(
        "%3Cstart%3Emiddle%3Cend%3E",
      );
    });

    it("should handle text without angle brackets", () => {
      expect(encodeAngleBrackets("https://example.com/path")).toBe(
        "https://example.com/path",
      );
    });
  });

  describe("needsAngleBrackets", () => {
    it("should detect URLs with spaces", () => {
      expect(needsAngleBrackets("https://example.com/path with spaces")).toBe(
        true,
      );
    });

    it("should detect URLs with parentheses", () => {
      expect(needsAngleBrackets("https://example.com/page(1)")).toBe(true);
    });

    it("should not flag normal URLs", () => {
      expect(needsAngleBrackets("https://example.com/path")).toBe(false);
    });
  });

  describe("isAlreadyWrapped", () => {
    it("should detect wrapped URLs", () => {
      expect(isAlreadyWrapped("<https://example.com>")).toBe(true);
    });

    it("should not flag unwrapped URLs", () => {
      expect(isAlreadyWrapped("https://example.com")).toBe(false);
      expect(isAlreadyWrapped("<partial")).toBe(false);
      expect(isAlreadyWrapped("partial>")).toBe(false);
    });
  });

  describe("processUrl", () => {
    it("should convert file paths to file URLs", () => {
      expect(processUrl("C:\\Users\\file.txt")).toBe(
        "file:///C:/Users/file.txt",
      );
      expect(processUrl("/home/user/file.txt")).toBe(
        "file:///home/user/file.txt",
      );
    });

    it("should handle multiple angle brackets correctly (global replace fix)", () => {
      expect(processUrl("https://example.com/<start><middle><end>")).toBe(
        "https://example.com/%3Cstart%3E%3Cmiddle%3E%3Cend%3E",
      );
    });

    it("should wrap URLs with special characters", () => {
      expect(processUrl("https://example.com/path with spaces")).toBe(
        "<https://example.com/path with spaces>",
      );
      expect(processUrl("https://example.com/page(1)")).toBe(
        "<https://example.com/page(1)>",
      );
    });

    it("should not double-wrap already wrapped URLs", () => {
      expect(processUrl("<https://example.com/path with spaces>")).toBe(
        "<https://example.com/path with spaces>",
      );
    });

    it("should encode angle brackets in URLs", () => {
      expect(processUrl("https://example.com/<path>")).toBe(
        "https://example.com/%3Cpath%3E",
      );
    });
  });

  describe("isImgEmbed", () => {
    it("should match image file extensions", () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        listForImgEmbed: "\\.(jpg|png|gif)$",
      };
      expect(isImgEmbed("https://example.com/photo.jpg", settings)).toBe(true);
      expect(isImgEmbed("https://example.com/image.png", settings)).toBe(true);
      expect(isImgEmbed("https://example.com/page.html", settings)).toBe(false);
    });

    it("should handle multiple regex patterns", () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        listForImgEmbed: "\\.(jpg|png)$\nyoutube\\.com",
      };
      expect(isImgEmbed("https://youtube.com/watch?v=123", settings)).toBe(
        true,
      );
      expect(isImgEmbed("https://example.com/photo.jpg", settings)).toBe(true);
      expect(isImgEmbed("https://vimeo.com/123", settings)).toBe(false);
    });

    it("should handle empty settings", () => {
      const settings = { ...DEFAULT_SETTINGS, listForImgEmbed: "" };
      expect(isImgEmbed("https://example.com/photo.jpg", settings)).toBe(false);
    });
  });
});
