import { describe, it, expect } from 'vitest';
import { 
  testFilePath, 
  isUrl, 
  isWikilink,
  encodeAngleBrackets, 
  needsAngleBrackets, 
  isAlreadyWrapped, 
  processUrl,
  isImgEmbed
} from './url';
import { DEFAULT_SETTINGS } from '../test/test-settings';

describe('URL Utilities', () => {
  describe('testFilePath', () => {
    it('should detect Windows file paths', () => {
      expect(testFilePath('C:\\Users\\Documents\\file.txt')).toBe(true);
      expect(testFilePath('D:\\path\\to\\file.exe')).toBe(true);
    });

    it('should detect Unix file paths', () => {
      expect(testFilePath('/home/user/documents/file.txt')).toBe(true);
      expect(testFilePath('/tmp/file')).toBe(true);
    });

    it('should reject command-like patterns', () => {
      expect(testFilePath('/worldconfigcreate bool colorAccurateWorldmap true')).toBe(false);
      expect(testFilePath('/help command')).toBe(false);
      expect(testFilePath('/command args')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(testFilePath('/foo-bar/baz')).toBe(true); // Should pass, dashes are valid
      expect(testFilePath('/')).toBe(false); // Single slash should fail
      expect(testFilePath('')).toBe(false);
    });
  });

  describe('isWikilink', () => {
    it('should detect basic wikilinks', () => {
      expect(isWikilink('[[Note Title]]')).toBe(true);
      expect(isWikilink('[[10. Links]]')).toBe(true);
    });

    it('should detect wikilinks with headers', () => {
      expect(isWikilink('[[Note Title#Header]]')).toBe(true);
      expect(isWikilink('[[10. Links#Header1]]')).toBe(true);
    });

    it('should handle whitespace in wikilinks', () => {
      expect(isWikilink('  [[Note Title]]  ')).toBe(true);
      expect(isWikilink('[[My Note With Spaces]]')).toBe(true);
    });

    it('should reject invalid wikilink formats', () => {
      expect(isWikilink('[Note Title]')).toBe(false);
      expect(isWikilink('[[Note Title]')).toBe(false);
      expect(isWikilink('[Note Title]]')).toBe(false);
      expect(isWikilink('[[]]')).toBe(false);
      expect(isWikilink('plain text')).toBe(false);
    });
  });

  describe('isUrl', () => {
    it('should detect valid HTTP/HTTPS URLs', () => {
      expect(isUrl('https://example.com', DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl('http://example.com/path', DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl('ftp://files.example.com', DEFAULT_SETTINGS)).toBe(true);
    });

    it('should detect wikilinks as URLs', () => {
      expect(isUrl('[[Note Title]]', DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl('[[10. Links#Header1]]', DEFAULT_SETTINGS)).toBe(true);
    });

    it('should detect mail and other schemes', () => {
      expect(isUrl('mailto:test@example.com', DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl('obsidian://vault/note', DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl('data:text/plain;base64,SGVsbG8=', DEFAULT_SETTINGS)).toBe(true);
    });

    it('should detect file paths as URLs', () => {
      expect(isUrl('C:\\Users\\file.txt', DEFAULT_SETTINGS)).toBe(true);
      expect(isUrl('/home/user/file.txt', DEFAULT_SETTINGS)).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isUrl('', DEFAULT_SETTINGS)).toBe(false);
      expect(isUrl('plain text', DEFAULT_SETTINGS)).toBe(false);
      expect(isUrl('this has spaces', DEFAULT_SETTINGS)).toBe(false);
    });

    it('should use fallback regex when URL constructor fails', () => {
      const customSettings = { ...DEFAULT_SETTINGS, regex: 'example\\.(com|org)' };
      expect(isUrl('example.com', customSettings)).toBe(true);
      expect(isUrl('example.net', customSettings)).toBe(false);
    });
  });

  describe('encodeAngleBrackets', () => {
    it('should encode single angle brackets', () => {
      expect(encodeAngleBrackets('https://example.com/<path>')).toBe('https://example.com/%3Cpath%3E');
    });

    it('should encode multiple angle brackets', () => {
      expect(encodeAngleBrackets('<start>middle<end>')).toBe('%3Cstart%3Emiddle%3Cend%3E');
    });

    it('should handle text without angle brackets', () => {
      expect(encodeAngleBrackets('https://example.com/path')).toBe('https://example.com/path');
    });
  });

  describe('needsAngleBrackets', () => {
    it('should detect URLs with spaces', () => {
      expect(needsAngleBrackets('https://example.com/path with spaces')).toBe(true);
    });

    it('should detect URLs with parentheses', () => {
      expect(needsAngleBrackets('https://example.com/page(1)')).toBe(true);
    });

    it('should not flag normal URLs', () => {
      expect(needsAngleBrackets('https://example.com/path')).toBe(false);
    });
  });

  describe('isAlreadyWrapped', () => {
    it('should detect wrapped URLs', () => {
      expect(isAlreadyWrapped('<https://example.com>')).toBe(true);
    });

    it('should not flag unwrapped URLs', () => {
      expect(isAlreadyWrapped('https://example.com')).toBe(false);
      expect(isAlreadyWrapped('<partial')).toBe(false);
      expect(isAlreadyWrapped('partial>')).toBe(false);
    });
  });

  describe('processUrl', () => {
    it('should convert file paths to file URLs', () => {
      expect(processUrl('C:\\Users\\file.txt')).toBe('file:///C:/Users/file.txt');
      expect(processUrl('/home/user/file.txt')).toBe('file:///home/user/file.txt');
    });

    it('should handle multiple angle brackets correctly (global replace fix)', () => {
      expect(processUrl('https://example.com/<start><middle><end>')).toBe('https://example.com/%3Cstart%3E%3Cmiddle%3E%3Cend%3E');
    });

    it('should wrap URLs with special characters', () => {
      expect(processUrl('https://example.com/path with spaces')).toBe('<https://example.com/path with spaces>');
      expect(processUrl('https://example.com/page(1)')).toBe('<https://example.com/page(1)>');
    });

    it('should not double-wrap already wrapped URLs', () => {
      expect(processUrl('<https://example.com/path with spaces>')).toBe('<https://example.com/path with spaces>');
    });

    it('should encode angle brackets in URLs', () => {
      expect(processUrl('https://example.com/<path>')).toBe('https://example.com/%3Cpath%3E');
    });
  });

  describe('isImgEmbed', () => {
    it('should match image file extensions', () => {
      const settings = { ...DEFAULT_SETTINGS, listForImgEmbed: '\\.(jpg|png|gif)$' };
      expect(isImgEmbed('https://example.com/photo.jpg', settings)).toBe(true);
      expect(isImgEmbed('https://example.com/image.png', settings)).toBe(true);
      expect(isImgEmbed('https://example.com/page.html', settings)).toBe(false);
    });

    it('should handle multiple regex patterns', () => {
      const settings = { ...DEFAULT_SETTINGS, listForImgEmbed: '\\.(jpg|png)$\nyoutube\\.com' };
      expect(isImgEmbed('https://youtube.com/watch?v=123', settings)).toBe(true);
      expect(isImgEmbed('https://example.com/photo.jpg', settings)).toBe(true);
      expect(isImgEmbed('https://vimeo.com/123', settings)).toBe(false);
    });

    it('should handle empty settings', () => {
      const settings = { ...DEFAULT_SETTINGS, listForImgEmbed: '' };
      expect(isImgEmbed('https://example.com/photo.jpg', settings)).toBe(false);
    });
  });
});
