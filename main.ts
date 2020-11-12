import { Plugin } from "obsidian";
import { clipboard } from "electron";

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
    let activeLeaf: any = this.app.workspace.activeLeaf;
    let editor = activeLeaf.view.sourceMode.cmEditor;
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
}
