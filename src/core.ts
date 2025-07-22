import assertNever from "assert-never";
import { NothingSelected, PluginSettings } from "./types";
import fileUrl from "file-url";
import { Editor, EditorPosition, EditorRange } from "obsidian";

// https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch08s18.html
const win32Path = /^[a-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/i;
const unixPath = /^(?:\/[^/]+)+\/?$/i;
const testFilePath = (url: string) => win32Path.test(url) || unixPath.test(url);

/**
 * @param editor Obsidian Editor Instance
 * @param cbString text on clipboard
 * @param settings plugin settings
 */
export default function UrlIntoSelection(editor: Editor, cbString: string, settings: PluginSettings): void;
/**
 * @param editor Obsidian Editor Instance
 * @param cbEvent clipboard event
 * @param settings plugin settings
 */
export default function UrlIntoSelection(editor: Editor, cbEvent: ClipboardEvent, settings: PluginSettings): void;
export default function UrlIntoSelection(editor: Editor, cb: string | ClipboardEvent, settings: PluginSettings): void {
  // skip all if nothing should be done
  if (!editor.somethingSelected() && settings.nothingSelected === NothingSelected.doNothing)
    return;

  if (typeof cb !== "string" && cb.clipboardData === null) {
    console.error("empty clipboardData in ClipboardEvent");
    return;
  }

  const clipboardText = getCbText(cb);
  if (clipboardText === null) return;

  const { selectedText, replaceRange } = getSelnRange(editor, settings);
  const cursorOrRange = replaceRange || { from: editor.getCursor(), to: editor.getCursor() };
  const isInMarkdownLink = checkIfInMarkdownLink(editor, cursorOrRange);
  const replaceText = getReplaceText(clipboardText, selectedText, settings, isInMarkdownLink);
  if (replaceText === null) return;

  // apply changes
  if (typeof cb !== "string") cb.preventDefault(); // prevent default paste behavior
  replace(editor, replaceText, replaceRange);

  // if nothing is selected and the nothing selected behavior is to insert [](url) place the cursor between the square brackets
  if ((selectedText === "") && settings.nothingSelected === NothingSelected.insertInline) {
    editor.setCursor({ ch: replaceRange.from.ch + 1, line: replaceRange.from.line });
  }
}

function getSelnRange(editor: Editor, settings: PluginSettings) {
  let selectedText: string;
  let replaceRange: EditorRange | null;

  if (editor.somethingSelected()) {
    selectedText = editor.getSelection().trim();
    replaceRange = null;
  } else {
    switch (settings.nothingSelected) {
      case NothingSelected.autoSelect:
        replaceRange = getWordBoundaries(editor, settings);
        selectedText = editor.getRange(replaceRange.from, replaceRange.to);
        break;
      case NothingSelected.insertInline:
      case NothingSelected.insertBare:
        replaceRange = getCursor(editor);
        selectedText = "";
        break;
      case NothingSelected.doNothing:
        throw new Error("should be skipped");
      default:
        assertNever(settings.nothingSelected);
    }
  }
  return { selectedText, replaceRange };
}

function isUrl(text: string, settings: PluginSettings): boolean {
  if (text === "") return false;
  try {
    // throw TypeError: Invalid URL if not valid
    new URL(text);
    return true;
  } catch (error) {
    // settings.regex: fallback test allows url without protocol (http,file...)
    return testFilePath(text) || new RegExp(settings.regex).test(text);
  }
}

function isImgEmbed(text: string, settings: PluginSettings): boolean {
  const rules = settings.listForImgEmbed
    .split("\n")
    .filter((v) => v.length > 0)
    .map((v) => new RegExp(v));
  for (const reg of rules) {
    if (reg.test(text)) return true;
  }
  return false;
}

/**
 * Validate that either the text on the clipboard or the selected text is a link, and if so return the link as
 * a markdown link with the selected text as the link's text, or, if the value on the clipboard is not a link
 * but the selected text is, the value of the clipboard as the link's text.
 * If the link matches one of the image url regular expressions return a markdown image link.
 * @param clipboardText text on the clipboard.
 * @param selectedText highlighted text
 * @param settings plugin settings
 * @param isInMarkdownLink whether the cursor is inside markdown link parentheses
 * @returns a mardown link or image link if the clipboard or selction value is a valid link, else null.
 */
function getReplaceText(clipboardText: string, selectedText: string, settings: PluginSettings, isInMarkdownLink: boolean): string | null {

  let linktext: string;
  let url: string;

  if (isUrl(clipboardText, settings)) {
    linktext = selectedText;
    url = clipboardText;
  } else if (isUrl(selectedText, settings)) {
    linktext = clipboardText;
    url = selectedText;
  } else return null; // if neither of two is an URL, the following code would be skipped.

  const imgEmbedMark = isImgEmbed(clipboardText, settings) ? "!" : "";

  // If we're inside markdown link parentheses, just return the URL without any wrapping
  if (isInMarkdownLink) {
    // Process URL but skip the angle bracket wrapping
    if (testFilePath(url)) {
      return fileUrl(url, { resolve: false });
    }
    return url;
  }

  url = processUrl(url);

  if (selectedText === "" && settings.nothingSelected === NothingSelected.insertBare) {
    return `<${url}>`;
  } else {
    return imgEmbedMark + `[${linktext}](${url})`;
  }
}

/** Process file url, special characters, etc */
function processUrl(src: string): string {
  let output;
  if (testFilePath(src)) {
    output = fileUrl(src, { resolve: false });
  } else {
    output = src;
  }

  if (/[<>]/.test(output))
    output = output.replace("<", "%3C").replace(">", "%3E");

  return /[\(\) ]/.test(output) ? `<${output}>` : output;
}

function getCbText(cb: string | ClipboardEvent): string | null {
  let clipboardText: string;

  if (typeof cb === "string") {
    clipboardText = cb;
  } else {
    if (cb.clipboardData === null) {
      console.error("empty clipboardData in ClipboardEvent");
      return null;
    } else {
      clipboardText = cb.clipboardData.getData("text");
    }
  }
  return clipboardText.trim();
}

function getWordBoundaries(editor: Editor, settings: PluginSettings): EditorRange {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  let wordBoundaries = findWordAt(line, cursor);;

  // If the token the cursor is on is a url, grab the whole thing instead of just parsing it like a word
  let start = wordBoundaries.from.ch;
  let end = wordBoundaries.to.ch;
  while (start > 0 && !/\s/.test(line.charAt(start - 1))) --start;
  while (end < line.length && !/\s/.test(line.charAt(end))) ++end;
  if (isUrl(line.slice(start, end), settings)) {
    wordBoundaries.from.ch = start;
    wordBoundaries.to.ch = end;
  }
  return wordBoundaries;
}

const findWordAt = (() => {
  const nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;

  function isWordChar(char: string) {
    return /\w/.test(char) || char > "\x80" &&
      (char.toUpperCase() != char.toLowerCase() || nonASCIISingleCaseWordChar.test(char));
  }

  return (line: string, pos: EditorPosition): EditorRange => {
    let check;
    let start = pos.ch;
    let end = pos.ch;
    (end === line.length) ? --start : ++end;
    const startChar = line.charAt(pos.ch);
    if (isWordChar(startChar)) {
      check = (ch: string) => isWordChar(ch);
    } else if (/\s/.test(startChar)) {
      check = (ch: string) => /\s/.test(ch);
    } else {
      check = (ch: string) => (!/\s/.test(ch) && !isWordChar(ch));
    }

    while (start > 0 && check(line.charAt(start - 1))) --start;
    while (end < line.length && check(line.charAt(end))) ++end;
    return { from: { line: pos.line, ch: start }, to: { line: pos.line, ch: end } };
  };
})();

function getCursor(editor: Editor): EditorRange {
  return { from: editor.getCursor(), to: editor.getCursor() };
}

/**
 * Check if the cursor/selection is inside markdown link parentheses
 * Handles patterns like [text]() and ![alt]()
 */
function checkIfInMarkdownLink(editor: Editor, range: EditorRange): boolean {
  const line = editor.getLine(range.from.line);
  const cursorPos = range.from.ch;
  
  // Look backwards for the opening parenthesis and bracket pattern
  let openParenIndex = -1;
  let depth = 0;
  
  // First, check if we're inside parentheses
  for (let i = cursorPos - 1; i >= 0; i--) {
    if (line[i] === ')' && i < cursorPos) {
      depth++;
    } else if (line[i] === '(') {
      if (depth === 0) {
        openParenIndex = i;
        break;
      }
      depth--;
    }
  }
  
  if (openParenIndex === -1) return false;
  
  // Now check if this parenthesis is preceded by ']'
  if (openParenIndex > 0 && line[openParenIndex - 1] === ']') {
    // Look for matching '[' or '!['
    let bracketDepth = 0;
    for (let i = openParenIndex - 2; i >= 0; i--) {
      if (line[i] === ']') {
        bracketDepth++;
      } else if (line[i] === '[') {
        if (bracketDepth === 0) {
          // Check if this is an image link (preceded by '!')
          if (i > 0 && line[i - 1] === '!') {
            return true;
          }
          return true;
        }
        bracketDepth--;
      }
    }
  }
  
  return false;
}

function replace(editor: Editor, replaceText: string, replaceRange: EditorRange | null = null): void {
  // replaceRange is only not null when there isn't anything selected.
  if (replaceRange && replaceRange.from && replaceRange.to) {
    editor.replaceRange(replaceText, replaceRange.from, replaceRange.to);
  }
  // if word is null or undefined
  else editor.replaceSelection(replaceText);
}
