import OpenAI from 'openai';
import * as fs from 'node:fs';
import pRetry, { Options as RetryOptions } from 'p-retry';
import sharp from 'sharp';
import type { ChatCompletionCreateParams, ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { number, z } from 'zod';
import { zodResponseFormat } from "openai/helpers/zod";

// Define and export type for sendToOpenAI parameters
export type SendToOpenAIParams = {
  apiKey: string;
  messages: OpenAI.Chat.ChatCompletionCreateParams['messages'];
  model: string;
  maxTokens: number;
  temperature: number;
  retryOptions: RetryOptions;
};

/**
 * Extraction requirements for cigars to include in text and image prompts.
 */
const extractionRequirements = `
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
  - Capture all product images, their alt text, and image descriptions.
  - Flavours
  - Is it in stock?
  - Capture prices of all available sizes/vitolas.
`;

const extractionRequirementsSchema = z.object({
  cigarSection: z.string(),
  cigarLength: z.string(),
  cigarOrigin: z.string(),
  cigarRingGauge: z.string(),
  strength: z.string(),
  wrapperColor: z.string(),
  rollingType: z.string(),
  cigarManufacturer: z.string(),
  cigarWrapper: z.string(),
  cigarBinder: z.string(),
  cigarFiller: z.string(),
  price: z.string(),
  cigarRating: z.string(),
  productImages: z.array(z.object({
    url: z.string(),  // Removed .url() validation
    altText: z.string(),
    description: z.string(),
  })),
  numberOfCigarsReleased: z.number(),
  description: z.string(),
  flavours: z.string(),
  isInStock: z.boolean(),
  pricesOfAvailableSizes: z.array(z.object({
    size: z.string(),
    price: z.string(),
    msrp: z.string(),
  })),
  // @TODO - DELETE - Unrelated fields
  userName: z.string(),
  userAge: z.number(),
  userEmail: z.string(),
  userAddress: z.string(),
  userPhoneNumber: z.string(),
}).strict();



/**
 * Convert any image format (PNG, JPEG, etc.) to a base64 string.
 */
// export const  convertImageToBase64 = (filePath: string): string => {
//   const ext = path.extname(filePath).toLowerCase();
//   const validExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
//   if (!validExtensions.includes(ext)) {
//     throw new Error(`Unsupported file format: ${ext}`);
//   }
//   const imageBuffer = fs.readFileSync(filePath);
//   return `data:image/${ext.replace('.', '')};base64,${imageBuffer.toString('base64')}`;
// }

// /**
//  * Convert an image to Base64.
//  */
export const convertImageToBase64 = async (
  imagePath: string,
): Promise<string> => {
  try {
    console.log(`Converting image to Base64: ${imagePath}`);
    const imageBuffer = await fs.promises.readFile(imagePath); // Read image file as a buffer
    const ext = imagePath.split('.').pop(); // Get the file extension
    const validExtensions = ['png', 'jpg', 'jpeg', 'gif'];
    if (!validExtensions.includes(ext)) {
      throw new Error(`Unsupported file format: ${ext}`);
    }
    const base64Image = imageBuffer.toString('base64'); // Convert the buffer to a base64 string
    console.log(`Image converted to Base64`);
    return `data:image/${ext};base64,${base64Image}`; // Return as a base64 data URI
  } catch (error) {
    console.error('Error converting image to Base64:', error.message);
    throw new Error('Error converting image to Base64');
  }
};

/**
 * Sends content (either text or image) to OpenAI with dynamic parameters.
 *
 * @param params - Object containing parameters for the OpenAI request.
 */
export const sendToOpenAI = async ({
  apiKey,
  messages,
  model,
  maxTokens,
  temperature,
  retryOptions,
}: SendToOpenAIParams): Promise<string> => {
  console.log('Sending content to OpenAI for processing...');
  const openai = new OpenAI({ apiKey }); // Initialize OpenAI client directly with the passed API key

  /**
   * Sends a chat completion request to OpenAI API with retry functionality
   * @param {Object} options - The options for the chat completion
   * @param {string} options.model - The GPT-4-O model to use
   * @param {Array} options.messages - The messages to send in the chat completion request
   * @param {number} options.maxTokens - The maximum number of tokens for the response
   * @param {number} options.temperature - The sampling temperature (0 for deterministic outputs)
   * @param {Object} retryOptions - The options for retry functionality
   * @returns {string} The generated content from the chat completion response
   */
  return pRetry(async () => {
    const response = await openai.chat.completions.create({
      model, // GPT-4-O model with its token limits
      messages,
      max_tokens: maxTokens, // The max number of tokens for the response
      temperature, // Set to 0 for deterministic outputs
    });
    console.log(
      `[OpenAI] Token usage: ${response.usage?.prompt_tokens} input, ${response.usage?.completion_tokens} output`,
    );
    return response.choices[0].message?.content || '';
  }, retryOptions);
};

// Define and export the type for sendImageToOpenAI parameters
export type SendImageToOpenAIParams = {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  imagePath: string; // Local path of the image file
  // prompt: string;     // Prompt describing what you want extracted
  retryOptions: RetryOptions;
};

/**
 * Insert a string before the file extension.
 */
export const insertBeforeFileExtention = (
  path: string,
  insertion: string,
): string => {
  const extIndex = path.lastIndexOf('.');
  if (extIndex === -1) return `${path}.${insertion}`; // Handle case with no extension
  return `${path.slice(0, extIndex)}.${insertion}${path.slice(extIndex)}`;
};

/**
 * Sends an image to OpenAI for analysis with dynamic parameters.
 */
export const sendImageToOpenAI = async ({
  apiKey,
  imagePath,
  model,
  maxTokens,
  temperature,
  // prompt,
  retryOptions,
}: SendImageToOpenAIParams): Promise<string> => {
  console.log('Sending image to OpenAI for processing...');
  const openai = new OpenAI({ apiKey });

  /**
   * Processes an image through a series of steps including compression, conversion to Base64, and sending to OpenAI for analysis.
   * @param {string} imagePath - The path to the input image file.
   * @param {string} model - The OpenAI model to use for processing.
   * @param {number} temperature - The temperature setting for the OpenAI API call.
   * @param {number} maxTokens - The maximum number of tokens for the OpenAI API response.
   * @param {Object} retryOptions - Options for the pRetry function.
   * @returns {Promise<string>} A promise that resolves to the content of the OpenAI API response, or an empty string if no content is returned.
   */
  return pRetry(async () => {
    // 1. Crop and compress the image
    const compressedImagePath = insertBeforeFileExtention(
      imagePath,
      'compressed',
    );
    await cropAndCompressImage({
      inputPath: imagePath,
      outputPath: compressedImagePath,
      width: 2000,
      height: 768,
      quality: 90,
      format: 'png',
    });

    // 2. Convert the cropped and compressed image to Base64
    const base64Image = await convertImageToBase64(compressedImagePath);

    // 3. Generate the image messages
    const messages = generateImageMessages(base64Image);

    // 4. Send the message to OpenAI and get a structured response
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens, // You can adjust this limit based on the size of the response expected
    });

    // Log token usage and return structured content
    console.log(
      `[OpenAI] Token usage: ${response.usage?.total_tokens} tokens used.`,
    );
    return response.choices[0]?.message?.content || '';
  }, retryOptions);
};
/**
 * Generate text messages for structured extraction.
 *
 * @param content - The actual text (HTML or markdown) to be processed.
 * @returns An array of message objects for the OpenAI API.
 */
