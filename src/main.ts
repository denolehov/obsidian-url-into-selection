import { Editor, MarkdownView, Plugin } from "obsidian";
import UrlIntoSelection from "./core";
import {
  PluginSettings,
  UrlIntoSelectionSettingsTab,
  DEFAULT_SETTINGS,
} from "./setting";

export default class UrlIntoSel_Plugin extends Plugin {
  settings: PluginSettings;
  private isPlainTextPaste = false;
  private resetTimeoutId: number | null = null;

  // Track Ctrl+Shift+V key combination
  private keydownHandler = (evt: KeyboardEvent) => {
    if (
      (evt.ctrlKey || evt.metaKey) &&
      evt.shiftKey &&
      evt.key.toLowerCase() === "v"
    ) {
      this.isPlainTextPaste = true;
      // Clear any existing timeout
      if (this.resetTimeoutId !== null) {
        window.clearTimeout(this.resetTimeoutId);
      }
      // Reset flag after a short delay to handle the upcoming paste event
      this.resetTimeoutId = window.setTimeout(() => {
        this.isPlainTextPaste = false;
        this.resetTimeoutId = null;
      }, 100);
    }
  };

  // pasteHandler = (cm: CodeMirror.Editor, e: ClipboardEvent) => UrlIntoSelection(cm, e, this.settings);
  pasteHandler = (evt: ClipboardEvent, editor: Editor) => {
    if (evt.clipboardData === null) {
      return;
    }

    if (this.isPlainTextPaste) {
      return; // Don't process "paste as plain text"
    }

    UrlIntoSelection(editor, evt, this.settings);
  };

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

    this.registerEvent(
      this.app.workspace.on("editor-paste", this.pasteHandler),
    );
    // Use registerDomEvent for proper cleanup
    this.registerDomEvent(document, "keydown", this.keydownHandler);
  }

  onunload() {
    console.log("unloading url-into-selection");

    // Clear any pending timeout
    if (this.resetTimeoutId !== null) {
      window.clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    // Event listeners are automatically cleaned up by registerEvent and registerDomEvent
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
