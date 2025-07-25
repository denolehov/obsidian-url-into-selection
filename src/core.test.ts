import { describe, it, expect, beforeEach } from "vitest";
import { Editor } from "./test/obsidian-mock";
import UrlIntoSelection from "./core";
import { NothingSelected, PluginSettings } from "./types";
import { DEFAULT_SETTINGS } from "./test/test-settings";

// Expose internal functions for testing by importing them differently
// We'll need to restructure the core module to export these functions

describe("URL into Selection - Markdown Link Context", () => {
  let editor: Editor;
  let settings: PluginSettings;

  beforeEach(() => {
    settings = {
      ...DEFAULT_SETTINGS,
      nothingSelected: NothingSelected.insertBare,
    };
  });

  describe("when pasting URL inside markdown link parentheses", () => {
    it("should NOT wrap URL with angle brackets when cursor is between link parentheses", () => {
      // Setup: cursor positioned between the parentheses of [Title]()
      editor = new Editor("[Title]()", { line: 0, ch: 8 });
      const clipboardText = "https://example.com";

      // Act
      UrlIntoSelection(editor, clipboardText, settings);

      // Assert: URL should be pasted without angle brackets
      expect(editor.getValue()).toBe("[Title](https://example.com)");
    });

    it("should NOT wrap URL with angle brackets when cursor is inside partially filled link", () => {
      // Setup: cursor positioned after existing partial URL
      editor = new Editor("[Title](https://)", { line: 0, ch: 16 });
      const clipboardText = "example.com";

      // Act
      UrlIntoSelection(editor, clipboardText, settings);

      // Assert: URL should be pasted without angle brackets
      expect(editor.getValue()).toBe("[Title](https://example.com)");
    });

    it("should NOT wrap URL with angle brackets when replacing selected text inside link parentheses", () => {
      // Setup: select "old-url" inside [Title](old-url)
      editor = new Editor("[Title](old-url)", { line: 0, ch: 8 });
      editor.setSelection({ line: 0, ch: 8 }, { line: 0, ch: 15 });
      const clipboardText = "https://example.com";

      // Act
      UrlIntoSelection(editor, clipboardText, settings);

      // Assert: URL should replace selection without angle brackets
      expect(editor.getValue()).toBe("[Title](https://example.com)");
    });

    it("should NOT wrap URL when cursor is between image link parentheses ![alt]()", () => {
      // Setup: cursor positioned between the parentheses of ![alt]()
      editor = new Editor("![alt]()", { line: 0, ch: 7 });
      const clipboardText = "https://example.com/image.png";

      // Act
      UrlIntoSelection(editor, clipboardText, settings);

      // Assert: URL should be pasted without angle brackets
      expect(editor.getValue()).toBe("![alt](https://example.com/image.png)");
    });
  });

  describe("when pasting URL outside markdown link context", () => {
    it("should wrap URL with angle brackets when cursor is on empty line", () => {
      // Setup: empty editor
      editor = new Editor("", { line: 0, ch: 0 });
      const clipboardText = "https://example.com";

      // Act
      UrlIntoSelection(editor, clipboardText, settings);

      // Assert: URL should be wrapped with angle brackets
      expect(editor.getValue()).toBe("<https://example.com>");
    });

    it("should wrap URL with angle brackets when cursor is in regular text", () => {
      // Setup: cursor in middle of regular text
      editor = new Editor("Check this out: ", { line: 0, ch: 16 });
      const clipboardText = "https://example.com";

      // Act
      UrlIntoSelection(editor, clipboardText, settings);

      // Assert: URL should be wrapped with angle brackets
      expect(editor.getValue()).toBe("Check this out: <https://example.com>");
    });

    it("should wrap URL with angle brackets when not inside link parentheses", () => {
      // Setup: cursor before the link syntax
      editor = new Editor("[Title](url) some text", { line: 0, ch: 0 });
      const clipboardText = "https://example.com";

      // Act
      UrlIntoSelection(editor, clipboardText, settings);

      // Assert: URL should be wrapped with angle brackets
      expect(editor.getValue()).toBe(
        "<https://example.com>[Title](url) some text",
      );
    });

    it("should wrap URL when cursor is in square brackets of markdown link", () => {
      // Setup: cursor inside [Title]
      editor = new Editor("[Title]()", { line: 0, ch: 3 });
      const clipboardText = "https://example.com";

      // Act
      UrlIntoSelection(editor, clipboardText, settings);

      // Assert: URL should be wrapped since we're not in the parentheses
      expect(editor.getValue()).toBe("[Ti<https://example.com>tle]()");
    });
  });

  describe("edge cases", () => {
    it("should handle nested parentheses correctly", () => {
      // Setup: markdown link with parentheses in URL
      editor = new Editor("[Title](https://example.com/page(1))", {
        line: 0,
        ch: 8,
      });
      editor.setSelection({ line: 0, ch: 8 }, { line: 0, ch: 35 });
      const clipboardText = "https://example.com/page(2)";

      // Act
      UrlIntoSelection(editor, clipboardText, settings);

      // Assert: Should replace without adding angle brackets
      expect(editor.getValue()).toBe("[Title](https://example.com/page(2))");
    });

    it("should handle multiple links on same line", () => {
      // Setup: cursor in second link's parentheses
      editor = new Editor("[First](url1) and [Second]()", { line: 0, ch: 27 });
      const clipboardText = "https://example.com";

      // Act
      UrlIntoSelection(editor, clipboardText, settings);

      // Assert: Should not wrap in angle brackets
      expect(editor.getValue()).toBe(
        "[First](url1) and [Second](https://example.com)",
      );
    });

    it("should handle multiline content correctly", () => {
      // Setup: link syntax across multiple lines (though unusual)
      editor = new Editor("Some text\n[Title]()\nMore text", {
        line: 1,
        ch: 8,
      });
      const clipboardText = "https://example.com";

      // Act
      UrlIntoSelection(editor, clipboardText, settings);

      // Assert: Should not wrap in angle brackets
      expect(editor.getValue()).toBe(
        "Some text\n[Title](https://example.com)\nMore text",
      );
    });

    it("should handle pasting URL into existing link with placeholder text (reported issue)", () => {
      // Setup: [example](paste_here) with "paste_here" selected
      editor = new Editor("[example](paste_here)", { line: 0, ch: 10 });
      editor.setSelection({ line: 0, ch: 10 }, { line: 0, ch: 20 });
      const clipboardText = "google.com";

      // Act
      UrlIntoSelection(editor, clipboardText, settings);

      // Assert: Should replace "paste_here" with "google.com" without creating nested links
      expect(editor.getValue()).toBe("[example](google.com)");
      // The bug would produce: [example]([ ](google.com))
    });

    it("should handle pasting bare domain URLs without protocol", () => {
      // Test various bare domain formats
      const testCases = [
        { domain: "google.com", expected: "[example](google.com)" },
        { domain: "github.com", expected: "[example](github.com)" },
        { domain: "example.org", expected: "[example](example.org)" },
        { domain: "sub.example.com", expected: "[example](sub.example.com)" },
      ];

      testCases.forEach(({ domain, expected }) => {
        editor = new Editor("[example](paste_here)", { line: 0, ch: 10 });
        editor.setSelection({ line: 0, ch: 10 }, { line: 0, ch: 20 });
        
        UrlIntoSelection(editor, domain, settings);
        
        expect(editor.getValue()).toBe(expected);
      });
    });
  });
});

