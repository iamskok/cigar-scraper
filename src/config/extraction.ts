/**
 * Extraction configuration and strategy definitions
 *
 * This module provides configuration utilities that now load from YAML config.
 * The primary configuration is now stored in config.yaml at the project root.
 */

import type { ExtractionConfig, ExtractionStrategy } from '../types/index.js';
import { loadConfig, getExtractionConfig, getSystemPrompt } from '../utils/config.js';

/**
 * Get default system prompt (now loaded from YAML)
 */
export function getDefaultSystemPrompt(): string {
  return getSystemPrompt('default');
}

/**
 * Get default extraction configuration (now loaded from YAML)
 */
export function getDefaultExtractionConfig(): ExtractionConfig {
  return getExtractionConfig();
}

/**
 * Available extraction strategies with descriptions (now loaded from YAML)
 */
export function getExtractionStrategies(): Record<ExtractionStrategy, string> {
  const config = loadConfig();
  const strategies: Record<ExtractionStrategy, string> = {} as Record<ExtractionStrategy, string>;

  for (const [key, value] of Object.entries(config.extraction_strategies)) {
    strategies[key as ExtractionStrategy] = value.description;
  }

  return strategies;
}

/**
 * Model configurations for different use cases (simplified)
 */
export function getModelConfigs(): Record<string, { max_tokens: number; description: string; supports_images: boolean }> {
  const config = loadConfig();

  // Return just the default model config
  return {
    [config.openai.default_model]: {
      max_tokens: config.openai.extraction.max_tokens,
      description: "Default model",
      supports_images: true,
    }
  };
}

/**
 * Create extraction configuration with custom overrides
 */
export function createExtractionConfig(
  preset?: string,
  overrides: Partial<ExtractionConfig> = {}
): ExtractionConfig {
  const baseConfig = getExtractionConfig(preset);
  return {
    ...baseConfig,
    ...overrides,
  };
}

/**
 * Validate extraction strategy and model compatibility
 */
export function validateExtractionConfig(config: ExtractionConfig): boolean {
  const modelConfigs = getModelConfigs();
  const modelConfig = modelConfigs[config.model];

  if (!modelConfig) {
    throw new Error(`Unsupported model: ${config.model}`);
  }

  const requiresImages = config.strategy.includes('with-image');
  if (requiresImages && !modelConfig.supports_images) {
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
  return getExtractionConfig(useCase);
}

// Legacy exports for backward compatibility
export const DEFAULT_SYSTEM_PROMPT = getDefaultSystemPrompt();
export const DEFAULT_EXTRACTION_CONFIG = getDefaultExtractionConfig();
export const EXTRACTION_STRATEGIES = getExtractionStrategies();
export const MODEL_CONFIGS = getModelConfigs();
