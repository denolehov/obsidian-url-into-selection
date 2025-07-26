import assertNever from "assert-never";
import { NothingSelected, PluginSettings } from "./types";
import { Editor, EditorPosition, EditorRange } from "obsidian";
import { isUrl, processUrl, isImgEmbed, isWikilink } from "./utils/url";
import { checkIfInMarkdownLink } from "./utils/markdown";
import { stripSurroundingQuotes } from "./utils/quotes";
import { isInCodeBlock } from "./utils/codeblock";

/**
 * @param editor Obsidian Editor Instance
 * @param cbString text on clipboard
 * @param settings plugin settings
 */
export default function UrlIntoSelection(
  editor: Editor,
  cbString: string,
  settings: PluginSettings,
): void;
/**
 * @param editor Obsidian Editor Instance
 * @param cbEvent clipboard event
 * @param settings plugin settings
 */
export default function UrlIntoSelection(
  editor: Editor,
  cbEvent: ClipboardEvent,
  settings: PluginSettings,
): void;
export default function UrlIntoSelection(
  editor: Editor,
  cb: string | ClipboardEvent,
  settings: PluginSettings,
): void {
  // skip all if nothing should be done
  if (
    !editor.somethingSelected() &&
    settings.nothingSelected === NothingSelected.doNothing
  )
    return;

  // skip if cursor is in code block and the setting is enabled
  if (settings.disableInCodeBlocks) {
    if (editor.somethingSelected()) {
      // Check both start and end of selection
      const from = editor.getCursor("from");
      const to = editor.getCursor("to");
      if (isInCodeBlock(editor, from) || isInCodeBlock(editor, to)) {
        return;
      }
    } else if (isInCodeBlock(editor, editor.getCursor())) {
      return;
    }
  }

  if (typeof cb !== "string" && !cb.clipboardData) {
    console.error("empty clipboardData in ClipboardEvent");
    return;
  }

  const clipboardText = getCbText(cb);
  if (clipboardText === null) return;

  const { selectedText, replaceRange } = getSelnRange(editor, settings);
  const cursorOrRange = replaceRange || {
    from: editor.getCursor(),
    to: editor.getCursor(),
  };
  const isInMarkdownLink = checkIfInMarkdownLink(editor, cursorOrRange);
  const replaceText = getReplaceText(
    clipboardText,
    selectedText,
    settings,
    isInMarkdownLink,
  );
  if (replaceText === null) return;

  // apply changes
  if (typeof cb !== "string") cb.preventDefault(); // prevent default paste behavior
  replace(editor, replaceText, replaceRange);

  // if nothing is selected and the nothing selected behavior is to insert [](url) place the cursor between the square brackets
  if (
    selectedText === "" &&
    settings.nothingSelected === NothingSelected.insertInline
  ) {
    editor.setCursor({
      ch: replaceRange.from.ch + 1,
      line: replaceRange.from.line,
    });
  }
}