describe("URL Detection Logic (isUrl function)", () => {
  let settings: PluginSettings;

  beforeEach(() => {
    settings = { ...DEFAULT_SETTINGS };
  });

  describe("Valid URLs", () => {
    it("should detect standard HTTP URLs", () => {
      const editor = new Editor("text", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });

      UrlIntoSelection(editor, "https://example.com", settings);
      expect(editor.getValue()).toBe("[text](https://example.com)");
    });

    it("should detect HTTPS URLs with paths and query parameters", () => {
      const editor = new Editor("test", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });

      UrlIntoSelection(
        editor,
        "https://example.com/path?query=value&other=123",
        settings,
      );
      expect(editor.getValue()).toBe(
        "[test](https://example.com/path?query=value&other=123)",
      );
    });

    it("should detect FTP URLs", () => {
      const editor = new Editor("ftp link", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 8 });

      UrlIntoSelection(editor, "ftp://files.example.com/file.txt", settings);
      expect(editor.getValue()).toBe(
        "[ftp link](ftp://files.example.com/file.txt)",
      );
    });
  });

  describe("File Paths", () => {
    it("should detect Windows file paths", () => {
      const editor = new Editor("file", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });

      UrlIntoSelection(editor, "C:\\Users\\Documents\\file.txt", settings);
      expect(editor.getValue()).toBe(
        "[file](file:///C:/Users/Documents/file.txt)",
      );
    });

    it("should detect Unix file paths", () => {
      const editor = new Editor("document", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 8 });

      UrlIntoSelection(editor, "/home/user/documents/file.txt", settings);
      expect(editor.getValue()).toBe(
        "[document](file:///home/user/documents/file.txt)",
      );
    });
  });

  describe("Invalid URLs", () => {
    it("should reject plain text without URL format", () => {
      const editor = new Editor("", { line: 0, ch: 0 });

      UrlIntoSelection(editor, "just plain text", settings);
      expect(editor.getValue()).toBe(""); // Should not process
    });

    it("should reject empty strings", () => {
      const editor = new Editor("", { line: 0, ch: 0 });

      UrlIntoSelection(editor, "", settings);
      expect(editor.getValue()).toBe("");
    });

    // Issue GH#58: Commands should not be treated as URLs
    it("should reject command-like text starting with slash and word characters", () => {
      const editor = new Editor("", { line: 0, ch: 0 });

      UrlIntoSelection(
        editor,
        "/worldconfigcreate bool colorAccurateWorldmap true",
        settings,
      );
      expect(editor.getValue()).toBe(""); // Should not process
    });

    it("should reject other command patterns", () => {
      const editor = new Editor("", { line: 0, ch: 0 });

      UrlIntoSelection(editor, "/help command", settings);
      expect(editor.getValue()).toBe(""); // Should not process
    });

    // Test with selected text to simulate what user reported in issue #58
    it("should not process command when pasting with selected text", () => {
      const editor = new Editor("some text", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 9 });

      UrlIntoSelection(
        editor,
        "/worldconfigcreate bool colorAccurateWorldmap true",
        settings,
      );
      expect(editor.getValue()).toBe("some text"); // Should not change the text
    });

    it("should reject text with spaces (unencoded URLs)", () => {
      const editor = new Editor("", { line: 0, ch: 0 });

      UrlIntoSelection(editor, "this has spaces in it", settings);
      expect(editor.getValue()).toBe(""); // Should not process
    });

    it("should reject configuration-like text", () => {
      const editor = new Editor("", { line: 0, ch: 0 });

      UrlIntoSelection(editor, "config.setting = true", settings);
      expect(editor.getValue()).toBe(""); // Should not process
    });
  });

  describe("Custom Regex Fallback", () => {
    it("should use custom regex when URL constructor fails", () => {
      const customSettings = {
        ...DEFAULT_SETTINGS,
        regex: "example\\.(com|org)",
      };
      const editor = new Editor("link", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });

      UrlIntoSelection(editor, "example.com", customSettings);
      expect(editor.getValue()).toBe("[link](example.com)");
    });
  });
});

