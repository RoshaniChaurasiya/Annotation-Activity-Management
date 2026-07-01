import { marked } from "marked";
import DOMPurify from "dompurify";

/**
 * Compiles raw markdown text and securely purges XSS elements.
 * @param rawMarkdown The untrusted chunk or full string incoming from the stream.
 */
export function renderAndSanitizeMarkdown(rawMarkdown: string): string {
  // 1. Parse markdown into an HTML string string
  const rawHtml = marked.parse(rawMarkdown, { async: false }) as string;
  
  // 2. Clear malicious tags using explicit security parameters
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "h1", "h2", "h3", "h4", "ul", "ol", "li", 
      "code", "pre", "span", "blockquote"
    ],
    ALLOWED_ATTR: ["class"], // Restrict dangerous attributes like 'onerror' or 'src'
  });
}