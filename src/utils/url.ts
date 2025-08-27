import fileUrl from "file-url";
import { PluginSettings } from "../types";
import { regexCache } from "./regex-cache";

// https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch08s18.html
const win32Path = /^[a-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/i;
const unixPath = /^(?:\/[^/]+)+\/?$/i;

/**
 * Test if a string represents a valid file path
 */
export function testFilePath(url: string): boolean {
  // Don't treat text as file path if it starts with / followed by a word and then a space
  // This catches command patterns like "/command args" or "/worldconfigcreate bool colorAccurateWorldmap true"
  if (/^\/\w+\s/.test(url)) return false;

  return win32Path.test(url) || unixPath.test(url);
}

/**
 * Check if text is an Obsidian wikilink format [[...]]
 */
export function isWikilink(text: string): boolean {
  return /^\[\[.+\]\]$/.test(text.trim());
}

// Valid URL schemes that we should consider as legitimate URLs
const VALID_URL_SCHEMES = new Set([
  "http",
  "https",
  "ftp",
  "ftps",
  "file",
  "mailto",
  "tel",
  "sms",
  "data",
  "blob",
  "obsidian",
  "zotero",
  "notion",
  "slack",
  "discord",
  "teams",
  "ssh",
  "git",
  "svn",
  "ldap",
  "ldaps",
  "ws",
  "wss",
  "magnet",
  "x-devonthink-item",
]);

/**
 * Check if text is a valid URL
 */
export function isUrl(text: string, settings: PluginSettings): boolean {
  if (text === "") return false;

  // Check for Obsidian wikilink format [[...]]
  if (isWikilink(text)) return true;

  try {
    // throw TypeError: Invalid URL if not valid
    const url = new URL(text);
    const protocol = url.protocol.slice(0, -1); // Remove trailing ':'

    // Handle Windows drive letters (like C:, D:) - treat as file paths
    if (/^[a-z]$/i.test(protocol)) {
      return testFilePath(text);
    }

    // Only accept URLs with recognized schemes to avoid false positives
    // like "font-style: italic" being parsed as font-style://italic
    return VALID_URL_SCHEMES.has(protocol);
  } catch (error) {
    // settings.regex: fallback test allows url without protocol (http,file...)
    return (
      testFilePath(text) ||
      regexCache.getFallbackUrlRegex(settings.regex).test(text)
    );
  }
}

/**
 * Encode angle brackets in URLs to prevent Markdown conflicts
 */
export function encodeAngleBrackets(text: string): string {
  return text.replace(/</g, "%3C").replace(/>/g, "%3E");
}

/**
 * Check if a URL needs angle bracket wrapping due to special characters
 */
export function needsAngleBrackets(text: string): boolean {
  return /[\(\) ]/.test(text);
}

/**
 * Check if text is already wrapped in angle brackets
 */
export function isAlreadyWrapped(text: string): boolean {
  return /^<.*>$/.test(text);
}

/**
 * Process file URL, handle special characters, and wrap if needed
 */
export function processUrl(src: string): string {
  let output;
  if (testFilePath(src)) {
    output = fileUrl(src, { resolve: false });
  } else {
    output = src;
  }

  // Check if already wrapped before doing any encoding
  const alreadyWrapped = isAlreadyWrapped(output);

  // If already wrapped, return as-is
  if (alreadyWrapped) {
    return output;
  }

  // Encode angle brackets to prevent conflicts
  if (/[<>]/.test(output)) {
    output = encodeAngleBrackets(output);
  }

  // Wrap in angle brackets if contains special chars
  return needsAngleBrackets(output) ? `<${output}>` : output;
}

/**
 * Check if URL matches image embed patterns
 */
export function isImgEmbed(text: string, settings: PluginSettings): boolean {
  const rules = regexCache.getImgEmbedRegexes(settings.listForImgEmbed);
  for (const reg of rules) {
    if (reg.test(text)) return true;
  }
  return false;
}
