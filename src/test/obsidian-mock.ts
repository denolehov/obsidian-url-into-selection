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

  constructor(content: string = '', cursor: EditorPosition = { line: 0, ch: 0 }) {
    this.content = content;
    this.cursor = cursor;
  }

  getLine(line: number): string {
    const lines = this.content.split('\n');
    return lines[line] || '';
  }

  getCursor(): EditorPosition {
    return this.cursor;
  }

  setCursor(pos: EditorPosition): void {
    this.cursor = pos;
  }

  somethingSelected(): boolean {
    return this.selection !== null;
  }

  getSelection(): string {
    if (!this.selection) return '';
    
    const lines = this.content.split('\n');
    if (this.selection.from.line === this.selection.to.line) {
      return lines[this.selection.from.line].substring(this.selection.from.ch, this.selection.to.ch);
    }
    
    // Multi-line selection
    let result = lines[this.selection.from.line].substring(this.selection.from.ch);
    for (let i = this.selection.from.line + 1; i < this.selection.to.line; i++) {
      result += '\n' + lines[i];
    }
    if (this.selection.to.line < lines.length) {
      result += '\n' + lines[this.selection.to.line].substring(0, this.selection.to.ch);
    }
    return result;
  }

  getRange(from: EditorPosition, to: EditorPosition): string {
    const lines = this.content.split('\n');
    if (from.line === to.line) {
      return lines[from.line].substring(from.ch, to.ch);
    }
    
    // Multi-line range
    let result = lines[from.line].substring(from.ch);
    for (let i = from.line + 1; i < to.line; i++) {
      result += '\n' + lines[i];
    }
    if (to.line < lines.length) {
      result += '\n' + lines[to.line].substring(0, to.ch);
    }
    return result;
  }

  setSelection(from: EditorPosition, to: EditorPosition): void {
    this.selection = { from, to };
  }

  replaceSelection(text: string): void {
    if (this.selection) {
      this.replaceRange(text, this.selection.from, this.selection.to);
      this.selection = null;
    } else {
      // Insert at cursor
      const lines = this.content.split('\n');
      const line = lines[this.cursor.line];
      lines[this.cursor.line] = line.substring(0, this.cursor.ch) + text + line.substring(this.cursor.ch);
      this.content = lines.join('\n');
      this.cursor.ch += text.length;
    }
  }

  replaceRange(text: string, from: EditorPosition, to: EditorPosition): void {
    const lines = this.content.split('\n');
    
    if (from.line === to.line) {
      const line = lines[from.line];
      lines[from.line] = line.substring(0, from.ch) + text + line.substring(to.ch);
    } else {
      // Multi-line replacement
      const startLine = lines[from.line].substring(0, from.ch);
      const endLine = lines[to.line].substring(to.ch);
      const newLines = (startLine + text + endLine).split('\n');
      lines.splice(from.line, to.line - from.line + 1, ...newLines);
    }
    
    this.content = lines.join('\n');
    
    // Update cursor position
    const textLines = text.split('\n');
    if (textLines.length === 1) {
      this.cursor = { line: from.line, ch: from.ch + text.length };
    } else {
      this.cursor = { 
        line: from.line + textLines.length - 1, 
        ch: textLines[textLines.length - 1].length 
      };
    }
  }

  getValue(): string {
    return this.content;
  }

  setValue(content: string): void {
    this.content = content;
  }
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
  setName(name: string): this { return this; }
  setDesc(desc: string | DocumentFragment): this { return this; }
  addText(cb: any): this { return this; }
  addTextArea(cb: any): this { return this; }
  addDropdown(cb: any): this { return this; }
}

export function createFragment(cb: (el: DocumentFragment) => void): DocumentFragment {
  const fragment = document.createDocumentFragment();
  cb(fragment as any);
  return fragment;
}
