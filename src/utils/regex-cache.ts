import { PluginSettings } from "../types";

/**
 * Cache for compiled regexes to avoid recompilation on each function call
 */
class RegexCache {
  private fallbackUrlRegex: RegExp | null = null;
  private fallbackUrlRegexString: string = '';
  private imgEmbedRegexes: RegExp[] = [];
  private imgEmbedRegexString: string = '';

  /**
   * Get the fallback URL regex, compiling it if needed
   */
  getFallbackUrlRegex(regexString: string): RegExp {
    if (this.fallbackUrlRegex === null || this.fallbackUrlRegexString !== regexString) {
      try {
        this.fallbackUrlRegex = new RegExp(regexString);
        this.fallbackUrlRegexString = regexString;
      } catch (error) {
        // Fallback to a simple regex if the user's regex is invalid
        console.warn('Invalid regex pattern in settings, using fallback:', error);
        this.fallbackUrlRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
        this.fallbackUrlRegexString = regexString; // Still cache the string to detect changes
      }
    }
    return this.fallbackUrlRegex;
  }

  /**
   * Get the compiled image embed regexes, compiling them if needed
   */
  getImgEmbedRegexes(listForImgEmbed: string): RegExp[] {
    if (this.imgEmbedRegexString !== listForImgEmbed) {
      this.imgEmbedRegexes = listForImgEmbed
        .split("\n")
        .filter((v) => v.length > 0)
        .map((v) => {
          try {
            return new RegExp(v);
          } catch (error) {
            console.warn('Invalid image embed regex pattern:', v, error);
            return /$.^/; // Regex that never matches anything
          }
        });
      this.imgEmbedRegexString = listForImgEmbed;
    }
    return this.imgEmbedRegexes;
  }

  /**
   * Clear the cache (useful when settings change)
   */
  clear(): void {
    this.fallbackUrlRegex = null;
    this.fallbackUrlRegexString = '';
    this.imgEmbedRegexes = [];
    this.imgEmbedRegexString = '';
  }
}

// Global singleton instance
const regexCache = new RegexCache();

export { regexCache };