describe("NothingSelected Behaviors", () => {
  let editor: Editor;

  describe("doNothing mode", () => {
    it("should skip processing when nothing is selected", () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        nothingSelected: NothingSelected.doNothing,
      };
      editor = new Editor("some text", { line: 0, ch: 4 });

      UrlIntoSelection(editor, "https://example.com", settings);
      expect(editor.getValue()).toBe("some text"); // No change
    });
  });

  describe("autoSelect mode", () => {
    it("should auto-select word at cursor position", () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        nothingSelected: NothingSelected.autoSelect,
      };
      editor = new Editor("word here", { line: 0, ch: 2 }); // cursor in 'word'

      UrlIntoSelection(editor, "https://example.com", settings);
      expect(editor.getValue()).toBe("[word](https://example.com) here");
    });

    it("should auto-select URL at cursor position", () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        nothingSelected: NothingSelected.autoSelect,
      };
      editor = new Editor("Check https://old.com out", { line: 0, ch: 15 }); // cursor in URL

      UrlIntoSelection(editor, "New Link Text", settings);
      expect(editor.getValue()).toBe(
        "Check [New Link Text](https://old.com) out",
      );
    });
  });

  describe("insertInline mode", () => {
    it("should create [](url) format and position cursor between brackets", () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        nothingSelected: NothingSelected.insertInline,
      };
      editor = new Editor("", { line: 0, ch: 0 });

      UrlIntoSelection(editor, "https://example.com", settings);
      expect(editor.getValue()).toBe("[](https://example.com)");
      expect(editor.getCursor()).toEqual({ line: 0, ch: 1 }); // Cursor between brackets
    });
  });

  describe("insertBare mode", () => {
    it("should create <url> format", () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        nothingSelected: NothingSelected.insertBare,
      };
      editor = new Editor("", { line: 0, ch: 0 });

      UrlIntoSelection(editor, "https://example.com", settings);
      expect(editor.getValue()).toBe("<https://example.com>");
    });
  });
});

describe("Image Embed Detection (isImgEmbed function)", () => {
  let editor: Editor;

  describe("Image file extensions", () => {
    it("should detect common image extensions", () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        listForImgEmbed: "\\.(jpg|jpeg|png|gif|bmp|svg|webp)$",
      };
      editor = new Editor("image", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

      UrlIntoSelection(editor, "https://example.com/photo.jpg", settings);
      expect(editor.getValue()).toBe("![image](https://example.com/photo.jpg)");
    });
  });

  describe("Video/YouTube patterns", () => {
    it("should detect YouTube URLs", () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        listForImgEmbed: "youtube\\.com|youtu\\.be",
      };
      editor = new Editor("video", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

      UrlIntoSelection(editor, "https://youtube.com/watch?v=abc123", settings);
      expect(editor.getValue()).toBe(
        "![video](https://youtube.com/watch?v=abc123)",
      );
    });
  });

  describe("Multiple regex patterns", () => {
    it("should handle multiple rules separated by newlines", () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        listForImgEmbed: "\\.(jpg|png)$\nyoutube\\.com\nvimeo\\.com",
      };
      editor = new Editor("media", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

      UrlIntoSelection(editor, "https://vimeo.com/123456", settings);
      expect(editor.getValue()).toBe("![media](https://vimeo.com/123456)");
    });
  });
});

