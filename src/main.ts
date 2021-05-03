import { MarkdownView, Plugin } from "obsidian";
import * as CodeMirror from "codemirror";
import UrlIntoSelection from "./core";
import {
  PluginSettings,
  UrlIntoSelectionSettingsTab,
  DEFAULT_SETTINGS,
} from "setting";

export default class UrlIntoSel_Plugin extends Plugin {
  settings: PluginSettings;

  pasteHandler = (cm: CodeMirror.Editor, e: ClipboardEvent) =>
    UrlIntoSelection(cm, e, this.settings);

  async onload() {
    console.log("loading url-into-selection");

    await this.loadSettings();
    this.addSettingTab(new UrlIntoSelectionSettingsTab(this.app, this));
    this.addCommand({
      id: "paste-url-into-selection",
      name: "",
      callback: async () => {
        const editor = this.getEditor();
        const clipboardText = await navigator.clipboard.readText();
        UrlIntoSelection(editor, clipboardText, this.settings);
      },
    });

    this.registerCodeMirror((cm: CodeMirror.Editor) => {
      cm.on("paste", this.pasteHandler);
    });
  }

  onunload() {
    console.log("unloading url-into-selection");

    this.registerCodeMirror((cm) => cm.off("paste", this.pasteHandler));
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
}
