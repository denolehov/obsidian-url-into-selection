import { MarkdownView, Plugin } from "obsidian";
import * as CodeMirror from "codemirror";
import UrlIntoSelection from "./core"
import {
  PluginSettings,
  UrlIntoSelectionSettingsTab,
  DEFAULT_SETTINGS,
} from "setting";

export default class UrlIntoSel_Plugin extends Plugin {
  settings: PluginSettings;

  urlIntoSelection = UrlIntoSelection.bind(this) as typeof UrlIntoSelection;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new UrlIntoSelectionSettingsTab(this.app, this));
    this.addCommand({
      id: "paste-url-into-selection",
      name: "",
      callback: async () => {
        const editor = this.getEditor();
        const clipboardText = await navigator.clipboard.readText();
        this.urlIntoSelection(editor, clipboardText, this.settings.nothingSelected);
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
}