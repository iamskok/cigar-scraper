import * as cheerio from 'cheerio';
import turndown from 'turndown';
import { Buffer } from 'buffer';
import { formatByteSize } from './utils.js';

// Types for the cleanup options
export type CleanHTMLOptions = {
  removeScripts?: boolean;
  removeStyles?: boolean;
  removeAds?: boolean;
  removeHiddenElements?: boolean;
  removeInlineHandlers?: boolean;
  removeInlineStyles?: boolean;
  removeSrcAttributes?: boolean;
  removeHrefAttributes?: boolean;
  removeIframes?: boolean;
  removeHeaderLayout?: boolean;
  removeFooterLayout?: boolean;
  removeBase64?: boolean;
  base64Threshold?: number;
  removeVideoSrc?: boolean;
  removeImgSrc?: boolean;
  removeSchemaMarkup?: boolean;
  removeOGMarkup?: boolean;
  removeTwitterMarkup?: boolean;
  removeJSONLDMarkup?: boolean;
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
  console.log('Cleaning HTML...');
  const $ = cheerio.load(html);

  // Remove <script> and <style> tags if specified
  if (options.removeScripts) $('script').remove();
  if (options.removeStyles) $('style').remove();

  // Remove advertisements and tracking elements if specified
  if (options.removeAds) {
    $('[id*="ad"], [class*="ad"], .tracking, .advertisement, .promo-banner').remove();
  }

  // Remove hidden elements if specified
  if (options.removeHiddenElements) {
    $('[style*="display:none"], [style*="visibility:hidden"]').remove();
  }

  // Remove inline event handlers (e.g., onclick, onmouseover) if specified
  if (options.removeInlineHandlers) {
    $('[onclick], [onmouseover], [onmouseout], [onfocus], [onblur]').removeAttr('onclick onmouseover onmouseout onfocus onblur');
  }

  // Remove all inline styles if specified
  if (options.removeInlineStyles) {
    $('[style]').removeAttr('style');
  }

  // Remove all src attributes (e.g., from images, iframes) if specified
  if (options.removeSrcAttributes) {
    $('[src]').removeAttr('src');
  }

  // Remove video src attributes if specified
  if (options.removeVideoSrc) {
    $('video').removeAttr('src');
  }

  // Remove img src attributes if specified
  if (options.removeImgSrc) {
    $('img').removeAttr('src');
  }

  // Remove iframes if specified
  if (options.removeIframes) {
    $('iframe').remove();
  }

  // Remove header layout if specified (generic header patterns)
  if (options.removeHeaderLayout) {
    $('header').remove(); // Generic <header> tag
    $('#header').remove(); // Header with ID
    $('div[id*="header"], div[class*="header"]').remove(); // Common div header patterns
    $('nav').remove(); // Navigation bar as part of the header
    $('section[class*="header"]').remove(); // Header sections
  }

  // Remove footer layout if specified (generic footer patterns)
  if (options.removeFooterLayout) {
    $('footer').remove(); // Generic <footer> tag
    $('#footer').remove(); // Footer with ID
    $('div[id*="footer"], div[class*="footer"]').remove(); // Common div footer patterns
    $('section[class*="footer"]').remove(); // Footer sections
  }

  // Generalized removal of Base64-like strings across entire HTML content
  if (options.removeBase64) {
    const base64Regex = new RegExp(`[A-Za-z0-9+/=]{${options.base64Threshold || 40},}`, 'g');
    ```
    /**
     * Iterates through all elements in the DOM and removes base64-encoded content from their HTML.
     * @param {void} - This function doesn't take any parameters directly, but uses jQuery's .each() method.
     * @returns {void} This function doesn't return a value, it modifies the DOM in place.
     */
    ```
    $('*').each((_, el) => {
      const elementText = $(el).html();
      if (elementText && base64Regex.test(elementText)) {
        $(el).html(elementText.replace(base64Regex, ''));
      }
    });
  }

  // Remove schema.org attributes and markup if specified
  if (options.removeSchemaMarkup) {
    $('[itemtype*="schema.org"], [itemprop], [itemscope]').removeAttr('itemtype itemprop itemscope');
  }

  // Remove Open Graph (og) meta tags if specified
  if (options.removeOGMarkup) {
    $('meta[property^="og:"]').remove();
  }

  // Remove Twitter meta tags if specified
  if (options.removeTwitterMarkup) {
    $('meta[name^="twitter:"]').remove();
  }

  // Remove JSON-LD scripts if specified
  if (options.removeJSONLDMarkup) {
    $('script[type="application/ld+json"]').remove();
  }

  const cleanedHTML = $.html().trim();
  console.log('HTML cleaned.');
  return cleanedHTML;
};

/**
 * Converts HTML to Markdown using Turndown for simplified content structure.
 *
 * @param html - The raw HTML content.
 * @returns Markdown content.
 */
export const convertToMarkdown = (html: string): string => {
  console.log('Converting HTML to Markdown...');
  const turndownService = new turndown();
  const markdown = turndownService.turndown(html);
  console.log('HTML converted to Markdown.');
  return markdown;
};

export type ProcessHTMLOptions = {
  cleanHTMLOptions?: CleanHTMLOptions;
  useMarkdown?: boolean;
};

export type ProcessHTMLResult = {
  rawHtml: string;
  cleanedHTML: string;
  markdown?: string;
  sizes: Record<string, { bytes: number; readable: string }>;
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
      readable: formatByteSize(rawHtmlSize)
    },
    cleanedHTML: {
      bytes: cleanedHTMLSize,
      readable: formatByteSize(cleanedHTMLSize)
    },
    markdown: {
      bytes: markdownSize,
      readable: formatByteSize(markdownSize)
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

/**
 * Processes HTML sections based on given selectors and options
 * @param {string} rawHtml - The raw HTML string to process
 * @param {string[]} selectors - An array of CSS selectors to extract content from
 * @param {ProcessHTMLOptions} [options={}] - Optional processing options
 * @returns {ProcessHTMLResult[]} An array of processed HTML results
 * @throws {Error} Throws an error if no content is found for a given selector
 */
export const processHTMLSections = (
  rawHtml: string,
  selectors: string[],
  options: ProcessHTMLOptions = {}
): ProcessHTMLResult[] => {
  const $ = cheerio.load(rawHtml);

  // I need to map over all selectors and get the raw HTML content chunks and check that all html nodes have content / not emprty otherwise throw an error
  const rawHtmlChunks = selectors.map((selector) => {
    const rawHtmlChunk = $(selector).html();
    if (!rawHtmlChunk) {
      throw new Error(`No content found for selector: ${selector}`);
    }
    return rawHtmlChunk;
  });

  /**
   * Maps over an array of raw HTML chunks and processes each chunk using the processHTML function.
   * @param {Array} rawHtmlChunks - An array of raw HTML strings to be processed.
   * @param {Object} options - Configuration options for processing the HTML chunks.
   * @returns {Array} An array of processed HTML chunks.
   */
  return rawHtmlChunks.map((chunk) => processHTML(chunk, options));
}
