import assertNever from "assert-never";
import { NothingSelected, PluginSettings } from "setting";
import fileUrl from 'file-url';

interface WordBoundaries {
  start: { line: number; ch: number };
  end: { line: number; ch: number };
}

// https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch08s18.html
const win32Path = /^[a-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/i;
const unixPath = /^(?:\/[^/]+)+\/?$/i;
const testFilePath = (url:string) => win32Path.test(url) || unixPath.test(url);

/**
 * @param cm CodeMirror Instance
 * @param cbString text on clipboard
 */
export default function UrlIntoSelection(
  cm: CodeMirror.Editor,
  cbString: string,
  settings: PluginSettings
): void;
/**
 * @param cm CodeMirror Instance
 * @param cbEvent clipboard event
 */
export default function UrlIntoSelection(
  cm: CodeMirror.Editor,
  cbEvent: ClipboardEvent,
  settings: PluginSettings
): void;
export default function UrlIntoSelection(
  cm: CodeMirror.Editor,
  cb: string | ClipboardEvent,
  settings: PluginSettings
): void {
  // skip all if nothing should be done
  if (
    !cm.somethingSelected() &&
    settings.nothingSelected === NothingSelected.doNothing
  )
    return;

  if (typeof cb !== "string" && cb.clipboardData === null) {
    console.error("empty clipboardData in ClipboardEvent");
    return;
  }

  const clipboardText = getCbText(cb);
  if (clipboardText === null) return;

  const { selectedText, replaceRange } = getSelnRange(cm, settings);
  const replaceText = getReplaceText(clipboardText, selectedText, settings);
  if (replaceText === null) return;

  // apply changes
  if (typeof cb !== "string") cb.preventDefault(); // disable default copy behavior
  replace(cm, replaceText, replaceRange);

  if (
    !cm.somethingSelected() &&
    settings.nothingSelected === NothingSelected.insertInline
  ) {
    cm.setCursor({
      ch: replaceRange.start.ch + 1,
      line: replaceRange.start.line,
    });
  }
}

function getSelnRange(cm: CodeMirror.Editor, settings: PluginSettings) {
  let selectedText: string;
  let replaceRange: WordBoundaries | null;

  if (cm.somethingSelected()) {
    selectedText = cm.getSelection().trim();
    replaceRange = null;
  } else {
    switch (settings.nothingSelected) {
      case NothingSelected.autoSelect:
        replaceRange = getWordBoundaries(cm);
        selectedText = cm.getRange(replaceRange.start, replaceRange.end);
        break;
      case NothingSelected.insertInline:
      case NothingSelected.insertBare:
        replaceRange = getCursor(cm);
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

function getReplaceText(
  clipboardText: string,
  selectedText: string,
  settings: PluginSettings
): string | null {
  const isUrl = (text: string): boolean => {
    if (text === "") return false;
    try {
      // throw TypeError: Invaild URL if not vaild
      new URL(text);
      return true;
    } catch (error) {
      // settings.regex: fallback test allows url without protocol (http,file...)
      return testFilePath(text) || new RegExp(settings.regex).test(text); 
    }
  };
  const isImgEmbed = (text: string): boolean => {
    const rules = settings.listForImgEmbed
      .split("\n")
      .map((v) => new RegExp(v));
    for (const reg of rules) {
      if (reg.test(text)) return true;
    }
    return false;
  };

  let linktext: string;
  let url: string;

  if (isUrl(clipboardText)) {
    linktext = selectedText;
    url = clipboardText;
  } else if (isUrl(selectedText)) {
    linktext = clipboardText;
    url = selectedText;
  } else return null; // if neither of two is an URL, the following code would be skipped.

  const imgEmbedMark = isImgEmbed(clipboardText) ? "!" : "";

  url = processUrl(url);

  if (
    selectedText === "" &&
    settings.nothingSelected === NothingSelected.insertBare
  ) {
    return `<${url}>`;
  } else {
    return imgEmbedMark + `[${linktext}](${url})`;
  }
}

/** Process file url, special characters, etc */
function processUrl(src: string): string {
  let output;
  if (testFilePath(src)){
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

function getWordBoundaries(editor: CodeMirror.Editor): WordBoundaries {
  const cursor = editor.getCursor();

  let wordBoundaries: WordBoundaries;
  if (editor.getTokenTypeAt(cursor) === "url") {
    const { start: startCh, end: endCh } = editor.getTokenAt(cursor);
    const line = cursor.line;
    wordBoundaries = { start: { line, ch: startCh }, end: { line, ch: endCh } };
  } else {
    const { anchor: start, head: end } = editor.findWordAt(cursor);
    wordBoundaries = { start, end };
  }
  return wordBoundaries;
}

function getCursor(editor: CodeMirror.Editor): WordBoundaries {
  return { start: editor.getCursor(), end: editor.getCursor() };
}

function replace(
  cm: CodeMirror.Editor,
  replaceText: string,
  replaceRange: WordBoundaries | null = null
): void {
  if (replaceRange && replaceRange.start && replaceRange.end)
    cm.replaceRange(replaceText, replaceRange.start, replaceRange.end);
  // if word is null or undefined
  else cm.replaceSelection(replaceText);
}
