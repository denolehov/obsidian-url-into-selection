import { describe, it, expect, beforeEach, vi } from 'vitest';
import { regexCache } from './regex-cache';

describe('RegexCache', () => {
  beforeEach(() => {
    regexCache.clear();
  });

  describe('getFallbackUrlRegex', () => {
    it('should compile and cache a valid regex', () => {
      const regex1 = regexCache.getFallbackUrlRegex('test\\d+');
      const regex2 = regexCache.getFallbackUrlRegex('test\\d+'); // Same pattern
      
      expect(regex1).toBe(regex2); // Should return the same instance
      expect(regex1.test('test123')).toBe(true);
      expect(regex1.test('test')).toBe(false);
    });

    it('should recompile when pattern changes', () => {
      const regex1 = regexCache.getFallbackUrlRegex('test\\d+');
      const regex2 = regexCache.getFallbackUrlRegex('hello\\w+'); // Different pattern
      
      expect(regex1).not.toBe(regex2); // Should be different instances
      expect(regex2.test('helloworld')).toBe(true);
      expect(regex2.test('test123')).toBe(false);
    });

    it('should handle invalid regex patterns gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const regex = regexCache.getFallbackUrlRegex('[invalid'); // Invalid regex
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid regex pattern'),
        expect.any(Error)
      );
      expect(regex).toBeDefined(); // Should return fallback regex
      
      consoleSpy.mockRestore();
    });
  });

  describe('getImgEmbedRegexes', () => {
    it('should compile and cache multiple regexes', () => {
      const patterns = '\\.(jpg|png)$\nyoutube\\.com';
      const regexes1 = regexCache.getImgEmbedRegexes(patterns);
      const regexes2 = regexCache.getImgEmbedRegexes(patterns); // Same patterns
      
      expect(regexes1).toBe(regexes2); // Should return the same array instance
      expect(regexes1).toHaveLength(2);
      expect(regexes1[0].test('photo.jpg')).toBe(true);
      expect(regexes1[1].test('youtube.com/watch')).toBe(true);
    });

    it('should filter out empty lines', () => {
      const patterns = '\\.(jpg|png)$\n\n\nyoutube\\.com\n';
      const regexes = regexCache.getImgEmbedRegexes(patterns);
      
      expect(regexes).toHaveLength(2); // Should ignore empty lines
    });

    it('should handle invalid regex patterns in the list', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const patterns = '\\.(jpg|png)$\n[invalid\nyoutube\\.com';
      const regexes = regexCache.getImgEmbedRegexes(patterns);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid image embed regex pattern'),
        '[invalid',
        expect.any(Error)
      );
      expect(regexes).toHaveLength(3); // Should include non-matching fallback
      expect(regexes[0].test('photo.jpg')).toBe(true);
      expect(regexes[1].test('anything')).toBe(false); // Fallback regex never matches
      expect(regexes[2].test('youtube.com/watch')).toBe(true);
      
      consoleSpy.mockRestore();
    });

    it('should recompile when patterns change', () => {
      const patterns1 = '\\.(jpg|png)$';
      const patterns2 = 'youtube\\.com';
      
      const regexes1 = regexCache.getImgEmbedRegexes(patterns1);
      const regexes2 = regexCache.getImgEmbedRegexes(patterns2);
      
      expect(regexes1).not.toBe(regexes2); // Should be different arrays
      expect(regexes1).toHaveLength(1);
      expect(regexes2).toHaveLength(1);
    });
  });

  describe('clear', () => {
    it('should clear all cached regexes', () => {
      // Cache some regexes
      const urlRegex1 = regexCache.getFallbackUrlRegex('test\\d+');
      const imgRegexes1 = regexCache.getImgEmbedRegexes('\\.(jpg)$');
      
      regexCache.clear();
      
      // Should recompile after clear
      const urlRegex2 = regexCache.getFallbackUrlRegex('test\\d+');
      const imgRegexes2 = regexCache.getImgEmbedRegexes('\\.(jpg)$');
      
      expect(urlRegex1).not.toBe(urlRegex2); // Different instances
      expect(imgRegexes1).not.toBe(imgRegexes2); // Different arrays
    });
  });
});
