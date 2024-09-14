import puppeteer, { Browser, Page } from 'puppeteer-core';
import { ensurePathExists, getPathFromUrl } from './utils.js';

// Constants
const SCRAPE_TIMEOUT = 120000; // 2 minutes

export type ScrapeParams = {
  browserWSEndpoint: string;
  targetUrl: string;
  screenshot?: true;
  timeout?: number;
  devtools?: true;
  devtoolsTimeout?: number;
}

/**
 * Connects to the browser via WebSocket.
 * @param browserWSEndpoint - WebSocket endpoint for the browser instance.
 * @returns Connected Puppeteer browser instance or throws error if connection fails.
 */
const createBrowserSession = async (browserWSEndpoint: string): Promise<Browser> => {
  console.log('Connecting to browser...');
  try {
    const browser = await puppeteer.connect({ browserWSEndpoint });
    console.log('Connected to browser.');
    return browser;
  } catch (error) {
    console.error('Failed to connect to the browser. Please check the WebSocket endpoint or network connectivity.');
    throw error;
  }
};

/**
 * Navigates to a URL and scrapes the content of the page.
 * @param page - Puppeteer Page instance.
 * @param targetUrl - URL to navigate to and scrape.
 * @returns Scraped text content from the page's body.
 */
export const scrapePage = async (page: Page, targetUrl: string, timeout: number): Promise<string> => {
  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { timeout, waitUntil: 'networkidle0' });
  console.log(`Page loaded. Scraping data...`);
  const data = await page.content();
  console.log('Scraping completed.');
  return data;
};

/**
 * Main function to scrape data from a given URL based on a specific city.
 * @param params - Object containing the WebSocket endpoint, target URL, and location.
 * @returns Scraped data as a string.
 */
export const scrape = async ({ browserWSEndpoint, targetUrl, screenshot, timeout = SCRAPE_TIMEOUT }: ScrapeParams): Promise<string> => {
  console.log(`Creating browser session...`);
  const browser = await createBrowserSession(browserWSEndpoint);
  console.log(`Created browser session.`);

  try {
    console.log('Creating new page...');
    const page = await browser.newPage();
    console.log('Created new page.');

    const scrapedData = await scrapePage(page, targetUrl, timeout);
    if (screenshot) {
      console.log('Taking full-page screenshot...');

      const screenshotPath = getPathFromUrl({ url: targetUrl, filename: 'screenshot.png' });
      ensurePathExists(screenshotPath);
      console.log('Screenshot Path:', screenshotPath);
      // const screenshotPath = `${sanitizeUrlForFilename(targetUrl)}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Full-page screenshot saved to ${screenshotPath}`);
    }

    console.log('Returning scraped data...');
    return scrapedData;
  } finally {
    console.log('Closing browser session...');
    await browser.close();
  }
};

/**
 * Extracts detailed error information, including HTTP status, if available.
 * @param error - The error object.
 * @returns Detailed error message or null if not applicable.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getErrorDetails = (error: any): string | null => {
  if (error.target?._req?.res) {
    const { statusCode, statusMessage } = error.target._req.res;
    return `Unexpected Server Status ${statusCode}: ${statusMessage}`;
  }
  return null;
};

// // Check required environment variables
// checkEnvVars(['BRIGHT_DATA_BROWSER_WSE_ENDPOINT']);

// // Initialize and run the scraping process
// const browserWSEndpoint = process.env.BRIGHT_DATA_BROWSER_WSE_ENDPOINT!;
// const targetUrl = 'https://geo.brdtest.com/mygeo.json';

// scrape({ browserWSEndpoint, targetUrl, screenshot: true })
//   .then((data) => {
//     console.log('Scraped Data:', JSON.parse(data));
//   })
//   .catch((error) => {
//     console.error(getErrorDetails(error) || error.stack || error.message || error);
//     process.exit(1);
//   });
