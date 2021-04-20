import UrlIntoSelection from "main";
import { PluginSettingTab, Setting } from "obsidian";

export interface PluginSettings {
  regex: string;
  autoselect: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  regex: /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.source,
  autoselect: false,
};


export class UrlIntoSelectionSettingsTab extends PluginSettingTab {
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
    new Setting(containerEl)
      .setName("Enable autoselect")
      .setDesc(
        "Automatically select word surrounding the cursor when nothing is selected"
      )
      .addToggle((toggle) =>
        toggle.setValue(plugin.settings.autoselect).onChange(async (value) => {
          plugin.settings.autoselect = value;
          await plugin.saveSettings();
          this.display();
        })
      );
  }
}
