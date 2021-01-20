import { Plugin } from "obsidian";
import { clipboard } from "electron";
import * as CodeMirror from "codemirror";

interface WordBoundaries {
  start: { line: number; ch: number };
  end: { line: number; ch: number };
}

export default class UrlIntoSelection extends Plugin {
  async onload() {
    this.addCommand({
      id: "paste-url-into-selection",
      name: "",
      callback: () => this.urlIntoSelection(),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "v",
        },
      ],
    });
  }

  urlIntoSelection(): void {
    let editor = this.getEditor();
    let selectedText = (UrlIntoSelection.getSelectedText(editor) || '').trim();
    let clipboardText = (clipboard.readText("clipboard") || '').trim();

    if (this.isUrl(clipboardText)) {
      editor.replaceSelection(`[${selectedText}](${clipboardText})`);
    } else if (this.isUrl(selectedText)) {
      editor.replaceSelection(`[${clipboardText}](${selectedText})`);
    }
  }

  isUrl(text: string): boolean {
    let urlRegex = new RegExp(
      "^(http:\\/\\/www\\.|https:\\/\\/www\\.|http:\\/\\/|https:\\/\\/)?[a-z0-9]+([\\-.]{1}[a-z0-9]+)*\\.[a-z]{2,5}(:[0-9]{1,5})?(\\/.*)?$"
    );
    return urlRegex.test(text);
  }

  private getEditor(): CodeMirror.Editor {
    let activeLeaf: any = this.app.workspace.activeLeaf;
    return activeLeaf.view.sourceMode.cmEditor;
  }

  private static getSelectedText(editor: CodeMirror.Editor): string {
    if (!editor.somethingSelected()) {
      let wordBoundaries = UrlIntoSelection.getWordBoundaries(editor);
      editor.getDoc().setSelection(wordBoundaries.start, wordBoundaries.end);
    }
    return editor.getSelection();
  }

  private static getWordBoundaries(editor: CodeMirror.Editor): WordBoundaries {
    let startCh, endCh: number;
    let cursor = editor.getCursor();

    if (editor.getTokenTypeAt(cursor) === "url") {
      let token = editor.getTokenAt(cursor);
      startCh = token.start;
      endCh = token.end;
    } else {
      let word = editor.findWordAt(cursor);
      startCh = word.anchor.ch;
      endCh = word.head.ch;
    }

    return {
      start: { line: cursor.line, ch: startCh },
      end: { line: cursor.line, ch: endCh },
    };
  }
}
