import { saveExtractedData, saveProcessedHTMLToFiles } from './db.js';
import { generateTextMessages, sendImageToOpenAI, sendToOpenAI } from './extractor.js';
import { processHTML } from './htmlProcessor.js';
import { getErrorDetails, scrape } from './scrape.js';
import { checkEnvVars, getPathFromUrl } from './utils.js';

// Check required environment variables
checkEnvVars(['BRIGHT_DATA_BROWSER_WSE_ENDPOINT', 'OPENAI_API_KEY']);

const browserWSEndpoint = process.env.BRIGHT_DATA_BROWSER_WSE_ENDPOINT;
// https://geo.brdtest.com/mygeo.json
// https://www.neptunecigar.com/cigars/arturo-fuente-858
// https://www.neptunecigar.com/cigar-insider-ratings?sort=PrD&nb=12&pg=1&nep=&ca=&ci=95,
// https://www.neptunecigar.com/cigar/arturo-fuente
// https://www.cigarsinternational.com/p/davidoff-grand-cru-cigars/2008798/
const targetUrl =
  'https://www.neptunecigar.com/cigars/arturo-fuente-opus-x-angels-share-fuente-fuente';

const runScrapingProcess = async (): Promise<void> => {
  try {
    const rawHtml = await scrape({
      browserWSEndpoint,
      targetUrl,
      screenshot: true,
    });
    console.log('Scraped Data:', rawHtml);

    const { cleanedHTML, markdown, sizes } = processHTML(rawHtml, {
      cleanHTMLOptions: {
        removeScripts: true,
        removeStyles: false,
        removeAds: true,
        removeHiddenElements: true,
        removeInlineHandlers: true,
        removeInlineStyles: false,
        removeSrcAttributes: true,
        // removeVideoSrc?: boolean;
        // removeImgSrc?: boolean;
        removeHrefAttributes: true,
        removeIframes: true,
        removeHeaderLayout: true,
        removeFooterLayout: true,
        removeBase64: true,
        base64Threshold: 50,
        removeSchemaMarkup: true,
        removeOGMarkup: true,
        removeTwitterMarkup: true,
        removeJSONLDMarkup: true,
      },
      useMarkdown: true,
    });

    console.log('Processed HTML:', { cleanedHTML, markdown, rawHtml, sizes });

    saveProcessedHTMLToFiles(
      { cleanedHTML, markdown, rawHtml, sizes },
      targetUrl,
    );

    // @TODO add cleanedHtml, rawHtml, and chunking
    const retryOptions = { retries: 3, minTimeout: 1000, factor: 2 };
    const screenshotPath = getPathFromUrl({ url: targetUrl, filename: 'screenshot.png' });
    const resultFromImage = await sendImageToOpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Pass your API key from environment
      model: 'gpt-4o-2024-08-06',  // Using GPT-4-O model
      maxTokens: 4096,   // Reserve 4096 tokens for output
      temperature: 0,    // No randomness,
      imagePath: screenshotPath,
      retryOptions
    });

    console.log('Result from Image:', resultFromImage);
    saveExtractedData({
      content: resultFromImage,
      folderPrefix: 'data',
      model: 'gpt-4o-2024-08-06',
      type: 'image',
      url: targetUrl
    });
    const textMessages = generateTextMessages(markdown)
    const resultFromText = await sendToOpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Pass your API key from environment
      messages: textMessages, // @TODO replace with content of markdown/html. Similarly to sendImageToOpenAI
      model: 'gpt-4o-2024-08-06',  // Using GPT-4-O model
      maxTokens: 4096,   // Reserve 4096 tokens for output
      temperature: 0,    // No randomness
      retryOptions
    });

    console.log('Result from Text:', resultFromText);
    saveExtractedData({
      content: resultFromText,
      folderPrefix: 'data',
      model: 'gpt-4o-2024-08-06',
      type: 'text',
      url: targetUrl
    });

  } catch (error) {
    console.error(
      getErrorDetails(error) || error.stack || error.message || error,
    );
    process.exit(1);
  }
};

runScrapingProcess();
