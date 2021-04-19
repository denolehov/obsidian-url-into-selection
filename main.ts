import { MarkdownView, Plugin, PluginSettingTab, Setting } from "obsidian";
import { clipboard } from "electron";
import * as CodeMirror from "codemirror";

interface WordBoundaries {
  start: { line: number; ch: number };
  end: { line: number; ch: number };
}

interface PluginSettings {
  regex: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
  regex:
    "^(http:\\/\\/www\\.|https:\\/\\/www\\.|http:\\/\\/|https:\\/\\/)?[a-z0-9]+([\\-.]{1}[a-z0-9]+)*\\.[a-z]{2,5}(:[0-9]{1,5})?(\\/.*)?$",
};

export default class UrlIntoSelection extends Plugin {
  settings: PluginSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new UrlIntoSelectionSettingsTab(this.app, this));
    this.addCommand({
      id: "paste-url-into-selection",
      name: "",
      callback: () => this.urlIntoSelection(),
    });

    this.registerCodeMirror((cm: CodeMirror.Editor) => {
      cm.on("paste", (cm, e) => {
        const clipboardText = (e.clipboardData?.getData("text") || "").trim();
        const selectedText = (
          UrlIntoSelection.getSelectedText(cm) || ""
        ).trim();

        if (this.isUrl(clipboardText)) {
          // disable default copy behavior
          e.preventDefault();
          cm.replaceSelection(`[${selectedText}](${clipboardText})`);
        } else if (this.isUrl(selectedText)) {
          // disable default copy behavior
          e.preventDefault();
          cm.replaceSelection(`[${clipboardText}](${selectedText})`);
        }
      });
    });
  }

  urlIntoSelection(): void {
    let editor = this.getEditor();
    let selectedText = (UrlIntoSelection.getSelectedText(editor) || "").trim();
    let clipboardText = (clipboard.readText("clipboard") || "").trim();

    if (this.isUrl(clipboardText)) {
      editor.replaceSelection(`[${selectedText}](${clipboardText})`);
    } else if (this.isUrl(selectedText)) {
      editor.replaceSelection(`[${clipboardText}](${selectedText})`);
    }
  }

  isUrl(text: string): boolean {
    let urlRegex = new RegExp(this.settings.regex);
    return urlRegex.test(text);
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

class UrlIntoSelectionSettingsTab extends PluginSettingTab {
  display() {
    let { containerEl } = this;
    const plugin: UrlIntoSelection = (this as any).plugin;

    containerEl.empty();
    containerEl.createEl("h2", { text: "URL-into-selection Settings" });

    new Setting(containerEl)
      .setName("Regular expression")
      .setDesc("Regular expression used to match URLs in the clipboard.")
      .addText((text) =>
        text
          .setPlaceholder("Enter regular expression here..")
          .setValue(plugin.settings.regex)
          .onChange(async (value) => {
            if (value.length > 0) {
              plugin.settings.regex = value;
              await plugin.saveSettings();
            }
          })
      );
  }
}
