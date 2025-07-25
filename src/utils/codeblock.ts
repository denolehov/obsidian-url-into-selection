import { Editor, EditorPosition } from "obsidian";

/**
 * Detects if a position is inside a code block (either fenced or inline)
 * @param editor Obsidian Editor instance
 * @param position Position to check
 * @returns true if inside a code block, false otherwise
 */
export function isInCodeBlock(editor: Editor, position: EditorPosition): boolean {
  return isInFencedCodeBlock(editor, position) || isInInlineCodeBlock(editor, position);
}

/**
 * Detects if a position is inside a fenced code block (```...```)
 * @param editor Obsidian Editor instance  
 * @param position Position to check
 * @returns true if inside a fenced code block, false otherwise
 */
export function isInFencedCodeBlock(editor: Editor, position: EditorPosition): boolean {
  const lineCount = editor.lineCount();
  let insideCodeBlock = false;
  let currentFenceLength = 0;
  
  // Scan from beginning of document to the position
  for (let lineNum = 0; lineNum <= position.line && lineNum < lineCount; lineNum++) {
    const line = editor.getLine(lineNum);
    const trimmedLine = line.trim();
    
    // Check if this line starts with backticks (possibly a fence)
    const fenceMatch = trimmedLine.match(/^(`{3,})/);
    
    if (fenceMatch) {
      const fenceLength = fenceMatch[1].length;
      
      if (!insideCodeBlock) {
        // Opening fence
        insideCodeBlock = true;
        currentFenceLength = fenceLength;
        
        // If we're on the opening fence line, consider it inside the code block
        if (lineNum === position.line) {
          return true;
        }
      } else if (fenceLength >= currentFenceLength) {
        // Closing fence (must be at least as long as opening fence)
        insideCodeBlock = false;
        currentFenceLength = 0;
        
        // If we're on the closing fence line, consider it inside the code block
        if (lineNum === position.line) {
          return true;
        }
      }
    }
  }
  
  return insideCodeBlock;
}

/**
 * Detects if a position is inside an inline code block (`...`)
 * @param editor Obsidian Editor instance
 * @param position Position to check  
 * @returns true if inside an inline code block, false otherwise
 */
export function isInInlineCodeBlock(editor: Editor, position: EditorPosition): boolean {
  const lineText = editor.getLine(position.line);
  
  // Find all backtick sequences in the line
  const backtickRanges: Array<{ start: number; end: number; length: number }> = [];
  
  let i = 0;
  while (i < lineText.length) {
    if (lineText[i] === '`') {
      // Check if it's escaped
      let escaped = false;
      let backslashCount = 0;
      for (let j = i - 1; j >= 0 && lineText[j] === '\\'; j--) {
        backslashCount++;
      }
      escaped = backslashCount % 2 === 1;
      
      if (!escaped) {
        // Count consecutive backticks
        let start = i;
        while (i < lineText.length && lineText[i] === '`') {
          i++;
        }
        backtickRanges.push({ start, end: i - 1, length: i - start });
      } else {
        i++;
      }
    } else {
      i++;
    }
  }
  
  // Find matching pairs of backtick sequences
  for (let i = 0; i < backtickRanges.length - 1; i++) {
    const openRange = backtickRanges[i];
    
    // Look for a closing backtick sequence of the same length
    for (let j = i + 1; j < backtickRanges.length; j++) {
      const closeRange = backtickRanges[j];
      
      if (closeRange.length === openRange.length) {
        // Found a matching pair - check if our position is inside
        const codeStart = openRange.end + 1;
        const codeEnd = closeRange.start - 1;
        
        // Consider positions on the backticks themselves as inside the code block
        if (position.ch >= openRange.start && position.ch <= closeRange.end) {
          return true;
        }
        
        // Remove the used ranges
        backtickRanges.splice(j, 1);
        backtickRanges.splice(i, 1);
        i--; // Adjust index after removal
        break;
      }
    }
  }
  
  // Handle unclosed inline code (consider everything after the opening backtick as code)
  if (backtickRanges.length > 0) {
    const lastRange = backtickRanges[backtickRanges.length - 1];
    if (position.ch >= lastRange.start) {
      return true;
    }
  }
  
  return false;
}