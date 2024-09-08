import puppeteer from 'puppeteer-core';
import * as cheerio from 'cheerio';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Check that required environment variables are defined
const requiredEnvs = ['BRIGHT_DATA_USERNAME', 'BRIGHT_DATA_PASSWORD', 'OPENAI_API_KEY'];
requiredEnvs.forEach((env) => {
  if (!process.env[env]) {
    throw new Error(`Environment variable ${env} is not defined or is empty.`);
  }
});

// Global Configuration Object
const config = {
  model: 'gpt-4o-2024-08-06', // OpenAI model type
  chunkSize: 124000, // Size for chunking large HTML content (adjusted for 16,384 tokens context limit)
  openAI: {
    maxTokens: 4096,
    apiKey: process.env.OPENAI_API_KEY || '',
    endpoint: 'https://api.openai.com/v1/chat/completions',
  },
  brightData: {
    proxyServer: 'brd.superproxy.io:22225',
    username: process.env.BRIGHT_DATA_USERNAME || '',
    password: process.env.BRIGHT_DATA_PASSWORD || '',
  },
  headless: process.env.HEADLESS === 'true', // Add flag for headless mode
  maxRetries: 3, // Max retries on 429
  retryDelay: 2000, // Initial delay in milliseconds before retrying (2 seconds)
};

// Function to load a website using Puppeteer with Bright Data Proxy and CAPTCHA Bypass
async function loadWebsite(url: string): Promise<string> {
  const browserWSEndpoint = `wss://${config.brightData.username}:${config.brightData.password}@${config.brightData.proxyServer}`;
  console.log(`[Puppeteer] Browser WebSocket Endpoint: ${browserWSEndpoint}`);
  // const browser = await puppeteer.launch({
  //   headless: config.headless,
  //   args: [
  //     `--proxy-server=${config.brightData.proxyServer}`,
  //     '--ignore-certificate-errors', // Ignore SSL certificate errors
  //     '--no-sandbox',
  //     '--disable-setuid-sandbox',
  //   ],
  // });

  const browser = await puppeteer.connect({
    browserWSEndpoint,
  });

  try {
    const page = await browser.newPage();
    await page.authenticate({
      username: config.brightData.username,
      password: config.brightData.password,
    });

    console.log(`[Puppeteer] Navigating to: ${url}`);
    // await page.goto(url, { waitUntil: 'networkidle2' });
    await page.goto(url, { timeout: 2 * 60 * 1000 });

    const content = await page.content();
    console.log(`Scraped! Data: ${content}`);
    return content;
  } finally {
    await browser.close();
  }
}

// // Function to clean up the HTML using Cheerio
// function cleanHtml(html: string): string {
//   const $ = cheerio.load(html);
//   console.log(`[Cheerio] Original HTML length: ${html.length}`);
//   $('script, style, header, footer').remove(); // Remove unnecessary tags
//   console.log(`[Cheerio] Cleaned HTML length: ${html.length}`);
//   return $.html(); // Return cleaned HTML
// }
// Function to clean up the HTML, focusing on main content and removing unnecessary sections
// Function to clean up the HTML, removing unnecessary sections and attributes
function cleanHtml(html: string): string {
  const $ = cheerio.load(html);
  console.log(`[Cheerio] Original HTML length: ${html.length}`);

  // Remove scripts, styles, and inline JavaScript events
  $('script, style, [onload], [onclick], [onmouseover]').remove();

  // Remove common layout elements like header, footer, nav, and aside
  $('header, footer, nav, aside').remove();

  // Remove Base64-encoded images and large data blobs
  const base64Regex = /data:image\/(png|jpeg|gif);base64,[A-Za-z0-9+/=]+/g;
  $('img').each((i, img) => {
    const src = $(img).attr('src');
    if (src && base64Regex.test(src)) {
      $(img).remove();
    }
  });

  // Remove meta tags, links, comments, and other irrelevant sections
  $('meta, link, comment').remove();

  // Remove itemscope, itemtype, and other microdata attributes
  $('[itemscope], [itemtype], [itemprop]').removeAttr('itemscope itemtype itemprop');

  // Remove tracking/analytics attributes and unnecessary attributes
  $('*').each((_, el) => {
    $(el).removeAttr('style aria-* data-* onclick onload onmouseover');
  });

  // Remove inline styles
  $('*').removeAttr('style'); // Removes all inline styles

  // Remove empty elements after cleaning attributes
  $('*').each((_, el) => {
    if ($(el).is(':empty')) {
      $(el).remove();
    }
  });

  // Just grab the body content after the cleanup
  const cleanedBody = $('body').html() || '';

  console.log(`[Cheerio] Cleaned HTML length: ${cleanedBody.length}`);
  return cleanedBody.trim();
}



// Function to chunk large HTML content into smaller pieces
function chunkHtmlContent(html: string, chunkSize: number): string[] {
  const chunks = [];
  for (let i = 0; i < html.length; i += chunkSize) {
    chunks.push(html.slice(i, i + chunkSize));
  }
  console.log(`[Chunking] Number of chunks: ${chunks.length}`);
  return chunks;
}

// Define the OpenAI response type
type OpenAIResponse = {
  price?: string | null;
  origin?: string | null;
  wrapper?: string | null;
  brand?: string | null;
  rating?: string | null;
  availability?: string | null;
  isSampler?: boolean | null;
  packaging?: string | null;
};

// Function to strip code block markers (`` ```json ``) and extract valid JSON
function stripCodeBlocks(content: string): string {
  // Remove leading and trailing code blocks (```)
  return content.replace(/```json|```/g, '').trim();
}

