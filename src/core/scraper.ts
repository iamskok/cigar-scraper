/**
 * Core web scraping functionality
 *
 * This module handles browser automation using Puppeteer with Bright Data,
 * providing clean and reliable web scraping with screenshot capabilities.
 */

import puppeteer from 'puppeteer-core';
import type { ScrapeResult } from '../types/index.js';
import { getErrorDetails } from '../utils/validation.js';

/**
 * Scraping configuration options
 */
interface ScrapeOptions {
  /** Browser WebSocket endpoint */
  browserEndpoint: string;
  /** Target URL to scrape */
  url: string;
  /** Viewport configuration */
  viewport?: {
    width: number;
    height: number;
  };
  /** Wait options */
  waitOptions?: {
    /** Time to wait after page load (ms) */
    waitAfterLoad?: number;
    /** Network idle timeout (ms) */
    networkIdleTimeout?: number;
  };
  /** Screenshot options */
  screenshotOptions?: {
    /** Image quality (0-100) - only applicable for JPEG format */
    quality?: number;
    /** Include full page */
    fullPage?: boolean;
    /** Screenshot format - PNG or JPEG */
    type?: 'png' | 'jpeg';
  };
}

/**
 * Default scraping configuration
 */
const DEFAULT_SCRAPE_OPTIONS: Partial<ScrapeOptions> = {
  viewport: {
    width: 1920,
    height: 1080,
  },
  waitOptions: {
    waitAfterLoad: 3000,
    networkIdleTimeout: 30000, // Increased from 5000ms to 30000ms
  },
  screenshotOptions: {
    fullPage: true,
    type: 'png' as const,
  },
};

/**
 * Scrape a web page and capture screenshot
 *
 * @param options - Scraping configuration
 * @returns Promise resolving to scrape results
 */
export async function scrape(options: ScrapeOptions): Promise<ScrapeResult> {
  const config = { ...DEFAULT_SCRAPE_OPTIONS, ...options };
  let browser: puppeteer.Browser | null = null;

  try {
    console.log(`Starting scrape of: ${options.url}`);

    // Connect to browser
    browser = await puppeteer.connect({
      browserWSEndpoint: options.browserEndpoint,
    });

    console.log('Connected to browser successfully');

    // Create new page
    const page = await browser.newPage();

    // Set page timeout to prevent premature timeouts
    page.setDefaultTimeout(60000); // 60 seconds
    page.setDefaultNavigationTimeout(60000); // 60 seconds

    // Set viewport
    if (config.viewport) {
      await page.setViewport(config.viewport);
      console.log(`Set viewport to ${config.viewport.width}x${config.viewport.height}`);
    }

    // Navigate to URL
    console.log(`Navigating to: ${options.url}`);
    await page.goto(options.url, {
      waitUntil: 'networkidle2',
      timeout: config.waitOptions?.networkIdleTimeout || 30000,
    });

    console.log('Page loaded successfully');

    // Additional wait time for dynamic content
    if (config.waitOptions?.waitAfterLoad) {
      console.log(`Waiting ${config.waitOptions.waitAfterLoad}ms for dynamic content...`);
      await new Promise(resolve => setTimeout(resolve, config.waitOptions!.waitAfterLoad!));
    }

    // Get HTML content
    console.log('Extracting HTML content...');
    const rawHtml = await page.content();
    console.log(`Extracted HTML content (${rawHtml.length} characters)`);

    // Take screenshot
    console.log('Capturing screenshot...');
    const screenshotType = config.screenshotOptions?.type || 'png';
    const screenshotOptions: { fullPage: boolean; type: 'png' | 'jpeg'; quality?: number } = {
      fullPage: config.screenshotOptions?.fullPage || true,
      type: screenshotType,
    };

    // Only add quality for JPEG format
    if (screenshotType === 'jpeg' && config.screenshotOptions?.quality) {
      screenshotOptions.quality = config.screenshotOptions.quality;
    }

    const screenshotBuffer = await page.screenshot(screenshotOptions);

    // Save screenshot to temporary file
    const screenshotPath = await saveScreenshotToTemp(Buffer.from(screenshotBuffer));
    console.log(`Screenshot saved to: ${screenshotPath}`);

    // Close page
    await page.close();

    console.log('Scraping completed successfully');

    return {
      rawHtml,
      screenshotPath,
    };

  } catch (error) {
    const errorDetails = getErrorDetails(error);
    console.error('Scraping failed:', errorDetails);
    throw new Error(`Scraping failed: ${errorDetails.message}`);

  } finally {
    // Clean up browser connection
    if (browser) {
      try {
        await browser.disconnect();
        console.log('Browser disconnected');
      } catch (cleanupError) {
        console.warn('Warning: Failed to disconnect browser:', getErrorDetails(cleanupError));
      }
    }
  }
}

/**
 * Save screenshot buffer to temporary file
 *
 * @param buffer - Screenshot buffer
 * @returns Promise resolving to file path
 */
async function saveScreenshotToTemp(buffer: Buffer): Promise<string> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const os = await import('node:os');

  try {
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    const screenshotPath = path.join(tempDir, `screenshot_${timestamp}.png`);

    await fs.writeFile(screenshotPath, new Uint8Array(buffer));
    return screenshotPath;

  } catch (error) {
    const errorDetails = getErrorDetails(error);
    throw new Error(`Failed to save screenshot: ${errorDetails.message}`);
  }
}

/**
 * Validate browser endpoint connectivity
 *
 * @param browserEndpoint - Browser WebSocket endpoint
 * @returns Promise resolving to validation result
 */
export async function validateBrowserEndpoint(browserEndpoint: string): Promise<boolean> {
  let browser: puppeteer.Browser | null = null;

  try {
    console.log('Validating browser endpoint...');
    browser = await puppeteer.connect({
      browserWSEndpoint: browserEndpoint,
    });

    console.log('Browser endpoint validation successful');
    return true;

  } catch (error) {
    const errorDetails = getErrorDetails(error);
    console.error('Browser endpoint validation failed:', errorDetails);
    return false;

  } finally {
    if (browser) {
      try {
        await browser.disconnect();
      } catch (cleanupError) {
        console.warn('Warning: Failed to disconnect during validation:', getErrorDetails(cleanupError));
      }
    }
  }
}

/**
 * Get browser version information
 *
 * @param browserEndpoint - Browser WebSocket endpoint
 * @returns Promise resolving to version info
 */
export async function getBrowserInfo(browserEndpoint: string): Promise<string> {
  let browser: puppeteer.Browser | null = null;

  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: browserEndpoint,
    });

    const version = await browser.version();
    return version;

  } catch (error) {
    const errorDetails = getErrorDetails(error);
    throw new Error(`Failed to get browser info: ${errorDetails.message}`);

  } finally {
    if (browser) {
      try {
        await browser.disconnect();
      } catch (cleanupError) {
        console.warn('Warning: Failed to disconnect during info retrieval:', getErrorDetails(cleanupError));
      }
    }
  }
}
