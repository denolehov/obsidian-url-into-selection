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
}
