export interface EditorPosition {
  line: number;
  ch: number;
}

export interface EditorRange {
  from: EditorPosition;
  to: EditorPosition;
}

export class Editor {
  private content: string;
  private cursor: EditorPosition;
  private selection: { from: EditorPosition; to: EditorPosition } | null = null;
  private focused: boolean = false;

  constructor(
    content: string = "",
    cursor: EditorPosition = { line: 0, ch: 0 },
  ) {
    this.content = content;
    this.cursor = cursor;
  }

  // Document Access Methods
  getDoc(): this {
    return this;
  }

  getValue(): string {
    return this.content;
  }

  setValue(content: string): void {
    this.content = content;
  }

  // Line Operations
  getLine(line: number): string {
    const lines = this.content.split("\n");
    return lines[line] || "";
  }

  setLine(n: number, text: string): void {
    const lines = this.content.split("\n");
    lines[n] = text;
    this.content = lines.join("\n");
  }

  lineCount(): number {
    return this.content.split("\n").length;
  }

  lastLine(): number {
    return this.lineCount() - 1;
  }

  // Cursor Operations
  getCursor(): EditorPosition {
    return this.cursor;
  }

  setCursor(pos: EditorPosition): void {
    this.cursor = pos;
  }

  // Selection Operations
  somethingSelected(): boolean {
    return this.selection !== null;
  }

  getSelection(): string {
    if (!this.selection) return "";

    const lines = this.content.split("\n");
    if (this.selection.from.line === this.selection.to.line) {
      return lines[this.selection.from.line].substring(
        this.selection.from.ch,
        this.selection.to.ch,
      );
    }

    // Multi-line selection
    let result = lines[this.selection.from.line].substring(
      this.selection.from.ch,
    );
    for (
      let i = this.selection.from.line + 1;
      i < this.selection.to.line;
      i++
    ) {
      result += "\n" + lines[i];
    }
    if (this.selection.to.line < lines.length) {
      result +=
        "\n" + lines[this.selection.to.line].substring(0, this.selection.to.ch);
    }
    return result;
  }

  getRange(from: EditorPosition, to: EditorPosition): string {
    const lines = this.content.split("\n");
    if (from.line === to.line) {
      return lines[from.line].substring(from.ch, to.ch);
    }

    // Multi-line range
    let result = lines[from.line].substring(from.ch);
    for (let i = from.line + 1; i < to.line; i++) {
      result += "\n" + lines[i];
    }
    if (to.line < lines.length) {
      result += "\n" + lines[to.line].substring(0, to.ch);
    }
    return result;
  }

  setSelection(anchor: EditorPosition, head?: EditorPosition): void {
    this.selection = { from: anchor, to: head || anchor };
  }

  setSelections(ranges: EditorSelectionOrCaret[], main?: number): void {
    // For simplicity, just use the first range
    if (ranges.length > 0) {
      const range = ranges[0];
      this.selection = {
        from: range.anchor,
        to: range.head || range.anchor,
      };
    }
  }

  listSelections(): EditorSelection[] {
    if (!this.selection) {
      return [{ anchor: this.cursor, head: this.cursor }];
    }
    return [{ anchor: this.selection.from, head: this.selection.to }];
  }

  // Text Manipulation
  replaceSelection(replacement: string, origin?: string): void {
    if (this.selection) {
      this.replaceRange(
        replacement,
        this.selection.from,
        this.selection.to,
        origin,
      );
      this.selection = null;
    } else {
      // Insert at cursor
      const lines = this.content.split("\n");
      const line = lines[this.cursor.line];
      lines[this.cursor.line] =
        line.substring(0, this.cursor.ch) +
        replacement +
        line.substring(this.cursor.ch);
      this.content = lines.join("\n");
      this.cursor.ch += replacement.length;
    }
  }

  replaceRange(
    replacement: string,
    from: EditorPosition,
    to?: EditorPosition,
    origin?: string,
  ): void {
    const actualTo = to || from;
    const lines = this.content.split("\n");

    if (from.line === actualTo.line) {
      const line = lines[from.line];
      lines[from.line] =
        line.substring(0, from.ch) + replacement + line.substring(actualTo.ch);
    } else {
      // Multi-line replacement
      const startLine = lines[from.line].substring(0, from.ch);
      const endLine = lines[actualTo.line].substring(actualTo.ch);
      const newLines = (startLine + replacement + endLine).split("\n");
      lines.splice(from.line, actualTo.line - from.line + 1, ...newLines);
    }

    this.content = lines.join("\n");

    // Update cursor position
    const textLines = replacement.split("\n");
    if (textLines.length === 1) {
      this.cursor = { line: from.line, ch: from.ch + replacement.length };
    } else {
      this.cursor = {
        line: from.line + textLines.length - 1,
        ch: textLines[textLines.length - 1].length,
      };
    }
  }

