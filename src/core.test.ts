import { describe, it, expect, beforeEach } from 'vitest';
import { Editor } from './test/obsidian-mock';
import UrlIntoSelection from './core';
import { NothingSelected, PluginSettings } from './types';
import { DEFAULT_SETTINGS } from './test/test-settings';

// Expose internal functions for testing by importing them differently
// We'll need to restructure the core module to export these functions

describe('URL into Selection - Markdown Link Context', () => {
  let editor: Editor;
  let settings: PluginSettings;

  beforeEach(() => {
    settings = {
      ...DEFAULT_SETTINGS,
      nothingSelected: NothingSelected.insertBare
    };
  });

  describe('when pasting URL inside markdown link parentheses', () => {
    it('should NOT wrap URL with angle brackets when cursor is between link parentheses', () => {
      // Setup: cursor positioned between the parentheses of [Title]()
      editor = new Editor('[Title]()', { line: 0, ch: 8 });
      const clipboardText = 'https://example.com';
      
      // Act
      UrlIntoSelection(editor, clipboardText, settings);
      
      // Assert: URL should be pasted without angle brackets
      expect(editor.getValue()).toBe('[Title](https://example.com)');
    });

    it('should NOT wrap URL with angle brackets when cursor is inside partially filled link', () => {
      // Setup: cursor positioned after existing partial URL
      editor = new Editor('[Title](https://)', { line: 0, ch: 16 });
      const clipboardText = 'example.com';
      
      // Act
      UrlIntoSelection(editor, clipboardText, settings);
      
      // Assert: URL should be pasted without angle brackets
      expect(editor.getValue()).toBe('[Title](https://example.com)');
    });

    it('should NOT wrap URL with angle brackets when replacing selected text inside link parentheses', () => {
      // Setup: select "old-url" inside [Title](old-url)
      editor = new Editor('[Title](old-url)', { line: 0, ch: 8 });
      editor.setSelection({ line: 0, ch: 8 }, { line: 0, ch: 15 });
      const clipboardText = 'https://example.com';
      
      // Act
      UrlIntoSelection(editor, clipboardText, settings);
      
      // Assert: URL should replace selection without angle brackets
      expect(editor.getValue()).toBe('[Title](https://example.com)');
    });

    it('should NOT wrap URL when cursor is between image link parentheses ![alt]()', () => {
      // Setup: cursor positioned between the parentheses of ![alt]()
      editor = new Editor('![alt]()', { line: 0, ch: 7 });
      const clipboardText = 'https://example.com/image.png';
      
      // Act
      UrlIntoSelection(editor, clipboardText, settings);
      
      // Assert: URL should be pasted without angle brackets
      expect(editor.getValue()).toBe('![alt](https://example.com/image.png)');
    });
  });

  describe('when pasting URL outside markdown link context', () => {
    it('should wrap URL with angle brackets when cursor is on empty line', () => {
      // Setup: empty editor
      editor = new Editor('', { line: 0, ch: 0 });
      const clipboardText = 'https://example.com';
      
      // Act
      UrlIntoSelection(editor, clipboardText, settings);
      
      // Assert: URL should be wrapped with angle brackets
      expect(editor.getValue()).toBe('<https://example.com>');
    });

    it('should wrap URL with angle brackets when cursor is in regular text', () => {
      // Setup: cursor in middle of regular text
      editor = new Editor('Check this out: ', { line: 0, ch: 16 });
      const clipboardText = 'https://example.com';
      
      // Act
      UrlIntoSelection(editor, clipboardText, settings);
      
      // Assert: URL should be wrapped with angle brackets
      expect(editor.getValue()).toBe('Check this out: <https://example.com>');
    });

    it('should wrap URL with angle brackets when not inside link parentheses', () => {
      // Setup: cursor before the link syntax
      editor = new Editor('[Title](url) some text', { line: 0, ch: 0 });
      const clipboardText = 'https://example.com';
      
      // Act
      UrlIntoSelection(editor, clipboardText, settings);
      
      // Assert: URL should be wrapped with angle brackets
      expect(editor.getValue()).toBe('<https://example.com>[Title](url) some text');
    });

    it('should wrap URL when cursor is in square brackets of markdown link', () => {
      // Setup: cursor inside [Title]
      editor = new Editor('[Title]()', { line: 0, ch: 3 });
      const clipboardText = 'https://example.com';
      
      // Act
      UrlIntoSelection(editor, clipboardText, settings);
      
      // Assert: URL should be wrapped since we're not in the parentheses
      expect(editor.getValue()).toBe('[Ti<https://example.com>tle]()');
    });
  });

  describe('edge cases', () => {
    it('should handle nested parentheses correctly', () => {
      // Setup: markdown link with parentheses in URL
      editor = new Editor('[Title](https://example.com/page(1))', { line: 0, ch: 8 });
      editor.setSelection({ line: 0, ch: 8 }, { line: 0, ch: 35 });
      const clipboardText = 'https://example.com/page(2)';
      
      // Act
      UrlIntoSelection(editor, clipboardText, settings);
      
      // Assert: Should replace without adding angle brackets
      expect(editor.getValue()).toBe('[Title](https://example.com/page(2))');
    });

    it('should handle multiple links on same line', () => {
      // Setup: cursor in second link's parentheses
      editor = new Editor('[First](url1) and [Second]()', { line: 0, ch: 27 });
      const clipboardText = 'https://example.com';
      
      // Act
      UrlIntoSelection(editor, clipboardText, settings);
      
      // Assert: Should not wrap in angle brackets
      expect(editor.getValue()).toBe('[First](url1) and [Second](https://example.com)');
    });

    it('should handle multiline content correctly', () => {
      // Setup: link syntax across multiple lines (though unusual)
      editor = new Editor('Some text\n[Title]()\nMore text', { line: 1, ch: 8 });
      const clipboardText = 'https://example.com';
      
      // Act
      UrlIntoSelection(editor, clipboardText, settings);
      
      // Assert: Should not wrap in angle brackets
      expect(editor.getValue()).toBe('Some text\n[Title](https://example.com)\nMore text');
    });
  });
});

