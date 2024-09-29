import UrlIntoSel_Plugin from "main";
import { PluginSettingTab, Setting } from "obsidian";

export const enum NothingSelected {
  /** Default paste behaviour */
  doNothing,
  /** Automatically select word surrounding the cursor */
  autoSelect,
  /** Insert `[](url)` */
  insertInline,
  /** Insert `<url>` */
  insertBare,
}

export interface PluginSettings {
  regex: string;
  nothingSelected: NothingSelected;
  listForImgEmbed: string;
  onlyUrls: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  regex: /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
    .source,
  nothingSelected: NothingSelected.doNothing,
  listForImgEmbed: "",
  onlyUrls: true,
};

export class UrlIntoSelectionSettingsTab extends PluginSettingTab {
  display() {
    let { containerEl } = this;
    const plugin: UrlIntoSel_Plugin = (this as any).plugin;

    containerEl.empty();
    containerEl.createEl("h2", { text: "URL-into-selection Settings" });

    new Setting(containerEl)
      .setName("Only URLs")
      .setDesc(
        "Only turns the selected text into a URL when the clipboard text is a URL"
      )
      .addToggle((toggle) => {
        toggle.setValue(plugin.settings.onlyUrls).onChange((value) => {
          plugin.settings.onlyUrls = value;
          plugin.saveData(plugin.settings);
          return value;
        });
      });

    new Setting(containerEl)
      .setName("Fallback Regular expression")
      .setDesc(
        "Regular expression used to match URLs when default match fails."
      )
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
      .setName("Behavior on pasting URL when nothing is selected")
      .setDesc("Auto Select: Automatically select word surrounding the cursor.")
      .addDropdown((dropdown) => {
        const options: Record<NothingSelected, string> = {
          0: "Do nothing",
          1: "Auto Select",
          2: "Insert [](url)",
          3: "Insert <url>",
        };

        dropdown
          .addOptions(options)
          .setValue(plugin.settings.nothingSelected.toString())
          .onChange(async (value) => {
            plugin.settings.nothingSelected = +value;
            await plugin.saveSettings();
            this.display();
          });
      });
    new Setting(containerEl)
      .setName("Whitelist for image embed syntax")
      .setDesc(
        createFragment((el) => {
          el.appendText(
            "![selection](url) will be used for URL that matches the following list."
          );
          el.createEl("br");
          el.appendText("Rules are regex-based, split by line break.");
        })
      )
      .addTextArea((text) => {
        text
          .setPlaceholder("Example:\nyoutu.?be|vimeo")
          .setValue(plugin.settings.listForImgEmbed)
          .onChange((value) => {
            plugin.settings.listForImgEmbed = value;
            plugin.saveData(plugin.settings);
            return text;
          });
        text.inputEl.rows = 6;
        text.inputEl.cols = 25;
      });
  }
}