describe("File Path Processing (processUrl function)", () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor("link", { line: 0, ch: 0 });
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
  });

  describe("URLs with special characters", () => {
    it("should wrap URLs with spaces in angle brackets", () => {
      UrlIntoSelection(
        editor,
        "https://example.com/path with spaces",
        DEFAULT_SETTINGS,
      );
      expect(editor.getValue()).toBe(
        "[link](<https://example.com/path with spaces>)",
      );
    });

    it("should wrap URLs with parentheses in angle brackets", () => {
      UrlIntoSelection(editor, "https://example.com/page(1)", DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe("[link](<https://example.com/page(1)>)");
    });

    it("should encode angle brackets in URLs", () => {
      UrlIntoSelection(editor, "https://example.com/<path>", DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe("[link](https://example.com/%3Cpath%3E)");
    });
  });

  describe("File URL conversion", () => {
    it("should convert Windows paths to file URLs", () => {
      UrlIntoSelection(editor, "C:\\path\\file.txt", DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe("[link](file:///C:/path/file.txt)");
    });

    it("should convert Unix paths to file URLs", () => {
      UrlIntoSelection(editor, "/home/user/file.txt", DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe("[link](file:///home/user/file.txt)");
    });
  });
});

describe("Selection Whitespace Preservation", () => {
  it("should preserve intentional leading and trailing spaces in link text", () => {
    const editor = new Editor("  spaced text  ", { line: 0, ch: 0 });
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 15 }); // Select including spaces

    UrlIntoSelection(editor, "https://example.com", DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe("[  spaced text  ](https://example.com)");
  });

  it("should handle tabs and other whitespace characters in selection", () => {
    const editor = new Editor("\ttext ", { line: 0, ch: 0 });
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 6 }); // Select tab and trailing space

    UrlIntoSelection(editor, "https://example.com", DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe("[\ttext ](https://example.com)");
  });
});

describe("Bidirectional URL/Text Swapping", () => {
  describe("Selected text is URL, clipboard contains title", () => {
    it("should use clipboard text as title and selected URL as link", () => {
      const editor = new Editor("https://example.com", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 19 }); // Select full URL

      UrlIntoSelection(editor, "Example Website", DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe("[Example Website](https://example.com)");
    });

    it("should trim whitespace from clipboard text", () => {
      const editor = new Editor("https://example.com", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 19 }); // Select full URL

      UrlIntoSelection(editor, "  Trimmed Title  ", DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe("[Trimmed Title](https://example.com)");
    });
  });

  describe("Clipboard is URL, selected text is title", () => {
    it("should use selected text as title and clipboard URL as link", () => {
      const editor = new Editor("My Website", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 10 });

      UrlIntoSelection(editor, "https://example.com", DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe("[My Website](https://example.com)");
    });
  });

  describe("Neither is URL", () => {
    it("should not process when neither clipboard nor selection is URL", () => {
      const editor = new Editor("plain text", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 10 });

      UrlIntoSelection(editor, "more plain text", DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe("plain text"); // No change
    });
  });
});

