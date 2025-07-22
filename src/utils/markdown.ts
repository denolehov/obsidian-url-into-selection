import { Editor, EditorRange } from "obsidian";

/**
 * Check if the cursor/selection is inside markdown link parentheses
 * Handles patterns like [text]() and ![alt]()
 */
export function checkIfInMarkdownLink(editor: Editor, range: EditorRange): boolean {
  const line = editor.getLine(range.from.line);
  const cursorPos = range.from.ch;
  
  // Look backwards for the opening parenthesis and bracket pattern
  let openParenIndex = -1;
  let depth = 0;
  
  // First, check if we're inside parentheses
  for (let i = cursorPos - 1; i >= 0; i--) {
    if (line[i] === ')' && i < cursorPos) {
      depth++;
    } else if (line[i] === '(') {
      if (depth === 0) {
        openParenIndex = i;
        break;
      }
      depth--;
    }
  }
  
  if (openParenIndex === -1) return false;
  
  // Now check if this parenthesis is preceded by ']'
  if (openParenIndex > 0 && line[openParenIndex - 1] === ']') {
    // Look for matching '[' or '!['
    let bracketDepth = 0;
    for (let i = openParenIndex - 2; i >= 0; i--) {
      if (line[i] === ']') {
        bracketDepth++;
      } else if (line[i] === '[') {
        if (bracketDepth === 0) {
          // Check if this is an image link (preceded by '!')
          if (i > 0 && line[i - 1] === '!') {
            return true;
          }
          return true;
        }
        bracketDepth--;
      }
    }
  }
  
  return false;
}