function getSelnRange(editor: Editor, settings: PluginSettings) {
  let selectedText: string;
  let replaceRange: EditorRange | null;

  if (editor.somethingSelected()) {
    selectedText = editor.getSelection();
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
function getReplaceText(
  clipboardText: string,
  selectedText: string,
  settings: PluginSettings,
  isInMarkdownLink: boolean,
): string | null {
  let linktext: string;
  let url: string;

  if (isUrl(clipboardText.trim(), settings)) {
    linktext = selectedText;
    url = clipboardText.trim();
  } else if (isUrl(selectedText.trim(), settings)) {
    linktext = clipboardText;
    url = selectedText.trim();
  } else return null; // if neither of two is an URL, the following code would be skipped.

  const imgEmbedMark = isImgEmbed(clipboardText.trim(), settings) ? "!" : "";

  // If we're inside markdown link parentheses, just return the URL without any wrapping
  if (isInMarkdownLink) {
    return url;
  }

  // Handle Obsidian wikilinks
  if (isWikilink(url)) {
    if (
      selectedText === "" &&
      settings.nothingSelected === NothingSelected.insertBare
    ) {
      return url; // Return bare wikilink
    } else if (linktext === "") {
      return url; // No alias text, return bare wikilink
    } else {
      // Add alias to wikilink: [[link|alias]]
      const linkContent = url.slice(2, -2); // Remove [[ and ]]
      return `[[${linkContent}|${linktext}]]`;
    }
  }

  url = processUrl(url);

  if (
    selectedText === "" &&
    settings.nothingSelected === NothingSelected.insertBare
  ) {
    return /^<.*>$/.test(url) ? url : `<${url}>`;
  } else {
    return imgEmbedMark + `[${linktext}](${url})`;
  }
}

function getCbText(cb: string | ClipboardEvent): string | null {
  let clipboardText: string;

  if (typeof cb === "string") {
    clipboardText = cb;
  } else {
    if (!cb.clipboardData) {
      console.error("empty clipboardData in ClipboardEvent");
      return null;
    } else {
      clipboardText = cb.clipboardData.getData("text");
    }
  }
  return stripSurroundingQuotes(clipboardText.trim());
}

function getWordBoundaries(
  editor: Editor,
  settings: PluginSettings,
): EditorRange {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  let wordBoundaries = findWordAt(line, cursor);

  // If the token the cursor is on is a url, grab the whole thing instead of just parsing it like a word
  let start = wordBoundaries.from.ch;
  let end = wordBoundaries.to.ch;
  while (start > 0 && !/\s/.test(line.charAt(start - 1))) --start;
  while (end < line.length && !/\s/.test(line.charAt(end))) ++end;

  const expandedText = line.slice(start, end);

  // Don't auto-select existing markdown links to prevent double-wrapping
  if (/^\[.*]\(.*\)$/.test(expandedText)) {
    return wordBoundaries; // Return original word boundaries, don't expand
  }

  if (isUrl(expandedText, settings)) {
    wordBoundaries.from.ch = start;
    wordBoundaries.to.ch = end;
  }
  return wordBoundaries;
}

const findWordAt = (() => {
  const nonASCIISingleCaseWordChar =
    /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;

  function isWordChar(char: string) {
    return (
      /\w/.test(char) ||
      (char > "\x80" &&
        (char.toUpperCase() != char.toLowerCase() ||
          nonASCIISingleCaseWordChar.test(char)))
    );
  }

  return (line: string, pos: EditorPosition): EditorRange => {
    let check;
    let start = pos.ch;
    let end = pos.ch;
    end === line.length ? --start : ++end;
    const startChar = line.charAt(pos.ch);
    if (isWordChar(startChar)) {
      check = (ch: string) => isWordChar(ch);
    } else if (/\s/.test(startChar)) {
      check = (ch: string) => /\s/.test(ch);
    } else {
      check = (ch: string) => !/\s/.test(ch) && !isWordChar(ch);
    }

    while (start > 0 && check(line.charAt(start - 1))) --start;
    while (end < line.length && check(line.charAt(end))) ++end;
    return {
      from: { line: pos.line, ch: start },
      to: { line: pos.line, ch: end },
    };
  };
})();

function getCursor(editor: Editor): EditorRange {
  return { from: editor.getCursor(), to: editor.getCursor() };
}

function replace(
  editor: Editor,
  replaceText: string,
  replaceRange: EditorRange | null = null,
): void {
  // replaceRange is only not null when there isn't anything selected.
  if (replaceRange && replaceRange.from && replaceRange.to) {
    editor.replaceRange(replaceText, replaceRange.from, replaceRange.to);
  }
  // if word is null or undefined
  else editor.replaceSelection(replaceText);
}

// Export internal functions for testing
export {
  getSelnRange,
  getReplaceText,
  getCbText,
  getWordBoundaries,
  findWordAt,
  getCursor,
  replace,
};