describe("Quote Stripping for File Paths", () => {
  describe("Windows file paths with quotes", () => {
    it("should strip double quotes from Windows file paths", () => {
      const editor = new Editor("some text", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 9 });

      // Windows "Copy as path" format with double quotes
      UrlIntoSelection(
        editor,
        '"V:\\2022 Trading Calendar.xlsx"',
        DEFAULT_SETTINGS,
      );
      expect(editor.getValue()).toBe(
        "[some text](file:///V:/2022%20Trading%20Calendar.xlsx)",
      );
    });

    it("should strip double quotes from Windows file paths with spaces", () => {
      const editor = new Editor("document", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 8 });

      UrlIntoSelection(
        editor,
        '"C:\\Program Files\\My App\\file.txt"',
        DEFAULT_SETTINGS,
      );
      expect(editor.getValue()).toBe(
        "[document](file:///C:/Program%20Files/My%20App/file.txt)",
      );
    });

    it("should handle double quotes around regular Windows paths without spaces", () => {
      const editor = new Editor("file", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });

      UrlIntoSelection(
        editor,
        '"C:\\Users\\Documents\\file.txt"',
        DEFAULT_SETTINGS,
      );
      expect(editor.getValue()).toBe(
        "[file](file:///C:/Users/Documents/file.txt)",
      );
    });
  });

  describe("macOS file paths with quotes", () => {
    it("should strip single quotes from macOS file paths", () => {
      const editor = new Editor("document", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 8 });

      // macOS Sequoia "Copy as Pathname" format with single quotes
      UrlIntoSelection(
        editor,
        "'/Users/name/Documents/My File.txt'",
        DEFAULT_SETTINGS,
      );
      expect(editor.getValue()).toBe(
        "[document](file:///Users/name/Documents/My%20File.txt)",
      );
    });

    it("should handle single quotes around Unix paths without spaces", () => {
      const editor = new Editor("file", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });

      UrlIntoSelection(
        editor,
        "'/home/user/documents/file.txt'",
        DEFAULT_SETTINGS,
      );
      expect(editor.getValue()).toBe(
        "[file](file:///home/user/documents/file.txt)",
      );
    });
  });

  describe("URLs with quotes", () => {
    it("should strip double quotes from URLs", () => {
      const editor = new Editor("link", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });

      UrlIntoSelection(
        editor,
        '"https://example.com/page with spaces"',
        DEFAULT_SETTINGS,
      );
      expect(editor.getValue()).toBe(
        "[link](<https://example.com/page with spaces>)",
      );
    });

    it("should strip single quotes from URLs", () => {
      const editor = new Editor("website", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 7 });

      UrlIntoSelection(editor, "'https://example.com/path'", DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe("[website](https://example.com/path)");
    });
  });

  describe("Edge cases for quote stripping", () => {
    it("should not strip quotes if only closing quote exists", () => {
      const editor = new Editor("text", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });

      UrlIntoSelection(editor, 'https://example.com"', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[text](https://example.com")');
    });

    it("should handle empty string after quote stripping", () => {
      const editor = new Editor("text", { line: 0, ch: 0 });
      const originalValue = editor.getValue();

      UrlIntoSelection(editor, '""', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe(originalValue); // No change, empty string is not a valid URL
    });

    it("should handle single character strings", () => {
      const editor = new Editor("text", { line: 0, ch: 0 });
      const originalValue = editor.getValue();

      UrlIntoSelection(editor, '"', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe(originalValue); // No change, too short
    });

    it("should handle strings that are only quotes", () => {
      const editor = new Editor("text", { line: 0, ch: 0 });
      const originalValue = editor.getValue();

      UrlIntoSelection(editor, "''", DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe(originalValue); // No change, empty after stripping
    });

    it("should preserve quotes that are part of the actual URL/path", () => {
      const editor = new Editor("query", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

      // URL with quotes in the middle (not surrounding)
      UrlIntoSelection(
        editor,
        'https://example.com/search?q="quoted text"&other=value',
        DEFAULT_SETTINGS,
      );
      expect(editor.getValue()).toBe(
        '[query](<https://example.com/search?q="quoted text"&other=value>)',
      );
    });
  });
});

describe("Obsidian Wikilink Support", () => {
  let editor: Editor;
  let settings: PluginSettings;

  beforeEach(() => {
    editor = new Editor("", { line: 0, ch: 0 });
    settings = { ...DEFAULT_SETTINGS };
  });

  describe("when pasting wikilinks with selected text", () => {
    it("should preserve selected text as alias for basic wikilink", () => {
      editor = new Editor("Click Link Here", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 15 });
      const clipboardText = "[[10. Links]]";

      UrlIntoSelection(editor, clipboardText, settings);
      expect(editor.getValue()).toBe("[[10. Links|Click Link Here]]");
    });

    it("should preserve selected text as alias for wikilink with header", () => {
      editor = new Editor("Click Link Here", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 15 });
      const clipboardText = "[[10. Links#Header1]]";

      UrlIntoSelection(editor, clipboardText, settings);
      expect(editor.getValue()).toBe("[[10. Links#Header1|Click Link Here]]");
    });

    it("should handle wikilinks with spaces and special characters", () => {
      editor = new Editor("Custom Text", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 11 });
      const clipboardText = "[[My Note With Spaces#Section 1]]";

      UrlIntoSelection(editor, clipboardText, settings);
      expect(editor.getValue()).toBe(
        "[[My Note With Spaces#Section 1|Custom Text]]",
      );
    });

    it("should insert bare wikilink when no text is selected and setting is insertBare", () => {
      editor = new Editor("", { line: 0, ch: 0 });
      settings.nothingSelected = NothingSelected.insertBare;
      const clipboardText = "[[10. Links#Header1]]";

      UrlIntoSelection(editor, clipboardText, settings);
      expect(editor.getValue()).toBe("[[10. Links#Header1]]");
    });
  });

  describe("when selected text is wikilink and clipboard has regular text", () => {
    it("should use clipboard text as alias for selected wikilink", () => {
      editor = new Editor("[[10. Links#Header1]]", { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 21 });
      const clipboardText = "Click Link Here";

      UrlIntoSelection(editor, clipboardText, settings);
      expect(editor.getValue()).toBe("[[10. Links#Header1|Click Link Here]]");
    });
  });
});

