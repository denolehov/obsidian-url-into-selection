import { describe, it, expect, beforeEach } from 'vitest';
import { Editor } from './test/obsidian-mock';
import UrlIntoSelection from './core';
import { NothingSelected, PluginSettings } from './types';
import { DEFAULT_SETTINGS } from './test/test-settings';

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