describe('URL Detection Logic (isUrl function)', () => {
  let settings: PluginSettings;

  beforeEach(() => {
    settings = { ...DEFAULT_SETTINGS };
  });

  describe('Valid URLs', () => {
    it('should detect standard HTTP URLs', () => {
      const editor = new Editor('text', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
      
      UrlIntoSelection(editor, 'https://example.com', settings);
      expect(editor.getValue()).toBe('[text](https://example.com)');
    });

    it('should detect HTTPS URLs with paths and query parameters', () => {
      const editor = new Editor('test', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
      
      UrlIntoSelection(editor, 'https://example.com/path?query=value&other=123', settings);
      expect(editor.getValue()).toBe('[test](https://example.com/path?query=value&other=123)');
    });

    it('should detect FTP URLs', () => {
      const editor = new Editor('ftp link', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 8 });
      
      UrlIntoSelection(editor, 'ftp://files.example.com/file.txt', settings);
      expect(editor.getValue()).toBe('[ftp link](ftp://files.example.com/file.txt)');
    });
  });

  describe('File Paths', () => {
    it('should detect Windows file paths', () => {
      const editor = new Editor('file', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
      
      UrlIntoSelection(editor, 'C:\\Users\\Documents\\file.txt', settings);
      expect(editor.getValue()).toBe('[file](file:///C:/Users/Documents/file.txt)');
    });

    it('should detect Unix file paths', () => {
      const editor = new Editor('document', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 8 });
      
      UrlIntoSelection(editor, '/home/user/documents/file.txt', settings);
      expect(editor.getValue()).toBe('[document](file:///home/user/documents/file.txt)');
    });
  });

  describe('Invalid URLs', () => {
    it('should reject plain text without URL format', () => {
      const editor = new Editor('', { line: 0, ch: 0 });
      
      UrlIntoSelection(editor, 'just plain text', settings);
      expect(editor.getValue()).toBe(''); // Should not process
    });

    it('should reject empty strings', () => {
      const editor = new Editor('', { line: 0, ch: 0 });
      
      UrlIntoSelection(editor, '', settings);
      expect(editor.getValue()).toBe('');
    });

    // Issue GH#58: Commands should not be treated as URLs
    it('should reject command-like text starting with slash and word characters', () => {
      const editor = new Editor('', { line: 0, ch: 0 });
      
      UrlIntoSelection(editor, '/worldconfigcreate bool colorAccurateWorldmap true', settings);
      expect(editor.getValue()).toBe(''); // Should not process
    });

    it('should reject other command patterns', () => {
      const editor = new Editor('', { line: 0, ch: 0 });
      
      UrlIntoSelection(editor, '/help command', settings);
      expect(editor.getValue()).toBe(''); // Should not process
    });

    // Test with selected text to simulate what user reported in issue #58
    it('should not process command when pasting with selected text', () => {
      const editor = new Editor('some text', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 9 });
      
      UrlIntoSelection(editor, '/worldconfigcreate bool colorAccurateWorldmap true', settings);
      expect(editor.getValue()).toBe('some text'); // Should not change the text
    });

    it('should reject text with spaces (unencoded URLs)', () => {
      const editor = new Editor('', { line: 0, ch: 0 });
      
      UrlIntoSelection(editor, 'this has spaces in it', settings);
      expect(editor.getValue()).toBe(''); // Should not process
    });

    it('should reject configuration-like text', () => {
      const editor = new Editor('', { line: 0, ch: 0 });
      
      UrlIntoSelection(editor, 'config.setting = true', settings);
      expect(editor.getValue()).toBe(''); // Should not process
    });
  });

  describe('Custom Regex Fallback', () => {
    it('should use custom regex when URL constructor fails', () => {
      const customSettings = {
        ...DEFAULT_SETTINGS,
        regex: 'example\\.(com|org)'
      };
      const editor = new Editor('link', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
      
      UrlIntoSelection(editor, 'example.com', customSettings);
      expect(editor.getValue()).toBe('[link](example.com)');
    });
  });
});

describe('NothingSelected Behaviors', () => {
  let editor: Editor;

  describe('doNothing mode', () => {
    it('should skip processing when nothing is selected', () => {
      const settings = { ...DEFAULT_SETTINGS, nothingSelected: NothingSelected.doNothing };
      editor = new Editor('some text', { line: 0, ch: 4 });
      
      UrlIntoSelection(editor, 'https://example.com', settings);
      expect(editor.getValue()).toBe('some text'); // No change
    });
  });

  describe('autoSelect mode', () => {
    it('should auto-select word at cursor position', () => {
      const settings = { ...DEFAULT_SETTINGS, nothingSelected: NothingSelected.autoSelect };
      editor = new Editor('word here', { line: 0, ch: 2 }); // cursor in 'word'
      
      UrlIntoSelection(editor, 'https://example.com', settings);
      expect(editor.getValue()).toBe('[word](https://example.com) here');
    });

    it('should auto-select URL at cursor position', () => {
      const settings = { ...DEFAULT_SETTINGS, nothingSelected: NothingSelected.autoSelect };
      editor = new Editor('Check https://old.com out', { line: 0, ch: 15 }); // cursor in URL
      
      UrlIntoSelection(editor, 'New Link Text', settings);
      expect(editor.getValue()).toBe('Check [New Link Text](https://old.com) out');
    });
  });

  describe('insertInline mode', () => {
    it('should create [](url) format and position cursor between brackets', () => {
      const settings = { ...DEFAULT_SETTINGS, nothingSelected: NothingSelected.insertInline };
      editor = new Editor('', { line: 0, ch: 0 });
      
      UrlIntoSelection(editor, 'https://example.com', settings);
      expect(editor.getValue()).toBe('[](https://example.com)');
      expect(editor.getCursor()).toEqual({ line: 0, ch: 1 }); // Cursor between brackets
    });
  });

  describe('insertBare mode', () => {
    it('should create <url> format', () => {
      const settings = { ...DEFAULT_SETTINGS, nothingSelected: NothingSelected.insertBare };
      editor = new Editor('', { line: 0, ch: 0 });
      
      UrlIntoSelection(editor, 'https://example.com', settings);
      expect(editor.getValue()).toBe('<https://example.com>');
    });
  });
});

describe('Image Embed Detection (isImgEmbed function)', () => {
  let editor: Editor;

  describe('Image file extensions', () => {
    it('should detect common image extensions', () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        listForImgEmbed: '\\.(jpg|jpeg|png|gif|bmp|svg|webp)$'
      };
      editor = new Editor('image', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      
      UrlIntoSelection(editor, 'https://example.com/photo.jpg', settings);
      expect(editor.getValue()).toBe('![image](https://example.com/photo.jpg)');
    });
  });

  describe('Video/YouTube patterns', () => {
    it('should detect YouTube URLs', () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        listForImgEmbed: 'youtube\\.com|youtu\\.be'
      };
      editor = new Editor('video', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      
      UrlIntoSelection(editor, 'https://youtube.com/watch?v=abc123', settings);
      expect(editor.getValue()).toBe('![video](https://youtube.com/watch?v=abc123)');
    });
  });

  describe('Multiple regex patterns', () => {
    it('should handle multiple rules separated by newlines', () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        listForImgEmbed: '\\.(jpg|png)$\nyoutube\\.com\nvimeo\\.com'
      };
      editor = new Editor('media', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      
      UrlIntoSelection(editor, 'https://vimeo.com/123456', settings);
      expect(editor.getValue()).toBe('![media](https://vimeo.com/123456)');
    });
  });
});

