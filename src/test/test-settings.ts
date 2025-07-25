import { NothingSelected, PluginSettings } from "../types";

export const DEFAULT_SETTINGS: PluginSettings = {
  regex:
    /^[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
      .source,
  nothingSelected: NothingSelected.doNothing,
  listForImgEmbed: "",
};
