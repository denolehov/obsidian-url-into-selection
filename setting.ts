import UrlIntoSelection from "main";
import { PluginSettingTab, Setting } from "obsidian";


export enum NothingSelected {
  doNothing,
  autoSelect,
}

export interface PluginSettings {
  regex: string;
  nothingSelected: NothingSelected;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  regex: /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.source,
  nothingSelected: NothingSelected.doNothing,
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
      .setName("Behavior on pasting URL when nothing is selected")
      .setDesc(
        "Automatically select word surrounding the cursor when nothing is selected"
      )
      .addDropdown((dropdown)=>{
        for (var enumMember in NothingSelected) {
          var isValueProperty = parseInt(enumMember, 10) >= 0
          if (isValueProperty) {
             dropdown.addOption(enumMember,NothingSelected[enumMember])
          }
       }
       dropdown
         .setValue(plugin.settings.nothingSelected.toString())
         .onChange(async (value) => {
           plugin.settings.nothingSelected = +value;
           await plugin.saveSettings();
           this.display();
         });
      });
  }
}
