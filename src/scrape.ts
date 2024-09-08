// import puppeteer from 'puppeteer-core';
// import dotenv from 'dotenv';

// dotenv.config();

// // Check that required environment variables are defined
// const requiredEnvs = ['BRIGHT_DATA_BROWSER_WSE_ENDPOINT'];
// requiredEnvs.forEach((env) => {
//   if (!process.env[env]) {
//     throw new Error(`Environment variable ${env} is not defined or is empty.`);
//   }
// });

// const {
//     BRIGHT_DATA_BROWSER_WSE_ENDPOINT,
//     TARGET_URL = 'https://geo.brdtest.com/mygeo.json',
//     LOCATION = 'new_york',
// } = process.env;

// console.log({
//   BRIGHT_DATA_BROWSER_WSE_ENDPOINT,
//   TARGET_URL,
//   LOCATION,
// })

// const LOCATIONS = Object.freeze({
//     amsterdam: { lat: 52.377956, lon: 4.897070 },
//     london: { lat: 51.509865, lon: -0.118092 },
//     new_york: { lat: 40.730610, lon: -73.935242 },
//     paris: { lat: 48.864716, lon: 2.349014 },
// });

// const scrape = async (url = TARGET_URL, location = LOCATION) => {
//     if (!LOCATIONS[location]) {
//         throw new Error(`Unknown location`);
//     }
//     const { lat, lon } = LOCATIONS[location];
//     console.log(`Connecting to Browser...`);
//     console.log({ browserWSEndpoint: BRIGHT_DATA_BROWSER_WSE_ENDPOINT });
//     const browser = await puppeteer.connect({ browserWSEndpoint: BRIGHT_DATA_BROWSER_WSE_ENDPOINT });
//     try {
//         console.log(`Connected! Changing proxy location`
//             + ` to ${location} (${lat}, ${lon})...`);
//         const page = await browser.newPage();
//         const client = await page.createCDPSession();
//         await client.send('Proxy.setLocation', {
//             lat, lon,
//             distance: 50 /* kilometers */,
//             strict: true,
//         });
//         console.log(`Navigating to ${url}...`);
//         await page.goto(url, { timeout: 2 * 60 * 1000 });
//         console.log(`Navigated! Scraping data...`);
//         const data = await page.$eval('body', el => el.innerText);
//         console.log(`Scraped! Data:`, JSON.parse(data));
//     } finally {
//         await browser.close();
//     }
// }

// function getErrorDetails(error) {
//     if (error.target?._req?.res) {
//         const {
//             statusCode,
//             statusMessage,
//         } = error.target._req.res;
//         return `Unexpected Server Status ${statusCode}: ${statusMessage}`;
//     }
// }

// scrape().catch(error => {
//     console.error(getErrorDetails(error)
//         || error.stack
//         || error.message
//         || error);
//     process.exit(1);
// });

import { exec } from  'node:child_process';
import puppeteer, { Browser, CDPSession, Page } from 'puppeteer-core';
// import dotenv from 'dotenv';

// dotenv.config();

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
const scrapePage = async (page: Page, targetUrl: string, timeout: number): Promise<string> => {
  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { timeout, waitUntil: 'networkidle0' });
  console.log(`Page loaded. Scraping data...`);
  const data = await page.$eval('body', (el) => el.innerText);
  console.log('Scraping completed.');
  return data;
};

/**
 * Sanitizes a URL to be used as a filename by replacing invalid characters.
 * Invalid characters include control characters and characters that are not allowed in filenames.
 *
 * @param  url - The URL to be sanitized.
 * @returns The sanitized filename.
 */
const sanitizeUrlForFilename = (url: string): string => {
  // eslint-disable-next-line no-control-regex
  const controlChars = /[\x00-\x1F]/g;
  const invalidChars = /[<>:"\\/|?*]/g;
  return url.replace(controlChars, '_').replace(invalidChars, '_');
}

const chromeExecutable = 'google-chrome';

// const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
// export const openDevtools = async (page: Page, client: CDPSession): Promise<void> => {
//     // get current frameId
//     const frameId = page.mainFrame()._id;
//     // get URL for devtools from scraping browser
//     const { url: inspectUrl } = await client.send('Page.inspect', { frameId });
//     // open devtools URL in local chrome
//     exec(`"${chromeExecutable}" "${inspectUrl}"`, error => {
//         if (error) {
//           console.log(`Unable to open devtools for ${inspectUrl}. Error: ${error}`);
//           throw new Error('Unable to open devtools: ' + error);
//         }
//     });
//     // wait for devtools ui to load
//     await delay(5000);
// };


// Define delay type
type Delay = (ms: number) => Promise<void>;

/**
 * Delays the execution for a specified time.
 * @param ms - Time in milliseconds to delay.
 * @returns A promise that resolves after the delay.
 */
const delay: Delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Opens DevTools for a Puppeteer page using the WebSocket endpoint.
 * @param page - The Puppeteer page object.
 * @param chromeExecutable - Path to the Chrome or Chromium executable.
 * @returns A promise that resolves when DevTools UI has loaded.
 */
export const openDevtools = async (page: puppeteer.Page, chromeExecutable: string): Promise<void> => {
    try {
        // Get the WebSocket endpoint to generate the DevTools URL
        const inspectUrl = `chrome-devtools://devtools/inspector.html?ws=${page.browser().wsEndpoint()}`;

        // Open the DevTools URL in a local Chrome instance
        exec(`"${chromeExecutable}" "${inspectUrl}"`, (error) => {
            if (error) {
                console.log(`Unable to open DevTools for ${inspectUrl}. Error: ${error}`);
                throw new Error('Unable to open DevTools: ' + error);
            }
        });

        // Wait for the DevTools UI to load
        await delay(5000);
    } catch (error) {
        console.error(`Error opening DevTools: ${error.message}`);
        throw error;
    }
};

/**
 * Main function to scrape data from a given URL based on a specific city.
 * @param params - Object containing the WebSocket endpoint, target URL, and location.
 * @returns Scraped data as a string.
 */
export const scrape = async ({ browserWSEndpoint, targetUrl, screenshot, timeout = SCRAPE_TIMEOUT }: ScrapeParams): Promise<string> => {
  const browser = await createBrowserSession(browserWSEndpoint);

  try {
    const page = await browser.newPage();
    // const client: CDPSession = await page.createCDPSession();
    // await openDevtools(page, chromeExecutable);

    const scrapedData = await scrapePage(page, targetUrl, timeout);
    if (screenshot) {
      console.log('Taking full-page screenshot...');
      const screenshotPath = `${sanitizeUrlForFilename(targetUrl)}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Full-page screenshot saved to ${screenshotPath}`);
    }

    return scrapedData;
  } finally {
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
