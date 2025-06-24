/**
 * AI-powered data extraction using OpenAI
 *
 * This module handles configurable data extraction from processed content
 * using OpenAI's GPT models with support for text and image inputs.
 */

import OpenAI from 'openai';
import fs from 'node:fs/promises';
import pRetry from 'p-retry';
import type { ChatCompletionMessageParam, ChatCompletionContentPartImage } from 'openai/resources/index.mjs';
import type {
  ProcessedContent,
  ExtractionConfig,
  OpenAIParams,
  ExtractionStrategy
} from '../types/index.js';
import type { CigarExtractionType } from '../types/cigar-schema.js';
import { CIGAR_EXTRACTION_SCHEMA } from '../config/openai-schema.js';
import { getErrorDetails, sanitizeExtractionData } from '../utils/validation.js';
import { sanitizeForLLM } from './processor.js';

/**
 * Extract data from processed content using configurable strategies
 *
 * @param content - Processed content from the processor
 * @param screenshotPath - Path to screenshot file (optional)
 * @param config - Extraction configuration
 * @returns Promise resolving to extracted data
 */
export async function extractData(
  content: ProcessedContent,
  screenshotPath: string | null,
  config: ExtractionConfig
): Promise<CigarExtractionType> {
  try {
    console.log(`Starting data extraction with strategy: ${config.strategy}`);

    // Validate configuration
    validateExtractionConfig(config);

    // Choose content based on strategy
    const textContent = getTextContent(content, config.strategy);

    // Prepare messages based on strategy
    const messages = await prepareMessages(
      textContent,
      screenshotPath,
      config.strategy,
      config.systemPrompt!
    );

    // Prepare OpenAI parameters
    const openaiParams: OpenAIParams = {
      apiKey: process.env.OPENAI_API_KEY!,
      messages,
      model: config.model,
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature || 0,
      retryOptions: config.retryOptions || { retries: 3, minTimeout: 1000, factor: 2 },
    };

    // Extract data with retry logic
    const result = await extractWithRetry(openaiParams);

    console.log('Data extraction completed successfully');
    return result;

  } catch (error) {
    const errorDetails = getErrorDetails(error);
    throw new Error(`Data extraction failed: ${errorDetails.message}`);
  }
}

/**
 * Get appropriate text content based on strategy
 */
function getTextContent(content: ProcessedContent, strategy: ExtractionStrategy): string {
  switch (strategy) {
    case 'html-only':
    case 'html-with-image':
      return sanitizeForLLM(content.cleanedHtml);

    case 'markdown-only':
    case 'markdown-with-image':
      return sanitizeForLLM(content.markdown);

    default:
      throw new Error(`Unknown extraction strategy: ${strategy}`);
  }
}

/**
 * Prepare OpenAI messages based on strategy
 */
async function prepareMessages(
  textContent: string,
  screenshotPath: string | null,
  strategy: ExtractionStrategy,
  systemPrompt: string
): Promise<ChatCompletionMessageParam[]> {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
  ];

  // Prepare user message content
  const userContent: Array<ChatCompletionContentPartImage | { type: 'text'; text: string }> = [];

  // Add image if strategy requires it
  if (strategy.includes('with-image') && screenshotPath) {
    const imageContent = await prepareImageContent(screenshotPath);
    userContent.push(imageContent);
  }

  // Add text content
  userContent.push({
    type: 'text',
    text: `Please extract structured data from the following content:\\n\\n${textContent}`,
  });

  messages.push({
    role: 'user',
    content: userContent,
  });

  return messages;
}

/**
 * Prepare image content for OpenAI
 */
async function prepareImageContent(screenshotPath: string): Promise<ChatCompletionContentPartImage> {
  try {
    const imageBuffer = await fs.readFile(screenshotPath);
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    return {
      type: 'image_url',
      image_url: {
        url: base64Image,
        detail: 'high',
      },
    };

  } catch (error) {
    const errorDetails = getErrorDetails(error);
    throw new Error(`Failed to prepare image content: ${errorDetails.message}`);
  }
}

/**
 * Extract data with retry logic using OpenAI structured outputs
 */
