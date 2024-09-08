import * as cheerio from 'cheerio';
import turndown from 'turndown';

// Types for structured cigar data and other outputs
export type CleanHTMLOptions = {
  scripts?: boolean;
  styles?: boolean;
  ads?: boolean;
  hiddenElements?: boolean;
  inlineHandlers?: boolean;
  inlineStyles?: boolean;
  srcAttributes?: boolean;
  hrefAttributes?: boolean;
  header?: boolean;
  footer?: boolean;
  iframes?: boolean;
};

/**
 * Performs detailed HTML cleanup using Cheerio.
 * The cleanup process is controlled by options that specify what to remove from the HTML.
 *
 * @param html - The raw HTML content.
 * @param options - Cleanup options that control the manual cleanup operations.
 * @returns Cleaned HTML as a string.
 */
export const cleanHTML = (html: string, options: CleanHTMLOptions = {}): string => {
  const $ = cheerio.load(html);

  // Remove <script> and <style> tags if specified
  if (options.scripts) $('script').remove();
  if (options.styles) $('style').remove();

  // Remove advertisements and tracking elements if specified
  if (options.ads) {
    $('[id*="ad"], [class*="ad"], .tracking, .advertisement, .promo-banner').remove();
  }

  // Remove hidden elements if specified
  if (options.hiddenElements) {
    $('[style*="display:none"], [style*="visibility:hidden"]').remove();
  }

  // Remove inline event handlers (e.g., onclick, onmouseover) if specified
  if (options.inlineHandlers) {
    $('[onclick], [onmouseover], [onmouseout], [onfocus], [onblur]').removeAttr('onclick onmouseover onmouseout onfocus onblur');
  }

  // Remove all inline styles if specified
  if (options.inlineStyles) {
    $('[style]').removeAttr('style');
  }

  // Remove all src attributes (e.g., from images, iframes) if specified
  if (options.srcAttributes) {
    $('[src]').removeAttr('src');
  }

  // Remove all href attributes (e.g., from anchor tags) if specified
  if (options.hrefAttributes) {
    $('[href]').removeAttr('href');
  }

  // Remove iframes if specified
  if (options.iframes) {
    $('iframe').remove();
  }

  // Remove header if specified (generic header patterns)
  if (options.header) {
    $('header').remove(); // Generic <header> tag
    $('div[id*="header"], div[class*="header"]').remove(); // Common div header patterns
    $('nav').remove(); // Navigation bar as part of the header
    $('section[class*="header"]').remove(); // Header sections
  }

  // Remove footer if specified (generic footer patterns)
  if (options.footer) {
    $('footer').remove(); // Generic <footer> tag
    $('div[id*="footer"], div[class*="footer"]').remove(); // Common div footer patterns
    $('section[class*="footer"]').remove(); // Footer sections
  }

  // Clean up extra white spaces
  // const cleanedHTML = $.html().replace(/\s+/g, ' ').trim();
  const cleanedHTML = $.html().trim();
  return cleanedHTML;
};

/**
 * Converts HTML to Markdown using Turndown for simplified content structure.
 *
 * @param html - The raw HTML content.
 * @returns Markdown content.
 */
export const convertToMarkdown = (html: string): string => {
  const turndownService = new turndown();
  return turndownService.turndown(html);
};

type ProcessHTMLOptions = {
  cleanHTMLOptions?: CleanHTMLOptions;
  useMarkdown?: boolean;
};

type ProcessHTMLResult = {
  rawHtml: string;
  cleanedHTML: string;
  markdown?: string;
  sizes: Record<string, { bytes: number; readable: string }>;
};

import { Buffer } from 'buffer';

/**
 * Converts bytes into a more human-readable format (KB, MB, etc.).
 * @param bytes - The size in bytes.
 * @returns A string representing the size in a more readable format.
 */
const formatSizeUnits = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Orchestrator for processing HTML:
 * - Cleans the HTML based on provided options.
 * - Converts to Markdown (if required).
 *
 * @param rawHtml - The raw HTML content.
 * @param options - Processing options such as enabling markdown conversion or cleanup options.
 * @returns Extracted data from various tools along with cleaned and original HTML and file size statistics.
 */
export const processHTML = (
  rawHtml: string,
  options: ProcessHTMLOptions = {}
): ProcessHTMLResult => {
  // Step 1: Clean the HTML using specified options
  const cleanedHTML = cleanHTML(rawHtml, options.cleanHTMLOptions || {});

  // Step 2: Optionally convert to Markdown
  let markdown;
  if (options.useMarkdown) {
    markdown = convertToMarkdown(cleanedHTML);
  }

  // Calculate file size stats in bytes
  const rawHtmlSize = Buffer.byteLength(rawHtml, 'utf8');
  const cleanedHTMLSize = Buffer.byteLength(cleanedHTML, 'utf8');
  const markdownSize = markdown ? Buffer.byteLength(markdown, 'utf8') : 0;

  // Create sizes object with both bytes and human-readable format
  const sizes = {
    rawHtml: {
      bytes: rawHtmlSize,
      readable: formatSizeUnits(rawHtmlSize)
    },
    cleanedHTML: {
      bytes: cleanedHTMLSize,
      readable: formatSizeUnits(cleanedHTMLSize)
    },
    markdown: {
      bytes: markdownSize,
      readable: formatSizeUnits(markdownSize)
    },
  };

  // Log the sizes for debugging
  console.log('File sizes:', sizes);

  return {
    rawHtml,
    cleanedHTML,
    markdown,
    sizes
  };
};
