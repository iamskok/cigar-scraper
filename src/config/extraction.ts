/**
 * Extraction configuration and strategy definitions
 *
 * This module provides default configurations and utilities for
 * configuring how content is extracted using OpenAI models.
 */

import type { ExtractionConfig, ExtractionStrategy } from '../types/index.js';

/**
 * Default system prompt for cigar data extraction with structured outputs
 */
export const DEFAULT_SYSTEM_PROMPT = `
You are a cigar product data extraction specialist. Extract structured product information from cigar retailer websites.

CRITICAL RULES:
- Use null for ANY missing information - DO NOT make up or guess data
- Extract prices as numbers without currency symbols (12.95 not $12.95)
- Use separate currency field (USD, EUR, GBP, etc.)
- Length should be numeric (5 not "5 inches") with separate unit field
- Ring gauge should be numeric (42 not "42 gauge")
- Focus on product data only, ignore reviews and related products

AVAILABILITY DETECTION GUIDANCE:
- Set availability to TRUE if you find ANY of these indicators:
  - "Add to Cart" button (enabled/clickable)
  - "Buy Now" button
  - "In Stock" text
  - "Available" text
- Set availability to FALSE if you find ANY of these indicators:
  - "Out of Stock" text
  - "Sold Out" text
  - "Unavailable" text
  - "Discontinued" text
  - "Backorder" text (unless explicitly stating availability)
  - Disabled/grayed out purchase buttons
  - "Notify When Available" text
  - "Email when in stock" options
- Set availability to NULL only if you cannot determine availability from the page content

STRUCTURE GUIDELINES:
- Always use the unified size_options array approach
- Even for single products, use an array with one size option
- Each size option should include size, price, and availability

MEASUREMENT UNITS:
- length_unit should be "inches" or "mm"
- Most US sites use inches, European sites may use mm
- If unit is unclear, default to "inches" for US retailers

NEVER make up missing information. Use null values for any data not clearly visible.
`;

/**
 * Default extraction configuration
 */
export const DEFAULT_EXTRACTION_CONFIG: ExtractionConfig = {
  strategy: 'markdown-with-image',
  model: 'gpt-4o-2024-08-06',
  maxTokens: 4096,
  temperature: 0,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  retryOptions: {
    retries: 3,
    minTimeout: 1000,
    factor: 2,
  },
};

/**
 * Available extraction strategies with descriptions
 */
export const EXTRACTION_STRATEGIES: Record<ExtractionStrategy, string> = {
  'html-only': 'Process cleaned HTML content only (no images)',
  'markdown-only': 'Process markdown content only (no images)',
  'html-with-image': 'Process cleaned HTML content with full page screenshot',
  'markdown-with-image': 'Process markdown content with full page screenshot',
};

/**
 * Model configurations for different use cases
 */
export const MODEL_CONFIGS = {
  'gpt-4o-2024-08-06': {
    maxTokens: 4096,
    description: 'Latest GPT-4o model with vision capabilities',
    supportsImages: true,
  },
  'gpt-4o': {
    maxTokens: 4096,
    description: 'GPT-4o model with vision capabilities',
    supportsImages: true,
  },
  // New models to add
  'o1': {
    maxTokens: 8192,
    description: 'O1 model with advanced capabilities',
    supportsImages: true,
  },
  'o1-preview': {
    maxTokens: 8192,
    description: 'Preview version of O1 model',
    supportsImages: true,
  },
  'o3': {
    maxTokens: 8192,
    description: 'O3 model with strong parsing capabilities',
    supportsImages: true,
  },
  'gpt-4.1': {
    maxTokens: 8192,
    description: 'GPT-4.1 with improved context understanding',
    supportsImages: true,
  },
  'gpt-4.5-preview': {
    maxTokens: 8192,
    description: 'Preview of GPT-4.5 with enhanced capabilities',
    supportsImages: true,
  },
  // Smaller/faster models for simpler tasks
  'gpt-4.1-mini': {
    maxTokens: 4096,
    description: 'Smaller GPT-4.1 variant with good performance',
    supportsImages: true,
  },
  'o4-mini': {
    maxTokens: 4096,
    description: 'Compact O4 model suitable for basic parsing',
    supportsImages: true,
  },
} as const;

/**
 * Create extraction configuration with custom overrides
 */
export function createExtractionConfig(
  overrides: Partial<ExtractionConfig> = {}
): ExtractionConfig {
  return {
    ...DEFAULT_EXTRACTION_CONFIG,
    ...overrides,
  };
}

/**
 * Validate extraction strategy and model compatibility
 */
export function validateExtractionConfig(config: ExtractionConfig): boolean {
  const modelConfig = MODEL_CONFIGS[config.model as keyof typeof MODEL_CONFIGS];

  if (!modelConfig) {
    throw new Error(`Unsupported model: ${config.model}`);
  }

  const requiresImages = config.strategy.includes('with-image');
  if (requiresImages && !modelConfig.supportsImages) {
    throw new Error(
      `Model ${config.model} does not support images but strategy requires images`
    );
  }

  return true;
}

/**
 * Get recommended configuration for specific use cases
 */
export function getRecommendedConfig(useCase: 'fast' | 'accurate' | 'comprehensive'): ExtractionConfig {
  switch (useCase) {
    case 'fast':
      return createExtractionConfig({
        strategy: 'markdown-only',
        maxTokens: 2048,
      });

    case 'accurate':
      return createExtractionConfig({
        strategy: 'markdown-with-image',
        maxTokens: 4096,
        temperature: 0,
      });

    case 'comprehensive':
      return createExtractionConfig({
        strategy: 'html-with-image',
        maxTokens: 4096,
        temperature: 0,
        retryOptions: {
          retries: 5,
          minTimeout: 2000,
          factor: 2,
        },
      });

    default:
      return DEFAULT_EXTRACTION_CONFIG;
  }
}