  // Focus Operations
  focus(): void {
    this.focused = true;
  }

  blur(): void {
    this.focused = false;
  }

  hasFocus(): boolean {
    return this.focused;
  }

  // Scroll Operations
  getScrollInfo(): { top: number; left: number } {
    return { top: 0, left: 0 };
  }

  scrollTo(x?: number | null, y?: number | null): void {
    // Mock implementation - no actual scrolling
  }

  scrollIntoView(range: EditorRange, center?: boolean): void {
    // Mock implementation - no actual scrolling
  }

  // History Operations
  undo(): void {
    // Mock implementation - no actual undo
  }

  redo(): void {
    // Mock implementation - no actual redo
  }

  // Command Operations
  exec(command: string): void {
    // Mock implementation - no actual command execution
  }

  // Transaction Operations
  transaction(tx: any, origin?: string): void {
    // Mock implementation - no actual transactions
  }

  // Word Operations
  wordAt(pos: EditorPosition): EditorRange | null {
    const line = this.getLine(pos.line);
    if (!line || pos.ch >= line.length) return null;

    // Simple word boundary detection
    const wordStart = line.lastIndexOf(" ", pos.ch - 1) + 1;
    const wordEnd = line.indexOf(" ", pos.ch);

    return {
      from: { line: pos.line, ch: wordStart },
      to: { line: pos.line, ch: wordEnd === -1 ? line.length : wordEnd },
    };
  }

  // Position/Offset Conversion
  posToOffset(pos: EditorPosition): number {
    const lines = this.content.split("\n");
    let offset = 0;
    for (let i = 0; i < pos.line && i < lines.length; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }
    return offset + pos.ch;
  }

  offsetToPos(offset: number): EditorPosition {
    const lines = this.content.split("\n");
    let currentOffset = 0;

    for (let line = 0; line < lines.length; line++) {
      const lineLength = lines[line].length;
      if (currentOffset + lineLength >= offset) {
        return { line, ch: offset - currentOffset };
      }
      currentOffset += lineLength + 1; // +1 for newline
    }

    // If offset is beyond content, return end position
    return { line: lines.length - 1, ch: lines[lines.length - 1].length };
  }

  // Line Processing
  processLines<T>(
    read: (line: number, lineText: string) => T | null,
    write: (
      line: number,
      lineText: string,
      value: T | null,
    ) => EditorChange | void,
    ignoreEmpty?: boolean,
  ): void {
    const lines = this.content.split("\n");
    const changes: EditorChange[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      if (ignoreEmpty && lineText.trim() === "") continue;

      const value = read(i, lineText);
      const change = write(i, lineText, value);
      if (change) {
        changes.push(change as EditorChange);
      }
    }

    // Apply changes (simplified)
    changes.forEach((change) => {
      if ("text" in change) {
        this.replaceRange(change.text, change.from, change.to);
      }
    });
  }

  // Display Operations
  refresh(): void {
    // Mock implementation - no actual refresh
  }
}

// Additional interfaces to support the Editor mock
export interface EditorSelectionOrCaret {
  anchor: EditorPosition;
  head?: EditorPosition;
}

export interface EditorSelection {
  anchor: EditorPosition;
  head: EditorPosition;
}

export interface EditorChange {
  from: EditorPosition;
  to?: EditorPosition;
  text: string;
}

export class MarkdownView {}
export class Plugin {}
export class PluginSettingTab {
  app: any;
  plugin: any;
  containerEl: any = { empty: () => {}, createEl: () => ({}) };

  constructor(app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
  }
}
export class Setting {
  constructor(containerEl: any) {}
  setName(name: string): this {
    return this;
  }
  setDesc(desc: string | DocumentFragment): this {
    return this;
  }
  addText(cb: any): this {
    return this;
  }
  addTextArea(cb: any): this {
    return this;
  }
  addDropdown(cb: any): this {
    return this;
  }
}

export function createFragment(
  cb: (el: DocumentFragment) => void,
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  cb(fragment as any);
  return fragment;
}
