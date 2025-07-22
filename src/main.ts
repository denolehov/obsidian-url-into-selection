import { Editor, MarkdownView, Plugin } from "obsidian";
import UrlIntoSelection from "./core";
import {
  PluginSettings,
  UrlIntoSelectionSettingsTab,
  DEFAULT_SETTINGS,
} from "./setting";

export default class UrlIntoSel_Plugin extends Plugin {
  settings: PluginSettings;

  // pasteHandler = (cm: CodeMirror.Editor, e: ClipboardEvent) => UrlIntoSelection(cm, e, this.settings);
  pasteHandler = (evt: ClipboardEvent, editor: Editor) => UrlIntoSelection(editor, evt, this.settings);


  async onload() {
    console.log("loading url-into-selection");
    await this.loadSettings();

    this.addSettingTab(new UrlIntoSelectionSettingsTab(this.app, this));
    this.addCommand({
      id: "paste-url-into-selection",
      name: "",
      editorCallback: async (editor: Editor) => {
        const clipboardText = await navigator.clipboard.readText();
        UrlIntoSelection(editor, clipboardText, this.settings);
      },
    });

    this.app.workspace.on("editor-paste", this.pasteHandler);
  }

  onunload() {
    console.log("unloading url-into-selection");

    this.app.workspace.off("editor-paste", this.pasteHandler);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
