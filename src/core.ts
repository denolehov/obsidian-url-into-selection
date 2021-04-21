import assertNever from "assert-never";
import UrlIntoSel_Plugin from "main";
import { NothingSelected, PluginSettings } from "setting";

interface WordBoundaries {
  start: { line: number; ch: number };
  end: { line: number; ch: number };
}

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
  if (!cm.somethingSelected() && settings.nothingSelected === NothingSelected.doNothing)
    return;

  if (typeof cb !== "string" && cb.clipboardData === null) {
    console.error("empty clipboardData in ClipboardEvent");
    return;
  }

  // Get clipboardText
  let clipboardText: string;

  if (typeof cb === "string") {
    clipboardText = cb;
  } else {
    if (cb.clipboardData === null) {
      console.error("empty clipboardData in ClipboardEvent");
      return;
    } else {
      clipboardText = cb.clipboardData.getData("text");
    }
  }

  clipboardText = clipboardText.trim();

  // Get selectedText and replaceRange
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

  // Get replaceText
  let replaceText: string | undefined;

  const isUrl = (text: string): boolean => {
    let urlRegex = new RegExp(settings.regex);
    try {
      // throw TypeError: Invaild URL if not vaild
      new URL(text);
      return true;
    } catch (error) {
      // fallback test allows url without protocol (http,file...)
      return urlRegex.test(text);
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
  } else return; // if neither of two is an URL, the following code would be skipped.

  const imgEmbedMark = isImgEmbed(clipboardText) ? "!" : "";

  if (
    selectedText === "" &&
    settings.nothingSelected === NothingSelected.insertBare
  ) {
    replaceText = `<${url}>`;
  } else {
    replaceText = imgEmbedMark + `[${linktext}](${url})`;
  }

  // apply changes
  if (typeof cb !== "string") cb.preventDefault(); // disable default copy behavior
  replace(cm, replaceText, replaceRange);
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