describe("Clipboard Event Handling", () => {
  it("should handle string input", () => {
    const editor = new Editor("text", { line: 0, ch: 0 });
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });

    UrlIntoSelection(editor, "https://example.com", DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe("[text](https://example.com)");
  });

  it("should handle undefined clipboardData gracefully", () => {
    const editor = new Editor("text", { line: 0, ch: 0 });
    const originalValue = editor.getValue();

    const mockClipboardEvent = {
      clipboardData: undefined,
    } as unknown as ClipboardEvent;

    UrlIntoSelection(editor, mockClipboardEvent, DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe(originalValue); // No change
  });

  it("should extract text from ClipboardEvent", () => {
    const editor = new Editor("text", { line: 0, ch: 0 });
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });

    const mockClipboardEvent = {
      clipboardData: {
        getData: (type: string) =>
          type === "text" ? "https://example.com" : "",
      },
      preventDefault: () => {},
    } as unknown as ClipboardEvent;

    UrlIntoSelection(editor, mockClipboardEvent, DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe("[text](https://example.com)");
  });

  it("should handle null clipboardData gracefully", () => {
    const editor = new Editor("text", { line: 0, ch: 0 });
    const originalValue = editor.getValue();

    const mockClipboardEvent = {
      clipboardData: null,
    } as unknown as ClipboardEvent;

    UrlIntoSelection(editor, mockClipboardEvent, DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe(originalValue); // No change
  });

  it("should trim clipboard text content", () => {
    const editor = new Editor("text", { line: 0, ch: 0 });
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });

    const mockClipboardEvent = {
      clipboardData: {
        getData: () => "  https://example.com  ",
      },
      preventDefault: () => {},
    } as unknown as ClipboardEvent;

    UrlIntoSelection(editor, mockClipboardEvent, DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe("[text](https://example.com)");
  });

  it("should strip quotes from clipboard event data", () => {
    const editor = new Editor("text", { line: 0, ch: 0 });
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });

    const mockClipboardEvent = {
      clipboardData: {
        getData: () => '"https://example.com"',
      },
      preventDefault: () => {},
    } as unknown as ClipboardEvent;

    UrlIntoSelection(editor, mockClipboardEvent, DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe("[text](https://example.com)");
  });
});