async function extractWithRetry(params: OpenAIParams): Promise<CigarExtractionType> {
  return pRetry(
    async () => {
      const openai = new OpenAI({
        apiKey: params.apiKey,
      });

      console.log(`Making OpenAI API call with model: ${params.model} using structured outputs`);

      // Using stable API instead of beta
      const response = await openai.chat.completions.create({
        model: params.model,
        messages: params.messages,
        max_tokens: params.maxTokens,
        temperature: params.temperature,
        response_format: CIGAR_EXTRACTION_SCHEMA
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI API');
      }

      // Parse the JSON response
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (error) {
        throw new Error(`Failed to parse OpenAI response as JSON: ${error}`);
      }

      console.log(`OpenAI structured extraction successful. Usage: ${JSON.stringify(response.usage)}`);

      // Sanitize data to handle unknown quantity types gracefully
      const sanitizedData = sanitizeExtractionData(parsed);

      // Return the sanitized data - OpenAI structured outputs already enforce the schema
      return sanitizedData as CigarExtractionType;
    },
    params.retryOptions
  );
}

/**
 * Send text-only content to OpenAI
 *
 * @param textContent - Text content to process
 * @param config - Extraction configuration
 * @returns Promise resolving to extracted data
 */
export async function sendTextToOpenAI(
  textContent: string,
  config: ExtractionConfig
): Promise<CigarExtractionType> {
  const sanitizedContent = sanitizeForLLM(textContent);

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: config.systemPrompt!,
    },
    {
      role: 'user',
      content: `Please extract structured data from the following content:\\n\\n${sanitizedContent}`,
    },
  ];

  const openaiParams: OpenAIParams = {
    apiKey: process.env.OPENAI_API_KEY!,
    messages,
    model: config.model,
    maxTokens: config.maxTokens || 4096,
    temperature: config.temperature || 0,
    retryOptions: config.retryOptions || { retries: 3, minTimeout: 1000, factor: 2 },
  };

  return extractWithRetry(openaiParams);
}

/**
 * Send text and image content to OpenAI
 *
 * @param textContent - Text content to process
 * @param screenshotPath - Path to screenshot file
 * @param config - Extraction configuration
 * @returns Promise resolving to extracted data
 */
export async function sendTextAndImageToOpenAI(
  textContent: string,
  screenshotPath: string,
  config: ExtractionConfig
): Promise<CigarExtractionType> {
  const sanitizedContent = sanitizeForLLM(textContent);
  const imageContent = await prepareImageContent(screenshotPath);

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: config.systemPrompt!,
    },
    {
      role: 'user',
      content: [
        imageContent,
        {
          type: 'text',
          text: `Please extract structured data from both the image and the following content:\\n\\n${sanitizedContent}`,
        },
      ],
    },
  ];

  const openaiParams: OpenAIParams = {
    apiKey: process.env.OPENAI_API_KEY!,
    messages,
    model: config.model,
    maxTokens: config.maxTokens || 4096,
    temperature: config.temperature || 0,
    retryOptions: config.retryOptions || { retries: 3, minTimeout: 1000, factor: 2 },
  };

  return extractWithRetry(openaiParams);
}

/**
 * Validate extraction configuration
 */
function validateExtractionConfig(config: ExtractionConfig): void {
  if (!config.strategy) {
    throw new Error('Extraction strategy is required');
  }

  if (!config.model) {
    throw new Error('Model is required');
  }

  if (!config.systemPrompt) {
    throw new Error('System prompt is required');
  }

  const validStrategies: ExtractionStrategy[] = [
    'html-only',
    'markdown-only',
    'html-with-image',
    'markdown-with-image',
  ];

  if (!validStrategies.includes(config.strategy)) {
    throw new Error(`Invalid extraction strategy: ${config.strategy}`);
  }
}

/**
 * Create extraction summary for logging
 */
export function createExtractionSummary(result: unknown, config: ExtractionConfig): string {
  const summary = [
    `Extraction Strategy: ${config.strategy}`,
    `Model: ${config.model}`,
    `Temperature: ${config.temperature}`,
    `Max Tokens: ${config.maxTokens}`,
  ];

  if (typeof result === 'object' && result !== null) {
    const keys = Object.keys(result);
    summary.push(`Extracted Fields: ${keys.length}`);

    if (keys.length > 0) {
      summary.push(`Fields: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
    }
  }

  return summary.join('\\n');
}
