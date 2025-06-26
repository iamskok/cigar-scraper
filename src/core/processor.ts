/**
 * HTML content processing and markdown conversion
 *
 * This module handles HTML cleaning, sanitization, and conversion
 * to markdown for optimal LLM processing.
 */

import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import type { ProcessedContent, ProcessOptions, CleanHTMLOptions } from '../types/index.js';
import { formatByteSize, getErrorDetails } from '../utils/validation.js';

/**
 * Default HTML cleaning options
 */
const DEFAULT_CLEAN_OPTIONS: CleanHTMLOptions = {
  removeScripts: true,
  removeStyles: false,
  removeAds: true,
  removeHiddenElements: true,
  removeInlineHandlers: true,
  removeInlineStyles: false,
  removeSrcAttributes: true,
  removeHrefAttributes: true,
  removeIframes: true,
  removeHeaderLayout: true,
  removeFooterLayout: true,
  removeBase64: true,
  base64Threshold: 50,
  removeSchemaMarkup: false,
  removeOGMarkup: true,
  removeTwitterMarkup: true,
  removeJSONLDMarkup: false,
  removeComments: true,
  removeEmptyElements: true,
  removeSocialWidgets: true,
  removeCookieNotices: true,
};

/**
 * Default processing options
 */
const DEFAULT_PROCESS_OPTIONS: ProcessOptions = {
  useMarkdown: true,
  cleanHTMLOptions: DEFAULT_CLEAN_OPTIONS,
};

/**
 * Process HTML content with cleaning and markdown conversion
 *
 * @param rawHtml - Raw HTML content to process
 * @param options - Processing configuration
 * @returns Processed content with metadata
 */
export function processContent(
  rawHtml: string,
  options: ProcessOptions = {}
): ProcessedContent {
  try {
    console.log('Starting HTML content processing...');

    const config = { ...DEFAULT_PROCESS_OPTIONS, ...options };
    const cleanOptions = { ...DEFAULT_CLEAN_OPTIONS, ...config.cleanHTMLOptions };

    // Step 1: Clean the HTML
    console.log('Cleaning HTML content...');
    const cleanedHtml = cleanHTML(rawHtml, cleanOptions);

    // Step 2: Convert to markdown if requested
    let markdown = '';
    if (config.useMarkdown) {
      console.log('Converting to markdown...');
      markdown = convertToMarkdown(cleanedHtml);
    }

    // Step 3: Calculate file sizes
    const sizes = calculateSizes(rawHtml, cleanedHtml, markdown);

    console.log('Content processing completed');
    console.log('File sizes:', {
      rawHtml: sizes.rawHtml.readable,
      cleanedHtml: sizes.cleanedHtml.readable,
      markdown: sizes.markdown.readable,
    });

    return {
      rawHtml,
      cleanedHtml,
      markdown,
      sizes,
    };

  } catch (error) {
    const errorDetails = getErrorDetails(error);
    throw new Error(`Content processing failed: ${errorDetails.message}`);
  }
}

/**
 * Clean HTML content by removing unwanted elements
 *
 * @param html - Raw HTML content
 * @param options - Cleaning configuration
 * @returns Cleaned HTML content
 */