describe("Code Block Detection", () => {
  let editor: Editor;
  let settings: PluginSettings;

  beforeEach(() => {
    settings = {
      ...DEFAULT_SETTINGS,
      disableInCodeBlocks: false, // Start with feature disabled to test both states
    };
  });

  describe("Fenced code blocks", () => {
    describe("when cursor is inside fenced code block", () => {
      it("should skip URL processing when disableInCodeBlocks is true", () => {
        settings.disableInCodeBlocks = true;
        const content = "```javascript\nconsole.log('test');\n// paste here\n```";
        editor = new Editor(content, { line: 2, ch: 3 }); // cursor in comment line
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // No change - URL processing skipped
      });

      it("should process URL normally when disableInCodeBlocks is false", () => {
        settings.disableInCodeBlocks = false;
        settings.nothingSelected = NothingSelected.insertBare;
        const content = "```javascript\nconsole.log('test');\n\n```";
        editor = new Editor(content, { line: 2, ch: 0 }); // cursor on empty line in code block
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe("```javascript\nconsole.log('test');\n<https://example.com>\n```");
      });

      it("should detect cursor in code block with language specifier", () => {
        settings.disableInCodeBlocks = true;
        const content = "```python\ndef hello():\n    # cursor here\n    pass\n```";
        editor = new Editor(content, { line: 2, ch: 6 });
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // No change
      });

      it("should detect cursor in code block without language specifier", () => {
        settings.disableInCodeBlocks = true;
        const content = "```\nsome code\ncursor here\n```";
        editor = new Editor(content, { line: 2, ch: 0 });
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // No change
      });

      it("should handle selected text inside code block", () => {
        settings.disableInCodeBlocks = true;
        const content = "```js\nconst url = 'text';\n```";
        editor = new Editor(content, { line: 1, ch: 13 });
        editor.setSelection({ line: 1, ch: 13 }, { line: 1, ch: 17 }); // select 'text'
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // No change
      });
    });

    describe("when cursor is outside fenced code block", () => {
      it("should process URL normally when cursor is before code block", () => {
        settings.disableInCodeBlocks = true;
        settings.nothingSelected = NothingSelected.insertBare;
        const content = "Text before\n```\ncode\n```";
        editor = new Editor(content, { line: 0, ch: 5 }); // cursor in "Text before"
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe("Text <https://example.com>before\n```\ncode\n```");
      });

      it("should process URL normally when cursor is after code block", () => {
        settings.disableInCodeBlocks = true;
        settings.nothingSelected = NothingSelected.insertBare;
        const content = "```\ncode\n```\nText after";
        editor = new Editor(content, { line: 3, ch: 5 }); // cursor in "Text after"
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe("```\ncode\n```\nText <https://example.com>after");
      });

      it("should process URL normally between code blocks", () => {
        settings.disableInCodeBlocks = true;
        settings.nothingSelected = NothingSelected.insertBare;
        const content = "```\ncode1\n```\nMiddle text\n```\ncode2\n```";
        editor = new Editor(content, { line: 3, ch: 7 }); // cursor in "Middle text"
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe("```\ncode1\n```\nMiddle <https://example.com>text\n```\ncode2\n```");
      });
    });

    describe("edge cases for fenced code blocks", () => {
      it("should handle cursor on opening fence line", () => {
        settings.disableInCodeBlocks = true;
        const content = "```javascript\ncode\n```";
        editor = new Editor(content, { line: 0, ch: 3 }); // cursor on opening ```
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // Should skip - considered inside block
      });

      it("should handle cursor on closing fence line", () => {
        settings.disableInCodeBlocks = true;
        const content = "```\ncode\n```";
        editor = new Editor(content, { line: 2, ch: 1 }); // cursor on closing ```
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // Should skip - considered inside block
      });

      it("should handle nested code blocks in blockquotes", () => {
        settings.disableInCodeBlocks = true;
        const content = "> ```\n> code here\n> ```";
        editor = new Editor(content, { line: 1, ch: 7 }); // cursor in "code here"
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // No change
      });

      it("should handle code blocks with extra backticks", () => {
        settings.disableInCodeBlocks = true;
        const content = "````javascript\ncode with ``` inside\n````";
        editor = new Editor(content, { line: 1, ch: 5 });
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // No change
      });

      it("should not be confused by inline code that looks like fence", () => {
        settings.disableInCodeBlocks = true;
        settings.nothingSelected = NothingSelected.insertBare;
        const content = "This is ```` not a code block\nNext line";
        editor = new Editor(content, { line: 1, ch: 5 });
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe("This is ```` not a code block\nNext <https://example.com>line");
      });
    });
  });

  describe("Inline code blocks", () => {
    describe("when cursor is inside inline code", () => {
      it("should skip URL processing when disableInCodeBlocks is true", () => {
        settings.disableInCodeBlocks = true;
        const content = "This is `inline code` text";
        editor = new Editor(content, { line: 0, ch: 15 }); // cursor inside inline code
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // No change
      });

      it("should process URL normally when disableInCodeBlocks is false", () => {
        settings.disableInCodeBlocks = false;
        settings.nothingSelected = NothingSelected.insertBare;
        const content = "This is `code` text";
        editor = new Editor(content, { line: 0, ch: 11 }); // cursor inside inline code
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe("This is `co<https://example.com>de` text");
      });

      it("should handle selected text inside inline code", () => {
        settings.disableInCodeBlocks = true;
        const content = "Text with `some code here` inline";
        editor = new Editor(content, { line: 0, ch: 11 });
        editor.setSelection({ line: 0, ch: 11 }, { line: 0, ch: 15 }); // select "some"
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // No change
      });

      it("should detect cursor in inline code with special characters", () => {
        settings.disableInCodeBlocks = true;
        const content = "Use `const url = 'https://test.com'` here";
        editor = new Editor(content, { line: 0, ch: 20 }); // cursor inside the inline code
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // No change
      });
    });

    describe("when cursor is outside inline code", () => {
      it("should process URL normally when cursor is before inline code", () => {
        settings.disableInCodeBlocks = true;
        settings.nothingSelected = NothingSelected.insertBare;
        const content = "Text `code` after";
        editor = new Editor(content, { line: 0, ch: 3 }); // cursor before inline code
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe("Tex<https://example.com>t `code` after");
      });

      it("should process URL normally when cursor is after inline code", () => {
        settings.disableInCodeBlocks = true;
        settings.nothingSelected = NothingSelected.insertBare;
        const content = "Before `code` text";
        editor = new Editor(content, { line: 0, ch: 15 }); // cursor after inline code
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe("Before `code` t<https://example.com>ext");
      });
    });

    describe("edge cases for inline code", () => {
      it("should handle cursor on opening backtick", () => {
        settings.disableInCodeBlocks = true;
        const content = "Text `code` text";
        editor = new Editor(content, { line: 0, ch: 5 }); // cursor on opening `
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // Should skip - considered inside
      });

      it("should handle cursor on closing backtick", () => {
        settings.disableInCodeBlocks = true;
        const content = "Text `code` text";
        editor = new Editor(content, { line: 0, ch: 10 }); // cursor on closing `
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // Should skip - considered inside
      });

      it("should handle multiple inline code blocks on same line", () => {
        settings.disableInCodeBlocks = true;
        const content = "Use `foo` or `bar` here";
        editor = new Editor(content, { line: 0, ch: 7 }); // cursor inside first inline code
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // No change
      });

      it("should handle escaped backticks", () => {
        settings.disableInCodeBlocks = true;
        settings.nothingSelected = NothingSelected.insertBare;
        const content = "This \\`is not\\` code";
        editor = new Editor(content, { line: 0, ch: 10 }); // cursor between escaped backticks
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe("This \\`is <https://example.com>not\\` code"); // Should process
      });

      it("should handle double backticks for inline code", () => {
        settings.disableInCodeBlocks = true;
        const content = "This is ``code with ` inside`` text";
        editor = new Editor(content, { line: 0, ch: 20 }); // cursor inside double-backtick code
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // No change
      });

      it("should handle unclosed inline code", () => {
        settings.disableInCodeBlocks = true;
        const content = "This is `unclosed code";
        editor = new Editor(content, { line: 0, ch: 15 }); // cursor after unclosed backtick
        
        UrlIntoSelection(editor, "https://example.com", settings);
        expect(editor.getValue()).toBe(content); // Should skip - considered inside unclosed code
      });
    });
  });

  describe("Complex scenarios", () => {
    it("should handle inline code inside fenced code block", () => {
      settings.disableInCodeBlocks = true;
      const content = "```\nThis has `inline` code\n```";
      editor = new Editor(content, { line: 1, ch: 14 }); // cursor inside inline code within fenced block
      
      UrlIntoSelection(editor, "https://example.com", settings);
      expect(editor.getValue()).toBe(content); // No change - in fenced block
    });

    it("should handle code blocks in lists", () => {
      settings.disableInCodeBlocks = true;
      const content = "- Item 1\n  ```\n  code\n  ```\n- Item 2";
      editor = new Editor(content, { line: 2, ch: 4 }); // cursor in indented code block
      
      UrlIntoSelection(editor, "https://example.com", settings);
      expect(editor.getValue()).toBe(content); // No change
    });

    it("should handle mixed content with multiple code blocks", () => {
      settings.disableInCodeBlocks = true;
      const multilineContent = 
`Normal text here
\`\`\`javascript
function test() {
  return true;
}
\`\`\`
More text with \`inline code\` here
And another block:
\`\`\`
raw block
\`\`\`
Final text`;
      
      // Test cursor in normal text
      editor = new Editor(multilineContent, { line: 0, ch: 7 });
      settings.nothingSelected = NothingSelected.insertBare;
      UrlIntoSelection(editor, "https://example.com", settings);
      expect(editor.getValue()).toContain("Normal <https://example.com>text here");
      
      // Reset and test cursor in fenced block
      editor = new Editor(multilineContent, { line: 3, ch: 8 });
      UrlIntoSelection(editor, "https://example.com", settings);
      expect(editor.getLine(3)).toBe("  return true;"); // No change
      
      // Reset and test cursor in inline code
      editor = new Editor(multilineContent, { line: 6, ch: 20 });
      UrlIntoSelection(editor, "https://example.com", settings);
      expect(editor.getLine(6)).toBe("More text with `inline code` here"); // No change
    });

    it("should handle autoSelect mode with code blocks", () => {
      settings.disableInCodeBlocks = true;
      settings.nothingSelected = NothingSelected.autoSelect;
      const content = "```\nword\n```";
      editor = new Editor(content, { line: 1, ch: 2 }); // cursor in "word" inside code block
      
      UrlIntoSelection(editor, "https://example.com", settings);
      expect(editor.getValue()).toBe(content); // No change - should skip even with autoSelect
    });
  });

  describe("Performance considerations", () => {
    it("should efficiently handle large documents with many code blocks", () => {
      settings.disableInCodeBlocks = true;
      const lines = [];
      for (let i = 0; i < 100; i++) {
        lines.push("Normal text line " + i);
        lines.push("```");
        lines.push("Code block " + i);
        lines.push("```");
        lines.push("More text with `inline " + i + "` code");
      }
      const content = lines.join("\n");
      
      // Test cursor in a code block in the middle of document
      // Each block uses 5 lines: normal text, ```, code block, ```, inline text
      // Block n is at line 2 + n*5, so block 40 is at line 2 + 40*5 = 202
      editor = new Editor(content, { line: 202, ch: 5 }); // line 202 = code block 40
      UrlIntoSelection(editor, "https://example.com", settings);
      expect(editor.getLine(202)).toBe("Code block 40"); // No change
    });
  });

  describe("Integration with existing features", () => {
    it("should respect code block detection when inside markdown link parentheses", () => {
      settings.disableInCodeBlocks = true;
      const content = "```\n[link]()\n```";
      editor = new Editor(content, { line: 1, ch: 7 }); // cursor between parentheses in code block
      
      UrlIntoSelection(editor, "https://example.com", settings);
      expect(editor.getValue()).toBe(content); // No change - code block takes precedence
    });

    it("should handle insertInline mode inside code blocks", () => {
      settings.disableInCodeBlocks = true;
      settings.nothingSelected = NothingSelected.insertInline;
      const content = "```\ncode here\n```";
      editor = new Editor(content, { line: 1, ch: 5 });
      
      UrlIntoSelection(editor, "https://example.com", settings);
      expect(editor.getValue()).toBe(content); // No change - should not insert
    });

    it("should handle image embeds inside code blocks", () => {
      settings.disableInCodeBlocks = true;
      settings.listForImgEmbed = "\\.png$";
      const content = "```\nimage\n```";
      editor = new Editor(content, { line: 1, ch: 0 });
      editor.setSelection({ line: 1, ch: 0 }, { line: 1, ch: 5 }); // select "image"
      
      UrlIntoSelection(editor, "https://example.com/test.png", settings);
      expect(editor.getValue()).toBe(content); // No change - code block prevents image embed
    });
  });
});
