/**
 * Strips surrounding quotes from file paths and URLs.
 * Handles both single and double quotes that are commonly added by OS file managers.
 * Only strips if both opening and closing quotes match.
 */
export function stripSurroundingQuotes(text: string): string {
  if (text.length < 2) return text;

  const first = text[0];
  const last = text[text.length - 1];

  // Check if both ends have matching quotes
  if (first === last && (first === '"' || first === "'")) {
    return text.slice(1, -1);
  }

  return text;
}
