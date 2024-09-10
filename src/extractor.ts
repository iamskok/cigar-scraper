import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import pRetry, { Options as RetryOptions } from 'p-retry';
import sharp from 'sharp';

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
export const convertImageToBase64 = async (imagePath: string): Promise<string> => {
  const imageBuffer = await fs.promises.readFile(imagePath); // Read image file as a buffer
  const ext = imagePath.split('.').pop(); // Get the file extension
  const validExtensions = ['png', 'jpg', 'jpeg', 'gif'];
  if (!validExtensions.includes(ext)) {
    throw new Error(`Unsupported file format: ${ext}`);
  }
  const base64Image = imageBuffer.toString('base64'); // Convert the buffer to a base64 string
  return `data:image/${ext};base64,${base64Image}`; // Return as a base64 data URI
};

/**
 * Sends content (either text or image) to OpenAI with dynamic parameters.
 *
 * @param params - Object containing parameters for the OpenAI request.
 */
export const sendToOpenAI = async ({ apiKey, messages, model, maxTokens, temperature, retryOptions }: SendToOpenAIParams): Promise<string> => {
  const openai = new OpenAI({ apiKey });  // Initialize OpenAI client directly with the passed API key

  return pRetry(
    async () => {
      const response = await openai.chat.completions.create({
        model, // GPT-4-O model with its token limits
        messages,
        max_tokens: maxTokens, // The max number of tokens for the response
        temperature, // Set to 0 for deterministic outputs
      });
      console.log(`[OpenAI] Token usage: ${response.usage?.prompt_tokens} input, ${response.usage?.completion_tokens} output`);
      return response.choices[0].message?.content || '';
    },
    retryOptions
  );
}

// Define and export the type for sendImageToOpenAI parameters
export type SendImageToOpenAIParams = {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  imagePath: string;  // Local path of the image file
  // prompt: string;     // Prompt describing what you want extracted
  retryOptions: RetryOptions;
};

/**
 * Insert a string before the file extension.
 */
export const insertBeforeFileExtention = (path: string, insertion: string): string => {
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
  // prompt,
  retryOptions,
}: SendImageToOpenAIParams): Promise<string> => {
  const openai = new OpenAI({ apiKey });

  return pRetry(
    async () => {
      // 1. Crop and compress the image
      const compressedImagePath = insertBeforeFileExtention(imagePath, 'compressed');
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
        max_tokens: 1000, // You can adjust this limit based on the size of the response expected
      });

      // Log token usage and return structured content
      console.log(`[OpenAI] Token usage: ${response.usage?.total_tokens} tokens used.`);
      return response.choices[0]?.message?.content || '';
    },
    retryOptions
  );
};
/**
 * Generate text messages for structured extraction.
 *
 * @param content - The actual text (HTML or markdown) to be processed.
 * @returns An array of message objects for the OpenAI API.
 */
export const generateTextMessages = (content: string): OpenAI.Chat.ChatCompletionCreateParams['messages'] => {
  return [
    { role: 'system', content: 'You are an AI assistant helping extract structured data.' },
    {
      role: 'user',
      content: `Extract the following details about cigars: ${extractionRequirements} Here is the content: ${content}`
    },
  ];
}

/**
 * Generate image messages for structured extraction.
 *
 * @param base64Image - The base64-encoded string of the image.
 * @returns An array of message objects for the OpenAI API.
 */
export const generateImageMessages = (base64Image: string): OpenAI.Chat.ChatCompletionCreateParams['messages'] => {
  return [
    { role: 'system', content: 'You are an AI assistant analyzing images for structured data.' },
    {
      role: 'user',
      content: [
        { type: 'text', text: `Analyze this image and extract the following details: ${extractionRequirements}` },
        { type: 'image_url', image_url: { url: base64Image } },
      ],
    },
  ];
}

export type CropAndCompressImageParams = {
  inputPath: string;
  outputPath: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

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
