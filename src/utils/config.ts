/**
 * Configuration loader for YAML-based configuration
 *
 * This module handles loading and parsing of the main configuration file
 * and provides typed access to configuration values.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { ExtractionConfig, CleanHTMLOptions, ProcessOptions, ExtractionStrategy } from '../types/index.js';

/**
 * Complete configuration structure
 */
export interface AppConfig {
  openai: {
    default_model: string;
    models: Record<string, {
      max_tokens: number;
      description: string;
      supports_images: boolean;
    }>;
    extraction: {
      max_tokens: number;
      temperature: number;
      retry_options: {
        retries: number;
        min_timeout: number;
        factor: number;
      };
    };
  };
  extraction_strategies: Record<string, {
    description: string;
  }>;
  default_extraction_config: {
    strategy: string;
    model: string;
    max_tokens: number;
    temperature: number;
  };
  preset_configs: Record<string, {
    strategy: string;
    model: string;
    max_tokens: number;
    temperature: number;
    retry_options?: {
      retries: number;
      min_timeout: number;
      factor: number;
    };
  }>;
  html_processing: {
    default_clean_options: {
      remove_scripts: boolean;
      remove_styles: boolean;
      remove_ads: boolean;
      remove_hidden_elements: boolean;
      remove_inline_handlers: boolean;
      remove_inline_styles: boolean;
      remove_src_attributes: boolean;
      remove_href_attributes: boolean;
      remove_iframes: boolean;
      remove_header_layout: boolean;
      remove_footer_layout: boolean;
      remove_base64: boolean;
      base64_threshold: number;
      remove_schema_markup: boolean;
      remove_og_markup: boolean;
      remove_twitter_markup: boolean;
      remove_jsonld_markup: boolean;
      remove_comments: boolean;
      remove_empty_elements: boolean;
      remove_social_widgets: boolean;
      remove_cookie_notices: boolean;
    };
    default_process_options: {
      use_markdown: boolean;
    };
  };
  system_prompts: {
    default: string;
  };
  default_output_directory: string;
}

/**
 * Cached configuration instance
 */
let cachedConfig: AppConfig | null = null;

/**
 * Load configuration from YAML file
 */
export function loadConfig(configPath?: string): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const defaultConfigPath = path.join(process.cwd(), 'config.yaml');
  const finalConfigPath = configPath || defaultConfigPath;

  try {
    const configFile = fs.readFileSync(finalConfigPath, 'utf8');
    const config = yaml.load(configFile) as AppConfig;

    // Validate required sections
    validateConfig(config);

    cachedConfig = config;
    return config;
  } catch (error) {
    throw new Error(`Failed to load configuration from ${finalConfigPath}: ${error}`);
  }
}

/**
 * Get extraction configuration from YAML config
 */
export function getExtractionConfig(preset?: string): ExtractionConfig {
  const config = loadConfig();

  let extractionConfig;
  if (preset && config.preset_configs[preset]) {
    extractionConfig = config.preset_configs[preset];
  } else {
    extractionConfig = config.default_extraction_config;
  }

  return {
    strategy: extractionConfig.strategy as ExtractionStrategy,
    model: extractionConfig.model,
    maxTokens: extractionConfig.max_tokens,
    temperature: extractionConfig.temperature,
    systemPrompt: config.system_prompts.default,
    retryOptions: extractionConfig.retry_options || config.openai.extraction.retry_options,
  };
}

/**
 * Get HTML processing options from YAML config
 */
export function getHtmlProcessingOptions(): {
  cleanOptions: CleanHTMLOptions;
  processOptions: ProcessOptions;
} {
  const config = loadConfig();

  return {
    cleanOptions: {
      removeScripts: config.html_processing.default_clean_options.remove_scripts,
      removeStyles: config.html_processing.default_clean_options.remove_styles,
      removeAds: config.html_processing.default_clean_options.remove_ads,
      removeHiddenElements: config.html_processing.default_clean_options.remove_hidden_elements,
      removeInlineHandlers: config.html_processing.default_clean_options.remove_inline_handlers,
      removeInlineStyles: config.html_processing.default_clean_options.remove_inline_styles,
      removeSrcAttributes: config.html_processing.default_clean_options.remove_src_attributes,
      removeHrefAttributes: config.html_processing.default_clean_options.remove_href_attributes,
      removeIframes: config.html_processing.default_clean_options.remove_iframes,
      removeHeaderLayout: config.html_processing.default_clean_options.remove_header_layout,
      removeFooterLayout: config.html_processing.default_clean_options.remove_footer_layout,
      removeBase64: config.html_processing.default_clean_options.remove_base64,
      base64Threshold: config.html_processing.default_clean_options.base64_threshold,
      removeSchemaMarkup: config.html_processing.default_clean_options.remove_schema_markup,
      removeOGMarkup: config.html_processing.default_clean_options.remove_og_markup,
      removeTwitterMarkup: config.html_processing.default_clean_options.remove_twitter_markup,
      removeJSONLDMarkup: config.html_processing.default_clean_options.remove_jsonld_markup,
      removeComments: config.html_processing.default_clean_options.remove_comments,
      removeEmptyElements: config.html_processing.default_clean_options.remove_empty_elements,
      removeSocialWidgets: config.html_processing.default_clean_options.remove_social_widgets,
      removeCookieNotices: config.html_processing.default_clean_options.remove_cookie_notices,
    },
    processOptions: {
      useMarkdown: config.html_processing.default_process_options.use_markdown,
    },
  };
}

/**
 * Get model configuration
 */
export function getModelConfig(model: string): { max_tokens: number; description: string; supports_images: boolean } {
  const config = loadConfig();

  // For now, just return default values since we only support the default model
  if (model !== config.openai.default_model) {
    throw new Error(`Unsupported model: ${model}. Only ${config.openai.default_model} is supported.`);
  }

  return {
    max_tokens: config.openai.extraction.max_tokens,
    description: "Default model",
    supports_images: true, // Assume default model supports images
  };
}

/**
 * Get system prompt
 */
export function getSystemPrompt(promptName = 'default'): string {
  const config = loadConfig();
  return config.system_prompts[promptName] || config.system_prompts.default;
}

/**
 * Get default output directory
 */
export function getDefaultOutputDirectory(): string {
  const config = loadConfig();
  return config.default_output_directory || './data';
}

/**
 * Reset cached configuration (useful for testing)
 */
export function resetConfigCache(): void {
  cachedConfig = null;
}

/**
 * Validate configuration structure
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateConfig(config: Record<string, any>): void {
  const requiredSections = [
    'openai',
    'extraction_strategies',
    'default_extraction_config',
    'preset_configs',
    'html_processing',
    'system_prompts'
  ];

  for (const section of requiredSections) {
    if (!config[section]) {
      throw new Error(`Missing required configuration section: ${section}`);
    }
  }

  // Validate specific subsections
  if (!config.openai.extraction) {
    throw new Error('Invalid OpenAI configuration structure');
  }

  if (!config.html_processing.default_clean_options || !config.html_processing.default_process_options) {
    throw new Error('Invalid HTML processing configuration structure');
  }

  if (!config.system_prompts.default) {
    throw new Error('Missing default system prompt');
  }
}
