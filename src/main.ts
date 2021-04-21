import { MarkdownView, Plugin } from "obsidian";
import * as CodeMirror from "codemirror";
import { PluginSettings, UrlIntoSelectionSettingsTab, DEFAULT_SETTINGS, NothingSelected } from "setting";
import {assertNever} from "assert-never";

interface WordBoundaries {
  start: { line: number; ch: number };
  end: { line: number; ch: number };
}

export default class UrlIntoSelection extends Plugin {
  settings: PluginSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new UrlIntoSelectionSettingsTab(this.app, this));
    this.addCommand({
      id: "paste-url-into-selection",
      name: "",
      callback: async () => {
        const editor = this.getEditor();
        const clipboardText = await navigator.clipboard.readText();
        this.urlIntoSelection(
          editor,
          clipboardText,
          this.settings.nothingSelected
        );
      },
    });

    this.registerCodeMirror((cm: CodeMirror.Editor) => {
      cm.on("paste", (cm, e) =>
        this.urlIntoSelection(cm, e, this.settings.nothingSelected)
      );
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private getEditor(): CodeMirror.Editor {
    let activeLeaf = this.app.workspace.activeLeaf;
    if (activeLeaf.view instanceof MarkdownView) {
      return activeLeaf.view.sourceMode.cmEditor;
    } else throw new Error("activeLeaf.view not MarkdownView");
  }

  private isUrl(text: string): boolean {
    let urlRegex = new RegExp(this.settings.regex);
    
    try {
      // throw TypeError: Invaild URL if not vaild
      new URL(text);
      return true;
    } catch (error) {
      // fallback test allows url without protocol (http,file...)
      return urlRegex.test(text);
    }
  }

  /**
   * @param cm CodeMirror Instance
   * @param cbString text on clipboard
   */
  private urlIntoSelection(
    cm: CodeMirror.Editor,
    cbString: string,
    nothingSelected: NothingSelected
  ): void;
  /**
   * @param cm CodeMirror Instance
   * @param cbEvent clipboard event
   */
  private urlIntoSelection(
    cm: CodeMirror.Editor,
    cbEvent: ClipboardEvent,
    nothingSelected: NothingSelected
  ): void;
  private urlIntoSelection(
    cm: CodeMirror.Editor,
    cb: string | ClipboardEvent,
    nothingSelected: NothingSelected
  ): void {

    // skip all if nothing should be done
    if (
      !cm.somethingSelected() &&
      nothingSelected === NothingSelected.doNothing
    )
      return;

    if (typeof cb !== "string" && cb.clipboardData===null){
      console.error("empty clipboardData in ClipboardEvent")
      return;
    }

    // Get clipboardText
    let clipboardText : string;

    if (typeof cb === "string"){
      clipboardText = cb;
    } else {
      if (cb.clipboardData===null){
        console.error("empty clipboardData in ClipboardEvent")
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
      switch (nothingSelected) {
        case NothingSelected.autoSelect:
          replaceRange = getWordBoundaries(cm);
          selectedText = cm.getRange(replaceRange.start, replaceRange.end);
          break;
        case NothingSelected.insertInline:
          replaceRange = getCursor(cm);
          selectedText = "";
          break;
        case NothingSelected.doNothing:
          throw new Error("should be skipped")
        default:
          assertNever(nothingSelected);
      }
    }

    // Get replaceText
    let replaceText : string | undefined;

    if (this.isUrl(clipboardText)) {
      replaceText = `[${selectedText}](${clipboardText})`;
    } else if (this.isUrl(selectedText)) {
      replaceText = `[${clipboardText}](${selectedText})`;
    }

    // apply changes
    if (replaceText){
      // disable default copy behavior
      if (typeof cb !== "string") cb.preventDefault();
      replace(cm, replaceText, replaceRange);
    }
  }
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