export const generateTextMessages = (
  content: string,
): OpenAI.Chat.ChatCompletionCreateParams['messages'] => {
  return [
    {
      role: 'system',
      content: 'You are an AI assistant helping extract structured data.',
    },
    {
      role: 'user',
      content: `Extract the following details about cigars: ${extractionRequirements} Here is the content: ${content}`,
    },
  ];
};

/**
 * Generate image messages for structured extraction.
 *
 * @param base64Image - The base64-encoded string of the image.
 * @returns An array of message objects for the OpenAI API.
 */
export const generateImageMessages = (
  base64Image: string,
): OpenAI.Chat.ChatCompletionCreateParams['messages'] => {
  return [
    {
      role: 'system',
      content: 'You are an AI assistant analyzing images for structured data.',
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Analyze this image and extract the following details: ${extractionRequirements}`,
        },
        { type: 'image_url', image_url: { url: base64Image, detail: 'high' } },
      ],
    },
  ];
};

export type CropAndCompressImageParams = {
  inputPath: string;
  outputPath: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
};

/**
 * Function to crop and compress an image.
 * @param {Object} params - Parameters object
 * @param {string} params.inputPath - Path to the original image file
 * @param {string} params.outputPath - Path to save the cropped and compressed image
 * @param {number} [params.width=2000] - Width to resize the image (default: 2000)
 * @param {number} [params.height=768] - Height to resize the image (default: 768)
 * @param {number} [params.quality=90] - Compression quality (0 to 100, default: 90)
 * @param {string} [params.format='png'] - Image format ('jpeg' or 'png', default: 'png')
 * @returns {Promise<void>}
 */
export const cropAndCompressImage = async ({
  inputPath,
  outputPath,
  width = 2000,
  height = 768,
  quality = 90,
  format = 'png',
}: CropAndCompressImageParams): Promise<void> => {
  console.log(`Cropping and compressing image: ${inputPath}`);
  try {
    let imageProcessor = sharp(inputPath).resize({
      width,
      height,
      fit: sharp.fit.inside, // Maintain aspect ratio, fit inside the box
    });

    if (format === 'jpeg') {
      imageProcessor = imageProcessor.jpeg({ quality });
    } else if (format === 'png') {
      imageProcessor = imageProcessor.png({ quality });
    }

    await imageProcessor.toFile(outputPath);
    console.log(`Image cropped and compressed to ${outputPath}`);
  } catch (error) {
    console.error('Error during cropping/compressing:', error.message);
  }
};

// export const extractionSchema = {
//   type: 'object',
//   properties: {
//     length: {
//       type: 'object',
//       properties: { value: { type: 'number' }, unit: { type: 'string' } },
//     },
//     ringGauge: { type: 'object', properties: { value: { type: 'number' }, unit: { type: 'string' } } },
//     vitola: { type: 'string' },
//     shape: { type: 'string' },
//     wrapper: { type: 'string' },
//     binder: { type: 'string' },
//     filler: { type: 'string' },
//     origin: { type: 'string' },
//     manufacturer: { type: 'string' },
//     brand: { type: 'string' },
//     price: {
//       type: 'array',
//       items: {
//         type: 'object',
//         properties: {
//           currency: { type: 'string' },
//           amount: { type: 'number' },
//           packaging: { type: 'string' },
//           cigarCount: { type: 'number' },
//         },
//         required: ['currency', 'amount'],
//       },
//       required: ['currency', 'amount'],
//     },
//     description: { type: 'string' },
//     isAvailable: { type: 'boolean' },
//     primaryImage: {
//       type: 'object',
//       properties: {
//         url: { type: 'string' },
//         alt: { type: 'string' },
//         description: { type: 'string' },
//       },
//       required: ['url', 'alt'],
//     },
//     images: {
//       type: 'array',
//       items: {
//         type: 'object',
//         properties: {
//           url: { type: 'string' },
//           alt: { type: 'string' },
//           description: { type: 'string' },
//         },
//         required: ['url', 'alt'],
//       },
//       required: ['url', 'alt'],
//     },
//     strength: { type: 'string' },
//     // reviews,
//   },
//   required: [
//     'brand',
//     'price',
//     'description',
//   ],
// };

// Define and export the type for sendImageToOpenAI parameters
export type SendImageAndTextToOpenAIParams = {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  // messages: OpenAI.Chat.ChatCompletionCreateParams['messages'];
  messages: ChatCompletionMessageParam[];
  /**
   * Sends image and text to OpenAI for processing and returns the generated content.
   * @param {Object} options - The options for sending data to OpenAI.
   * @param {string} options.apiKey - The API key for OpenAI.
   * @param {string} [options.model='gpt-4o-2024-08-06'] - The OpenAI model to use.
   * @param {number} [options.maxTokens=4000] - The maximum number of tokens for the response.
   * @param {number} [options.temperature=0] - The temperature setting for response generation.
   * @param {Array} options.messages - The messages to send to OpenAI.
   * @param {Object} options.retryOptions - The options for retrying the API call.
   * @returns {Promise<string>} The generated content from OpenAI.
   */
  // base64Image: string; // Local path of the image file
  retryOptions: RetryOptions;
  // response_format: {
  //   schema: Record<string, unknown>; // The schema for structured data extraction
  //   response_format: string; // "json"
  //   strict: boolean; // true
  // }
};

export const sendImageAndTextToOpenAI = async ({
  apiKey,
  model = 'gpt-4o-2024-08-06',
  maxTokens = 4000,
  temperature = 0,
  messages,
  // base64Image,
  retryOptions,
  // response_format,
}: SendImageAndTextToOpenAIParams): Promise<string> => {
  console.log('Sending image and text to OpenAI for processing...');
  const openai = new OpenAI({ apiKey });

  // Convert the image to base64 using the provided utility function
  // const base64Image = await convertImageToBase64(imagePath);

  /**
   * Sends a chat completion request to OpenAI API with retry functionality
   * @param {Object} options - The options for the OpenAI chat completion request
   * @param {string} options.model - The AI model to use
   * @param {Array} options.messages - The messages to send to the AI
   * @param {number} options.maxTokens - The maximum number of tokens to generate
   * @param {number} options.temperature - The sampling temperature to use
   * @param {Object} options.extractionRequirementsSchema - The schema for response format
   * @param {Object} retryOptions - The options for the retry functionality
   * @returns {string} The content of the AI's response or an empty string if no content
   * @throws {Error} If there's an error sending the request to OpenAI after retries
   */
  return pRetry(async () => {
    try {

      const response = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        response_format: zodResponseFormat(extractionRequirementsSchema, "cigar"),
        // extractionRequirementsSchema
        // response_format,
        // @TODO function call for structured data extraction, response format, and strict adherence do not work.
        // google latest api version and docs
      });

      // help me log out the most interesting response parts to learn open ai api and token limits
      console.log("response", JSON.stringify(response, null, 2));
      console.log("response.usage", JSON.stringify(response.usage, null, 2));
      console.log("response.usage.prompt_tokens", JSON.stringify(response.usage.prompt_tokens, null, 2));
      console.log("response.usage.completion_tokens", JSON.stringify(response.usage.completion_tokens, null, 2));
      console.log("response.usage.total_tokens", JSON.stringify(response.usage.total_tokens, null, 2));
      console.log("response.model", JSON.stringify(response.model, null, 2));

      console.log(
        `[OpenAI] Token usage: ${response.usage?.prompt_tokens} input, ${response.usage?.completion_tokens} output`,
      );

      console.log("xxxx openai message response", JSON.stringify(response.choices[0].message, null, 2));

      return response.choices[0].message?.content || '';
    } catch (error) {
      // @TODO is this really necessary?
      if (error.constructor.name == "LengthFinishReasonError") {
        console.log("OpenAI Error: // Too many tokens (increase maxTokens): ", error.message);
      } else {
        console.log("OpenAI Error: ", error.message);
      }
      throw new Error('Error sending image and text to OpenAI');
    }
  }, retryOptions);
};
