import { Plugin } from "obsidian";
import { clipboard } from "electron";
import * as CodeMirror from "codemirror";

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
    let selectedText = editor.somethingSelected()
      ? editor.getSelection()
      : false;
    let clipboardText = clipboard.readText("clipboard");

    if (selectedText && clipboardText && this.isUrl(clipboardText)) {
      editor.replaceSelection(`[${selectedText}](${clipboardText})`);
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
}
