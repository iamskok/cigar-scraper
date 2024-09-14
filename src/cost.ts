// gpt4o-vision.ts
/**
 * Configuration for GPT-4-O model, pricing dated to September 9, 2024.
 * Pricing link: https://openai.com/api/pricing
 */
export const GPT_4O_CONFIG = {
  modelName: 'gpt-4o',
  inputTokenCostPerMillion: 2.50,  // $2.50 per million input tokens
  outputTokenCostPerMillion: 7.50,  // $7.50 per million output tokens
  date: '2024-09-09',
  pricingLink: 'https://openai.com/api/pricing',
};

export const MODEL_PRICING_CONFIG = {
  'gpt-4o': GPT_4O_CONFIG,
  'gpt-4o-2024-08-06': GPT_4O_CONFIG,
};

/**
 * Type for Vision Pricing and Calculation Parameters
 */
export type VisionPricingParams = {
  width: number;  // Image width in pixels
  height: number;  // Image height in pixels
};

/**
 * Type for Cost Calculation Result
 */
export type CostResult = {
  totalTokens: number;
  totalPrice: number;
};

/**
 * GPT-4-O Vision Pricing Module
 * - Throws an error if an unsupported model is provided.
 * - Calculates the token usage and pricing for image analysis.
 */
export class Gpt4oVision {
  model: string;

  constructor(model: string) {
    if (model !== MODEL_PRICING_CONFIG[model].modelName) {
      throw new Error(`Unsupported model: ${model}.`);
    }
    this.model = model;
  }

  /**
   * Calculates the token usage and cost for an image based on its resolution
   * and the number of 512x512 tiles it will be resized into.
   *
   * - Input tokens: $2.50 per 1M tokens
   * - Output tokens: $7.50 per 1M tokens
   * - High-res images typically use 4 to 8 tiles depending on resolution.
   *
   * @param params - VisionPricingParams: Contains width and height of the image
   * @returns The total tokens and total cost for the image request
   */
  calculateVisionCost({ width, height }: VisionPricingParams): CostResult {
    // Image resizing logic based on OpenAI's tiling system (resizing to 768x1344 if larger)
    const resizedWidth = Math.min(width, 768);
    const resizedHeight = Math.min(height, 1344);  // Resized height reference: https://openai.com/api/pricing

    // Calculate the number of tiles (512x512)
    const tilesX = Math.ceil(resizedWidth / 512);
    const tilesY = Math.ceil(resizedHeight / 512);
    const totalTiles = Math.max(4, Math.min(8, tilesX * tilesY));  // Ensures 4-8 tiles are used

    // Base token count and token count per tile
    const baseTokens = 85;
    const tokensPerTile = 170;
    const tileTokens = tokensPerTile * totalTiles;

    // Total tokens used for the request
    const totalTokens = baseTokens + tileTokens;

    // Pricing logic (input tokens for image processing)
    const totalPrice = (totalTokens / 1_000_000) * MODEL_PRICING_CONFIG[this.model].inputTokenCostPerMillion;

    return { totalTokens, totalPrice };
  }
}

// Example usage:

const gpt4oVision = new Gpt4oVision('gpt-4o');
gpt4oVision.processImageWithCostLogging(
  'Extract objects, colors, and context from the image.',
  'data:image/png;base64,...',  // Your base64 image
  { width: 2400, height: 4200 }
);