describe('File Path Processing (processUrl function)', () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor('link', { line: 0, ch: 0 });
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
  });

  describe('URLs with special characters', () => {
    it('should wrap URLs with spaces in angle brackets', () => {
      UrlIntoSelection(editor, 'https://example.com/path with spaces', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[link](<https://example.com/path with spaces>)');
    });

    it('should wrap URLs with parentheses in angle brackets', () => {
      UrlIntoSelection(editor, 'https://example.com/page(1)', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[link](<https://example.com/page(1)>)');
    });

    it('should encode angle brackets in URLs', () => {
      UrlIntoSelection(editor, 'https://example.com/<path>', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[link](https://example.com/%3Cpath%3E)');
    });
  });

  describe('File URL conversion', () => {
    it('should convert Windows paths to file URLs', () => {
      UrlIntoSelection(editor, 'C:\\path\\file.txt', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[link](file:///C:/path/file.txt)');
    });

    it('should convert Unix paths to file URLs', () => {
      UrlIntoSelection(editor, '/home/user/file.txt', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[link](file:///home/user/file.txt)');
    });
  });
});

describe('Selection Whitespace Preservation', () => {
  it('should preserve intentional leading and trailing spaces in link text', () => {
    const editor = new Editor('  spaced text  ', { line: 0, ch: 0 });
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 15 }); // Select including spaces
    
    UrlIntoSelection(editor, 'https://example.com', DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe('[  spaced text  ](https://example.com)');
  });

  it('should handle tabs and other whitespace characters in selection', () => {
    const editor = new Editor('\ttext ', { line: 0, ch: 0 });
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 6 }); // Select tab and trailing space
    
    UrlIntoSelection(editor, 'https://example.com', DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe('[\ttext ](https://example.com)');
  });
});

describe('Bidirectional URL/Text Swapping', () => {
  describe('Selected text is URL, clipboard contains title', () => {
    it('should use clipboard text as title and selected URL as link', () => {
      const editor = new Editor('https://example.com', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 19 }); // Select full URL
      
      UrlIntoSelection(editor, 'Example Website', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[Example Website](https://example.com)');
    });

    it('should trim whitespace from clipboard text', () => {
      const editor = new Editor('https://example.com', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 19 }); // Select full URL
      
      UrlIntoSelection(editor, '  Trimmed Title  ', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[Trimmed Title](https://example.com)');
    });
  });

  describe('Clipboard is URL, selected text is title', () => {
    it('should use selected text as title and clipboard URL as link', () => {
      const editor = new Editor('My Website', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 10 });
      
      UrlIntoSelection(editor, 'https://example.com', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[My Website](https://example.com)');
    });
  });

  describe('Neither is URL', () => {
    it('should not process when neither clipboard nor selection is URL', () => {
      const editor = new Editor('plain text', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 10 });
      
      UrlIntoSelection(editor, 'more plain text', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('plain text'); // No change
    });
  });
});

describe('Quote Stripping for File Paths', () => {
  describe('Windows file paths with quotes', () => {
    it('should strip double quotes from Windows file paths', () => {
      const editor = new Editor('some text', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 9 });
      
      // Windows "Copy as path" format with double quotes
      UrlIntoSelection(editor, '"V:\\2022 Trading Calendar.xlsx"', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[some text](file:///V:/2022%20Trading%20Calendar.xlsx)');
    });

    it('should strip double quotes from Windows file paths with spaces', () => {
      const editor = new Editor('document', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 8 });
      
      UrlIntoSelection(editor, '"C:\\Program Files\\My App\\file.txt"', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[document](file:///C:/Program%20Files/My%20App/file.txt)');
    });

    it('should handle double quotes around regular Windows paths without spaces', () => {
      const editor = new Editor('file', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
      
      UrlIntoSelection(editor, '"C:\\Users\\Documents\\file.txt"', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[file](file:///C:/Users/Documents/file.txt)');
    });
  });

  describe('macOS file paths with quotes', () => {
    it('should strip single quotes from macOS file paths', () => {
      const editor = new Editor('document', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 8 });
      
      // macOS Sequoia "Copy as Pathname" format with single quotes
      UrlIntoSelection(editor, "'/Users/name/Documents/My File.txt'", DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[document](file:///Users/name/Documents/My%20File.txt)');
    });

    it('should handle single quotes around Unix paths without spaces', () => {
      const editor = new Editor('file', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
      
      UrlIntoSelection(editor, "'/home/user/documents/file.txt'", DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[file](file:///home/user/documents/file.txt)');
    });
  });

  describe('URLs with quotes', () => {
    it('should strip double quotes from URLs', () => {
      const editor = new Editor('link', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
      
      UrlIntoSelection(editor, '"https://example.com/page with spaces"', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[link](<https://example.com/page with spaces>)');
    });

    it('should strip single quotes from URLs', () => {
      const editor = new Editor('website', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 7 });
      
      UrlIntoSelection(editor, "'https://example.com/path'", DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[website](https://example.com/path)');
    });
  });

  describe('Edge cases for quote stripping', () => {
    it('should not strip quotes if only opening quote exists', () => {
      const editor = new Editor('text', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
      
      UrlIntoSelection(editor, '"https://example.com', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[text]("https://example.com)');
    });

    it('should not strip quotes if only closing quote exists', () => {
      const editor = new Editor('text', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
      
      UrlIntoSelection(editor, 'https://example.com"', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[text](https://example.com")');
    });

    it('should not strip mismatched quotes', () => {
      const editor = new Editor('text', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
      
      UrlIntoSelection(editor, '"https://example.com\'', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[text]("https://example.com\')');
    });

    it('should handle empty string after quote stripping', () => {
      const editor = new Editor('text', { line: 0, ch: 0 });
      const originalValue = editor.getValue();
      
      UrlIntoSelection(editor, '""', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe(originalValue); // No change, empty string is not a valid URL
    });

    it('should handle single character strings', () => {
      const editor = new Editor('text', { line: 0, ch: 0 });
      const originalValue = editor.getValue();
      
      UrlIntoSelection(editor, '"', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe(originalValue); // No change, too short
    });

    it('should handle strings that are only quotes', () => {
      const editor = new Editor('text', { line: 0, ch: 0 });
      const originalValue = editor.getValue();
      
      UrlIntoSelection(editor, "''", DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe(originalValue); // No change, empty after stripping
    });

    it('should preserve quotes that are part of the actual URL/path', () => {
      const editor = new Editor('query', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
      
      // URL with quotes in the middle (not surrounding)
      UrlIntoSelection(editor, 'https://example.com/search?q="quoted text"&other=value', DEFAULT_SETTINGS);
      expect(editor.getValue()).toBe('[query](<https://example.com/search?q="quoted text"&other=value>)');
    });
  });
});

describe('Obsidian Wikilink Support', () => {
  let editor: Editor;
  let settings: PluginSettings;

  beforeEach(() => {
    editor = new Editor('', { line: 0, ch: 0 });
    settings = { ...DEFAULT_SETTINGS };
  });

  describe('when pasting wikilinks with selected text', () => {
    it('should preserve selected text as alias for basic wikilink', () => {
      editor = new Editor('Click Link Here', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 15 });
      const clipboardText = '[[10. Links]]';
      
      UrlIntoSelection(editor, clipboardText, settings);
      expect(editor.getValue()).toBe('[[10. Links|Click Link Here]]');
    });

    it('should preserve selected text as alias for wikilink with header', () => {
      editor = new Editor('Click Link Here', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 15 });
      const clipboardText = '[[10. Links#Header1]]';
      
      UrlIntoSelection(editor, clipboardText, settings);
      expect(editor.getValue()).toBe('[[10. Links#Header1|Click Link Here]]');
    });

    it('should handle wikilinks with spaces and special characters', () => {
      editor = new Editor('Custom Text', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 11 });
      const clipboardText = '[[My Note With Spaces#Section 1]]';
      
      UrlIntoSelection(editor, clipboardText, settings);
      expect(editor.getValue()).toBe('[[My Note With Spaces#Section 1|Custom Text]]');
    });

    it('should insert bare wikilink when no text is selected and setting is insertBare', () => {
      editor = new Editor('', { line: 0, ch: 0 });
      settings.nothingSelected = NothingSelected.insertBare;
      const clipboardText = '[[10. Links#Header1]]';
      
      UrlIntoSelection(editor, clipboardText, settings);
      expect(editor.getValue()).toBe('[[10. Links#Header1]]');
    });
  });

  describe('when selected text is wikilink and clipboard has regular text', () => {
    it('should use clipboard text as alias for selected wikilink', () => {
      editor = new Editor('[[10. Links#Header1]]', { line: 0, ch: 0 });
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 21 });
      const clipboardText = 'Click Link Here';
      
      UrlIntoSelection(editor, clipboardText, settings);
      expect(editor.getValue()).toBe('[[10. Links#Header1|Click Link Here]]');
    });
  });
});

describe('Clipboard Event Handling', () => {
  it('should handle string input', () => {
    const editor = new Editor('text', { line: 0, ch: 0 });
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
    
    UrlIntoSelection(editor, 'https://example.com', DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe('[text](https://example.com)');
  });

  it('should handle undefined clipboardData gracefully', () => {
    const editor = new Editor('text', { line: 0, ch: 0 });
    const originalValue = editor.getValue();
    
    const mockClipboardEvent = {
      clipboardData: undefined
    } as unknown as ClipboardEvent;
    
    UrlIntoSelection(editor, mockClipboardEvent, DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe(originalValue); // No change
  });

  it('should extract text from ClipboardEvent', () => {
    const editor = new Editor('text', { line: 0, ch: 0 });
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
    
    const mockClipboardEvent = {
      clipboardData: {
        getData: (type: string) => type === 'text' ? 'https://example.com' : ''
      },
      preventDefault: () => {}
    } as unknown as ClipboardEvent;
    
    UrlIntoSelection(editor, mockClipboardEvent, DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe('[text](https://example.com)');
  });

  it('should handle null clipboardData gracefully', () => {
    const editor = new Editor('text', { line: 0, ch: 0 });
    const originalValue = editor.getValue();
    
    const mockClipboardEvent = {
      clipboardData: null
    } as unknown as ClipboardEvent;
    
    UrlIntoSelection(editor, mockClipboardEvent, DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe(originalValue); // No change
  });

  it('should trim clipboard text content', () => {
    const editor = new Editor('text', { line: 0, ch: 0 });
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
    
    const mockClipboardEvent = {
      clipboardData: {
        getData: () => '  https://example.com  '
      },
      preventDefault: () => {}
    } as unknown as ClipboardEvent;
    
    UrlIntoSelection(editor, mockClipboardEvent, DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe('[text](https://example.com)');
  });

  it('should strip quotes from clipboard event data', () => {
    const editor = new Editor('text', { line: 0, ch: 0 });
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 4 });
    
    const mockClipboardEvent = {
      clipboardData: {
        getData: () => '"https://example.com"'
      },
      preventDefault: () => {}
    } as unknown as ClipboardEvent;
    
    UrlIntoSelection(editor, mockClipboardEvent, DEFAULT_SETTINGS);
    expect(editor.getValue()).toBe('[text](https://example.com)');
  });
});
