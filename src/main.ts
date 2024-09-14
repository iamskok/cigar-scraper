import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { saveExtractedData, saveProcessedHTMLToFiles } from './db.js';
import {
  convertImageToBase64,
  extractionSchema,
  generateTextMessages,
  sendImageAndTextToOpenAI,
  sendImageToOpenAI,
  sendToOpenAI,
} from './extractor.js';
import { processHTML, processHTMLSections } from './htmlProcessor.js';
import { getErrorDetails, scrape } from './scrape.js';
import { checkEnvVars, formatByteSize, getPathFromUrl } from './utils.js';

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

    const htmlSections = processHTMLSections(rawHtml, [
      "#productData.product_item",
      "#divImg",
      "#pr_tabDesc",
      "#pr_tabSpec",
      "#divOverall"
    ],
    {
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
        removeSchemaMarkup: false,
        removeOGMarkup: true,
        removeTwitterMarkup: true,
        removeJSONLDMarkup: false,
      },
      useMarkdown: true,
    })
    console.log("HTML Sections:", JSON.stringify(htmlSections, null, 2));

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
        removeSchemaMarkup: false,
        removeOGMarkup: true,
        removeTwitterMarkup: true,
        removeJSONLDMarkup: false,
      },
      useMarkdown: true,
    });

    saveProcessedHTMLToFiles(
      { cleanedHTML, markdown, rawHtml, sizes },
      targetUrl,
    );

    // @TODO add cleanedHtml, rawHtml, and chunking
    const retryOptions = { retries: 3, minTimeout: 1000, factor: 2 };
    const screenshotPath = getPathFromUrl({
      url: targetUrl,
      filename: 'screenshot.png',
    });
    // const resultFromImage = await sendImageToOpenAI({
    //   apiKey: process.env.OPENAI_API_KEY, // Pass your API key from environment
    //   model: 'gpt-4o-2024-08-06', // Using GPT-4o model
    //   maxTokens: 4096, // Reserve 4096 tokens for output
    //   temperature: 0, // No randomness,
    //   imagePath: screenshotPath,
    //   retryOptions,
    // });

    // console.log('Result from Image:', resultFromImage);
    // saveExtractedData({
    //   content: resultFromImage,
    //   folderPrefix: 'data',
    //   model: 'gpt-4o-2024-08-06',
    //   type: 'image',
    //   url: targetUrl,
    // });
    // const textMessages = generateTextMessages(markdown);
    // const resultFromText = await sendToOpenAI({
    //   apiKey: process.env.OPENAI_API_KEY, // Pass your API key from environment
    //   messages: textMessages, // @TODO replace with content of markdown/html. Similarly to sendImageToOpenAI
    //   model: 'gpt-4o-2024-08-06', // Using GPT-4-O model
    //   maxTokens: 4096, // Reserve 4096 tokens for output
    //   temperature: 0, // No randomness
    //   retryOptions,
    // });

    // console.log('Result from Text:', resultFromText);
    // saveExtractedData({
    //   content: resultFromText,
    //   folderPrefix: 'data',
    //   model: 'gpt-4o-2024-08-06',
    //   type: 'text',
    //   url: targetUrl,
    // });

    // export type SendImageAndTextToOpenAIParams = {
    //   apiKey: string;
    //   model: string;
    //   maxTokens: number;
    //   temperature: number;
    //   messages: OpenAI.Chat.ChatCompletionCreateParams['messages'];
    //   imagePath: string; // Local path of the image file
    //   retryOptions: RetryOptions;
    //   response_format: string; // "json"
    //   strict: boolean; // true
    //   schema: Record<string, unknown>; // The schema for structured data extraction
    // };


    const base64Image = await convertImageToBase64(screenshotPath);
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        // If data is not found set the corresponding value to \`null\`.
        content: `
          You are a highly intelligent AI assistant specializing in cigars.
          Analyze the provided image and text, and extract structured cigar-related data.
          Use both inputs together to provide the most confident and accurate answer possible.
          Return the data in a well-formatted JSON object that strictly follows the schema.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: base64Image,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text: `Please extract data from both the image and the following text for cigar-related details.`,
          },
        ],
      }
    ];
    const resultFromImageAndText = await sendImageAndTextToOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4o-2024-08-06',
      maxTokens: 4096, // Reserve 4096 tokens for output
      // schema: extractionSchema,
      temperature: 0, // No randomness
      messages,
      retryOptions,
      // response_format: {
      //   type: 'json_schema',
      //   json_schema: extractionSchema,  // Your predefined schema
      //   strict: true, // Ensures strict adherence to the schema
      // }
    });

    console.log('Result from Text and Image:', resultFromImageAndText);
    saveExtractedData({
      content: resultFromImageAndText,
      folderPrefix: 'data',
      model: 'gpt-4o-2024-08-06',
      type: 'multi',
      url: targetUrl,
    });
  } catch (error) {
    console.error(
      getErrorDetails(error) || error.stack || error.message || error,
    );
    process.exit(1);
  }
};

runScrapingProcess();