// Retry function with exponential backoff
async function retry(fn: Function, retries = config.maxRetries, delay = config.retryDelay): Promise<any> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error.response?.status === 429) {
      console.warn(`[OpenAI] Rate limited. Retrying in ${delay / 1000}s...`);
      await new Promise((res) => setTimeout(res, delay)); // Wait before retrying
      return retry(fn, retries - 1, delay * 2); // Exponential backoff
    } else {
      throw error;
    }
  }
}
write module that does basic html cleanup but detailed, markdown conversion method, unfluff extraction, generic puppeteer methods trying to find data without AI. has to be production ready code.

here is the list of things I'm interested in


// Function to extract structured data using GPT-4o-mini from HTML chunks
async function extractStructuredDataFromChunks(htmlChunks: string[]): Promise<OpenAIResponse[]> {
  const results: OpenAIResponse[] = [];

  for (const [index, chunk] of htmlChunks.entries()) {
    const tokenCount = Math.floor(chunk.length / 4); // Approximate token count (4 characters = 1 token)
    console.log(`[Chunk Info] Chunk ${index + 1}/${htmlChunks.length}, Approx token count: ${tokenCount}, chunk length: ${chunk.length}\n`);
    console.log(`[Chunk Content] Full chunk: ${chunk}\n`);

    const messages = [
      { role: 'system', content: 'You are an AI assistant helping extract structured data.' },
      { role: 'user', content: `Extract the following details about the cigar:
        - Brands
        - Cigar Shape
        - Cigar Section
        - Cigar Length
        - Cigar Origin
        - Cigar Ring Gauge
        - Strength
        - Wrapper Color
        - Rolling Type
        - Cigar Manufacturer
        - Cigar Wrapper
        - Cigar Binder
        - Cigar Filler
        - Price
        - Availability
        - Cigar Rating
        - Capture all product images and alt text/descriptions.
        - Flavours
        - Is it in stock
        - Capture prices of all available sizes/vitolas.

      Provide back a JSON object. If data was not found, skip that field.

      Here is the content: ${chunk}` },
    ];

    console.log(`[OpenAI] Sending chunk to OpenAI (chunk ${i + 1}/${htmlChunks.length})`);

    try {
      // Throttle requests using retry mechanism with backoff
      const response = await retry(async () =>
        axios.post(
          config.openAI.endpoint,
          {
          // Recommended OpenAI API configuration to ensure high precision and consistent results

          /*
            1. temperature: 0
              - Default: 0.7
              - Recommended: 0
              - Reason: Ensures deterministic outputs by reducing randomness in predictions.

            2. top_p: 1
              - Default: 1
              - Recommended: 1
              - Reason: Considers the top 100% of possible results, ensuring no random truncation of options.

            3. frequency_penalty: 0
              - Default: 0
              - Recommended: 0-0.5 (start at 0.2)
              - Reason: Discourages repeated phrases and helps ensure varied but relevant responses.

            4. presence_penalty: 0
              - Default: 0
              - Recommended: 0-0.5 (start at 0.2)
              - Reason: Helps to avoid over-emphasizing newly introduced tokens while staying relevant.
          */
            model: config.model,
            messages: messages,
            max_tokens: config.openAI.maxTokens, // 2000 tokens for the output response
            temperature: 0, // Set to 0 for deterministic outputs
          },
          {
            headers: {
              Authorization: `Bearer ${config.openAI.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      console.log(`[OpenAI] Response received for chunk ${i + 1}: ${JSON.stringify(response.data, null, 2)}`);

      const rawContent = response.data.choices?.[0]?.message?.content?.trim() || '{}';
      const cleanedContent = stripCodeBlocks(rawContent); // Strip code blocks to get valid JSON
      const extractedData: OpenAIResponse = JSON.parse(cleanedContent);
      results.push(extractedData);
    } catch (error) {
      console.error(`[OpenAI Error] Chunk ${i + 1}/${htmlChunks.length}: ${error.message}`);
      console.error(`[OpenAI Error] Response data: ${JSON.stringify(error.response?.data, null, 2)}`);
    }
  }

  return results;
}

// Main function to scrape and extract data from the website
const scrapeAndExtractData = async (url: string) => {
  try {
    // Load the website using Puppeteer
    const rawHtml = await loadWebsite(url);

    // Clean up the HTML using Cheerio
    const cleanedHtml = cleanHtml(rawHtml);

    // Chunk the cleaned HTML content into smaller pieces
    const htmlChunks = chunkHtmlContent(cleanedHtml, config.chunkSize);

    // Extract structured data from HTML chunks using OpenAI
    const structuredDataChunks = await extractStructuredDataFromChunks(htmlChunks);

    // Combine the results from all chunks (simple merge)
    const structuredData = structuredDataChunks.reduce((acc, chunk) => {
      return { ...acc, ...chunk }; // Merge chunks (consider more advanced merge strategy if needed)
    }, {} as OpenAIResponse);

    console.log("Extracted Structured Data:", structuredData); // Log final extracted data
  } catch (error) {
    console.error("Error:", error); // Log any errors that occur during the process
  }
};

// Example usage with headless flag (for non-headless mode, set HEADLESS=false in .env)
scrapeAndExtractData("https://www.neptunecigar.com/cigars/arturo-fuente-opus-x-angels-share-fuente-fuente");
// scrapeAndExtractData("https://geo.brdtest.com/welcome.txt");