function cleanHTML(html: string, options: CleanHTMLOptions): string {
  try {
    const $ = cheerio.load(html);

    // Remove scripts and their content
    if (options.removeScripts) {
      $('script').remove();
    }

    // Remove styles and their content
    if (options.removeStyles) {
      $('style').remove();
    }

    // Remove advertisement content with more comprehensive patterns
    if (options.removeAds) {
      // Common ad selectors
      $('[class*="ad-"], [id*="ad-"], [class*="advertisement"], [id*="advertisement"]').remove();
      $('[class*="google-ad"], [id*="google-ad"], [class*="adsense"], [id*="adsense"]').remove();
      $('.ad, #ad, .ads, #ads, .advert, .advertisement, .sponsored').remove();
      $('[class*="banner"], [id*="banner"], [class*="promo"], [id*="promo"]').remove();
      $('[data-ad], [data-ads], [data-advertisement]').remove();
      // Remove common ad networks and tracking
      $('[class*="doubleclick"], [class*="googlesyndication"], [class*="amazon-adsystem"]').remove();
    }

    // Remove hidden elements with more patterns
    if (options.removeHiddenElements) {
      $('[style*="display:none"], [style*="display: none"]').remove();
      $('[style*="visibility:hidden"], [style*="visibility: hidden"]').remove();
      $('[hidden], [aria-hidden="true"]').remove();
      // Remove elements with zero dimensions
      $('[style*="width:0"], [style*="height:0"], [style*="opacity:0"]').remove();
      $('[style*="width: 0"], [style*="height: 0"], [style*="opacity: 0"]').remove();
    }

    // Remove inline event handlers
    if (options.removeInlineHandlers) {
      $('[onclick], [onmouseover], [onmouseout], [onfocus], [onblur]')
        .removeAttr('onclick onmouseover onmouseout onfocus onblur');
    }

    // Remove inline styles
    if (options.removeInlineStyles) {
      $('[style]').removeAttr('style');
    }

    // Remove src attributes
    if (options.removeSrcAttributes) {
      $('[src]').removeAttr('src');
    }

    // Remove href attributes
    if (options.removeHrefAttributes) {
      $('[href]').removeAttr('href');
    }

    // Remove iframes
    if (options.removeIframes) {
      $('iframe').remove();
    }

    // Remove header layout with more comprehensive patterns
    if (options.removeHeaderLayout) {
      $('header, #header, .header').remove();
      $('[class*="header"], [id*="header"]').remove();
      $('nav, #nav, .nav, .navbar, .navigation').remove();
      $('[role="banner"], [role="navigation"]').remove();
      $('.masthead, .top-bar, .site-header, .page-header').remove();
    }

    // Remove footer layout with more comprehensive patterns
    if (options.removeFooterLayout) {
      $('footer, #footer, .footer').remove();
      $('[class*="footer"], [id*="footer"]').remove();
      $('[role="contentinfo"]').remove();
      $('.site-footer, .page-footer, .bottom-bar').remove();
    }

    // Remove base64 content with improved detection
    if (options.removeBase64) {
      const threshold = options.base64Threshold || 50;
      $('*').each((_, element) => {
        const $element = $(element);
        const text = $element.text();

        // Improved base64 detection
        if (text.length > threshold) {
          // Check for base64 patterns (more strict)
          const base64Pattern = /^[A-Za-z0-9+/]{4,}={0,2}$/;
          const dataUrlPattern = /data:[^;]+;base64,/;

          if (base64Pattern.test(text.trim()) || dataUrlPattern.test(text)) {
            $element.remove();
          }
        }
      });
    }

    // Remove schema markup
    if (options.removeSchemaMarkup) {
      $('[itemscope], [itemtype], [itemprop]').removeAttr('itemscope itemtype itemprop');
    }

    // Remove Open Graph markup
    if (options.removeOGMarkup) {
      $('meta[property^="og:"]').remove();
    }

    // Remove Twitter markup
    if (options.removeTwitterMarkup) {
      $('meta[name^="twitter:"]').remove();
    }

    // Remove JSON-LD markup
    if (options.removeJSONLDMarkup) {
      $('script[type="application/ld+json"]').remove();
    }

    // Remove comments and unnecessary whitespace
    if (options.removeComments !== false) { // Default to true
      $('*').contents().filter(function() {
        return this.nodeType === 8; // Comment nodes
      }).remove();
    }

    // Remove empty paragraphs and divs
    if (options.removeEmptyElements !== false) { // Default to true
      $('p:empty, div:empty, span:empty').remove();
      // Remove elements that only contain whitespace
      $('p, div, span').each((_, element) => {
        const $element = $(element);
        if ($element.text().trim() === '' && $element.children().length === 0) {
          $element.remove();
        }
      });
    }

    // Remove social media widgets and buttons
    if (options.removeSocialWidgets) {
      $('.social, .share, .facebook, .twitter, .instagram, .linkedin').remove();
      $('[class*="social"], [class*="share"], [class*="fb-"], [class*="twitter-"]').remove();
      $('[data-social], [data-share]').remove();
    }

    // Remove cookie notices and popups
    if (options.removeCookieNotices) {
      $('[class*="cookie"], [id*="cookie"], [class*="gdpr"], [id*="gdpr"]').remove();
      $('[class*="consent"], [id*="consent"], [class*="privacy"], [id*="privacy"]').remove();
    }

    // Clean up empty elements and normalize whitespace
    $('*').each((_, element) => {
      const $element = $(element);
      const text = $element.text().trim();

      // Remove empty elements (except img, input, etc.)
      if (!text && !$element.find('img, input, textarea, select').length) {
        const tagName = (element as { tagName?: string }).tagName?.toLowerCase();
        if (tagName && !['img', 'input', 'textarea', 'select', 'br', 'hr'].includes(tagName)) {
          $element.remove();
        }
      }
    });

    return $.html();

  } catch (error) {
    const errorDetails = getErrorDetails(error);
    throw new Error(`HTML cleaning failed: ${errorDetails.message}`);
  }
}

