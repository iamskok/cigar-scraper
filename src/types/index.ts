/**
 * Core type definitions for the cigar scraper project
 *
 * This file contains all the essential types used throughout the application,
 * providing strong typing and better developer experience.
 */

import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import type { Options as RetryOptions } from 'p-retry';

/**
 * Result from the web scraping operation
 */
export interface ScrapeResult {
  /** Raw HTML content from the scraped page */
  rawHtml: string;
  /** Path to the full page screenshot */
  screenshotPath: string;
}

/**
 * Processed content after HTML cleaning and markdown conversion
 */
export interface ProcessedContent {
  /** Raw HTML before processing */
  rawHtml: string;
  /** Cleaned HTML after removing unwanted elements */
  cleanedHtml: string;
  /** Markdown representation of the cleaned HTML */
  markdown: string;
  /** File size information for monitoring */
  sizes: {
    rawHtml: { bytes: number; readable: string };
    cleanedHtml: { bytes: number; readable: string };
    markdown: { bytes: number; readable: string };
  };
}

/**
 * Configuration for HTML cleaning operations
 */
export interface CleanHTMLOptions {
  /** Remove script tags and content */
  removeScripts?: boolean;
  /** Remove style tags and content */
  removeStyles?: boolean;
  /** Remove advertisement content */
  removeAds?: boolean;
  /** Remove hidden elements (display:none, visibility:hidden) */
  removeHiddenElements?: boolean;
  /** Remove inline event handlers */
  removeInlineHandlers?: boolean;
  /** Remove inline style attributes */
  removeInlineStyles?: boolean;
  /** Remove src attributes from elements */
  removeSrcAttributes?: boolean;
  /** Remove href attributes from links */
  removeHrefAttributes?: boolean;
  /** Remove iframe elements */
  removeIframes?: boolean;
  /** Remove header layout elements */
  removeHeaderLayout?: boolean;
  /** Remove footer layout elements */
  removeFooterLayout?: boolean;
  /** Remove base64 encoded content */
  removeBase64?: boolean;
  /** Threshold for base64 content removal */
  base64Threshold?: number;
  /** Remove schema.org markup */
  removeSchemaMarkup?: boolean;
  /** Remove Open Graph markup */
  removeOGMarkup?: boolean;
  /** Remove Twitter card markup */
  removeTwitterMarkup?: boolean;
  /** Remove JSON-LD structured data */
  removeJSONLDMarkup?: boolean;
}

/**
 * Processing options for HTML content
 */
export interface ProcessOptions {
  /** Whether to convert HTML to markdown */
  useMarkdown?: boolean;
  /** HTML cleaning configuration */
  cleanHTMLOptions?: CleanHTMLOptions;
}

/**
 * Extraction strategy types for OpenAI processing
 */
export type ExtractionStrategy =
  | 'html-only'
  | 'markdown-only'
  | 'html-with-image'
  | 'markdown-with-image';

/**
 * Configuration for data extraction using OpenAI
 */
export interface ExtractionConfig {
  /** Strategy for content processing */
  strategy: ExtractionStrategy;
  /** OpenAI model to use */
  model: string;
  /** Maximum tokens for the response */
  maxTokens?: number;
  /** Temperature for response generation */
  temperature?: number;
  /** Custom system prompt for the AI */
  systemPrompt?: string;
  /** Retry options for API calls */
  retryOptions?: RetryOptions;
}

/**
 * Parameters for OpenAI API calls
 */
export interface OpenAIParams {
  /** OpenAI API key */
  apiKey: string;
  /** Chat completion messages */
  messages: ChatCompletionMessageParam[];
  /** Model to use */
  model: string;
  /** Maximum tokens */
  maxTokens: number;
  /** Temperature setting */
  temperature: number;
  /** Retry configuration */
  retryOptions: RetryOptions;
}

/**
 * File manager configuration
 */
export interface FileManagerConfig {
  /** Target URL being scraped */
  targetUrl: string;
  /** Base directory for output files */
  baseDir?: string;
}

/**
 * Content types for file operations
 */
export type ContentType =
  | 'rawHtml'
  | 'cleanHtml'
  | 'rawMarkdown'
  | 'cleanMarkdown'
  | 'extractedData'
  | 'screenshot';

/**
 * File write operation parameters
 */
export interface WriteFileParams {
  /** Content to write */
  content: string;
  /** Type of content being written */
  contentType: ContentType;
  /** Optional file suffix */
  suffix?: string;
}

/**
 * Environment variable configuration
 */
export interface EnvironmentConfig {
  /** Bright Data browser WebSocket endpoint */
  BRIGHT_DATA_BROWSER_WSE_ENDPOINT: string;
  /** OpenAI API key */
  OPENAI_API_KEY: string;
}

/**
 * Error details for enhanced error handling
 */
export interface ErrorDetails {
  /** Error message */
  message: string;
  /** Error stack trace */
  stack?: string;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Main scraper configuration
 */
export interface ScraperConfig {
  /** Target URL to scrape or array of URLs */
  url: string | string[];
  /** Browser WebSocket endpoint */
  browserEndpoint: string;
  /** Processing options */
  processOptions?: ProcessOptions;
  /** Extraction configuration */
  extractionConfig?: ExtractionConfig;
  /** Output directory */
  outputDir?: string;
}

/**
 * Result from processing multiple URLs
 */
export interface MultipleUrlResults {
  /** Results for each URL */
  results: Array<{
    url: string;
    success: boolean;
    extractedData?: unknown;
    metadata?: Record<string, unknown>;
    outputPath?: string;
    error?: string;
  }>;
  /** Summary statistics */
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalTime: number;
  };
}