/**
 * Convert HTML to markdown using Turndown
 *
 * @param html - HTML content to convert
 * @returns Markdown content
 */
function convertToMarkdown(html: string): string {
  try {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    // Configure turndown rules
    turndownService.addRule('removeComments', {
      filter: (node) => node.nodeType === 8, // Comment node
      replacement: () => '',
    });

    // Convert to markdown
    const markdown = turndownService.turndown(html);

    // Clean up excessive whitespace
    return markdown
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double
      .replace(/\s+$/gm, '') // Remove trailing whitespace
      .trim();

  } catch (error) {
    const errorDetails = getErrorDetails(error);
    throw new Error(`Markdown conversion failed: ${errorDetails.message}`);
  }
}

/**
 * Calculate file sizes for different content formats
 *
 * @param rawHtml - Original HTML content
 * @param cleanedHtml - Cleaned HTML content
 * @param markdown - Markdown content
 * @returns Size information object
 */
function calculateSizes(rawHtml: string, cleanedHtml: string, markdown: string): {
  rawHtml: { bytes: number; readable: string };
  cleanedHtml: { bytes: number; readable: string };
  markdown: { bytes: number; readable: string };
} {
  const rawHtmlBytes = Buffer.byteLength(rawHtml, 'utf8');
  const cleanedHtmlBytes = Buffer.byteLength(cleanedHtml, 'utf8');
  const markdownBytes = Buffer.byteLength(markdown, 'utf8');

  return {
    rawHtml: {
      bytes: rawHtmlBytes,
      readable: formatByteSize(rawHtmlBytes),
    },
    cleanedHtml: {
      bytes: cleanedHtmlBytes,
      readable: formatByteSize(cleanedHtmlBytes),
    },
    markdown: {
      bytes: markdownBytes,
      readable: formatByteSize(markdownBytes),
    },
  };
}

/**
 * Sanitize content for LLM processing
 *
 * @param content - Content to sanitize
 * @param maxLength - Maximum content length
 * @returns Sanitized content
 */
export function sanitizeForLLM(content: string, maxLength = 100000): string {
  try {
    // Remove excessive whitespace
    let sanitized = content
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{3,}/g, ' ')
      .trim();

    // Truncate if too long, preserving sentence boundaries
    if (sanitized.length > maxLength) {
      const truncated = sanitized.substring(0, maxLength);
      const lastSentence = truncated.lastIndexOf('.');

      if (lastSentence > maxLength * 0.8) {
        sanitized = truncated.substring(0, lastSentence + 1);
      } else {
        sanitized = truncated + '...';
      }
    }

    return sanitized;

  } catch (error) {
    const errorDetails = getErrorDetails(error);
    throw new Error(`Content sanitization failed: ${errorDetails.message}`);
  }
}
