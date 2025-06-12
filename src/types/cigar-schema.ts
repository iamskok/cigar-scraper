/**
 * Zod schemas for cigar data extraction with OpenAI structured outputs
 *
 * This module defines the structured data schemas for reliable
 * cigar product information extraction.
 */

import { z } from 'zod';

/**
 * Size schema with measurement units
 */
export const SizeSchema = z.object({
  length: z.number().nullable().describe("Exact length measurement of the cigar as a decimal number (e.g., 5.5, 6.25). Extract from size strings like '5 1/2 x 42' or '6.25 x 50'. Set to null if not found."),
  length_unit: z.enum(['inches', 'mm']).nullable().describe("Unit of measurement for the length. Use 'inches' for US cigars (most common), 'mm' for European measurements. Default to 'inches' if unit is unclear but length is provided."),
  ring_gauge: z.number().nullable().describe("Ring gauge measurement as a whole number (e.g., 42, 50, 54). This is the diameter measurement. Extract from size strings like '5 x 42' where 42 is the ring gauge. Set to null if not found."),
  display: z.string().nullable().describe("Original size display format exactly as shown on the website (e.g., '5 1/2 x 42', '6.25 x 50', 'Robusto'). Keep the exact formatting including fractions and spacing.")
});

/**
 * Price schema with quantity and separate currency field
 */
export const PriceSchema = z.object({
  current_price: z.number().nullable().describe("Current selling price as a decimal number WITHOUT currency symbols (e.g., 12.99, 150.00). Extract from prices like '$12.99' → 12.99 or '€15.50' → 15.50. Set to null if price not available."),
  msrp: z.number().nullable().describe("Manufacturer's Suggested Retail Price (MSRP) as a decimal number WITHOUT currency symbols. Often labeled as 'MSRP', 'List Price', or 'Retail Price'. Set to null if not shown."),
  savings: z.number().nullable().describe("Dollar amount saved from MSRP as a decimal number WITHOUT currency symbols. Calculate as (MSRP - current_price) or extract from 'You Save' text. Set to null if no savings shown."),
  currency: z.string().nullable().describe("Currency code in standard 3-letter format (USD, EUR, GBP, CAD). Extract from currency symbols: $ = USD, € = EUR, £ = GBP. Default to 'USD' for US websites if currency symbol is $."),
  quantity: z.number().nullable().describe("Number of cigars included at this price (e.g., 1, 5, 20, 25). Extract from quantity indicators like 'Single', '5-Pack', 'Box of 20'. Set to 1 for single cigars, or null if unclear."),
  quantity_type: z.enum(['single', 'pack', 'box', 'bundle', 'sampler']).nullable().describe("Type of quantity packaging: 'single' for individual cigars, 'pack' for small quantities (2-10), 'box' for standard boxes (10-25), 'bundle' for bulk packaging, 'sampler' for variety packs.")
});

/**
 * Specifications schema with all tobacco details
 */
export const SpecificationsSchema = z.object({
  strength: z.string().nullable().describe("Cigar strength level exactly as stated (e.g., 'Mild', 'Medium', 'Full', 'Medium-Full', 'Mild to Medium'). Look for strength indicators in product details, specifications, or descriptions. Set to null if not specified."),
  wrapper: z.string().nullable().describe("Wrapper tobacco type and origin exactly as described (e.g., 'Connecticut Shade', 'Ecuadorian Habano', 'Nicaraguan Corojo'). Include both tobacco type and country/region when available. Set to null if not specified."),
  binder: z.string().nullable().describe("Binder tobacco type and origin exactly as described (e.g., 'Nicaraguan', 'Dominican', 'Ecuadorian Sumatra'). Include both tobacco type and country/region when available. Set to null if not specified."),
  filler: z.string().nullable().describe("Filler tobacco blend exactly as described (e.g., 'Nicaraguan and Dominican', 'Ligero and Viso from Nicaragua'). Include all mentioned origins and tobacco types. Set to null if not specified."),
  origin: z.string().nullable().describe("Country where the cigar is manufactured (e.g., 'Nicaragua', 'Dominican Republic', 'Honduras'). Look for 'Made in' or 'Country of Origin' information. Set to null if not specified."),
  manufacturer: z.string().nullable().describe("Company that physically manufactures the cigars (e.g., 'Plasencia', 'General Cigar', 'Drew Estate'). This may be different from the brand. Set to null if not specified."),
  blender: z.string().nullable().describe("Person or entity responsible for creating the cigar blend (e.g., 'AJ Fernandez', 'Steve Saka', 'Drew Estate'). Sometimes the same as manufacturer. Set to null if not specified.")
});

/**
 * Size and pricing option schema (replaces the confusing single vs multiple approach)
 */
export const SizePricingOptionSchema = z.object({
  size: SizeSchema,
  price: PriceSchema,
  availability: z.string().nullable().describe("Stock status for this specific option (e.g., 'In Stock', 'Out of Stock', 'Limited', 'Backorder'). Set to null if not specified.")
});

/**
 * Individual cigar product schema with simplified array-based approach
 */
export const CigarProductSchema = z.object({
  product_name: z.string().nullable().describe("Exact product name as displayed on the page. For single cigars, use the full name (e.g., 'Highclere Castle Edwardian'). For search results, use individual product names. Set to null only if completely unavailable."),
  brand: z.string().nullable().describe("Brand or manufacturer name (e.g., 'Foundation', 'Davidoff', 'Romeo y Julieta'). Extract from product titles, brand sections, or manufacturer information. Set to null if not identifiable."),
  description: z.string().nullable().describe("Product description or summary text from the page. Include flavor notes, background information, or marketing copy when available. Set to null if no description found."),
  specifications: SpecificationsSchema,

  // Simplified: always use an array of size/price options
  size_options: z.array(SizePricingOptionSchema).describe("Array of available size and pricing combinations. Even for single-size products, use an array with one element. Each element contains size info, pricing, and availability for that specific option.")
});

/**
 * Unified flexible extraction schema that handles all page types
 */
export const CigarExtractionSchema = z.object({
  page_type: z.enum(['single_product', 'multiple_products', 'search_results', 'category_listing']).describe("Type of page being scraped: 'single_product' for individual cigar product pages (regardless of size options), 'multiple_products' for product category pages, 'search_results' for search result pages, 'category_listing' for brand or category overview pages"),

  products: z.array(CigarProductSchema).describe("Array of cigar products found on the page. For single product pages, this will contain one item. For search results or category pages, this will contain multiple items. Always return an array, even for single products.")
});

/**
 * Type definitions derived from schemas
 */
export type SizeType = z.infer<typeof SizeSchema>;
export type PriceType = z.infer<typeof PriceSchema>;
export type SpecificationsType = z.infer<typeof SpecificationsSchema>;
export type SizePricingOptionType = z.infer<typeof SizePricingOptionSchema>;
export type CigarProductType = z.infer<typeof CigarProductSchema>;
export type CigarExtractionType = z.infer<typeof CigarExtractionSchema>;

/**
 * Convert Zod schema to OpenAI function schema format
 */
export function getOpenAIFunctionSchema(): {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: boolean;
  };
} {
  return {
    name: "extract_cigar_data",
    description: "Extract structured cigar product information from webpage content",
    parameters: {
      type: "object",
      properties: {
        page_type: {
          type: "string",
          enum: ["single_product", "multiple_products", "search_results", "category_listing"],
          description: "Type of page being scraped: 'single_product' for individual cigar product pages (regardless of size options), 'multiple_products' for product category pages, 'search_results' for search result pages, 'category_listing' for brand or category overview pages"
        },
        products: {
          type: "array",
          description: "Array of cigar products found on the page. For single product pages, this will contain one item. For search results or category pages, this will contain multiple items. Always return an array, even for single products.",
          items: {
            type: "object",
            properties: {
              product_name: {
                type: ["string", "null"],
                description: "Exact product name as displayed on the page. For single cigars, use the full name (e.g., 'Highclere Castle Edwardian'). For search results, use individual product names. Set to null only if completely unavailable."
              },
              brand: {
                type: ["string", "null"],
                description: "Brand or manufacturer name (e.g., 'Foundation', 'Davidoff', 'Romeo y Julieta'). Extract from product titles, brand sections, or manufacturer information. Set to null if not identifiable."
              },
              description: {
                type: ["string", "null"],
                description: "Product description or summary text from the page. Include flavor notes, background information, or marketing copy when available. Set to null if no description found."
              },
              specifications: {
                type: "object",
                properties: {
                  strength: {
                    type: ["string", "null"],
                    description: "Cigar strength level exactly as stated (e.g., 'Mild', 'Medium', 'Full', 'Medium-Full', 'Mild to Medium'). Look for strength indicators in product details, specifications, or descriptions. Set to null if not specified."
                  },
                  wrapper: {
                    type: ["string", "null"],
                    description: "Wrapper tobacco type and origin exactly as described (e.g., 'Connecticut Shade', 'Ecuadorian Habano', 'Nicaraguan Corojo'). Include both tobacco type and country/region when available. Set to null if not specified."
                  },
                  binder: {
                    type: ["string", "null"],
                    description: "Binder tobacco type and origin exactly as described (e.g., 'Nicaraguan', 'Dominican', 'Ecuadorian Sumatra'). Include both tobacco type and country/region when available. Set to null if not specified."
                  },
                  filler: {
                    type: ["string", "null"],
                    description: "Filler tobacco blend exactly as described (e.g., 'Nicaraguan and Dominican', 'Ligero and Viso from Nicaragua'). Include all mentioned origins and tobacco types. Set to null if not specified."
                  },
                  origin: {
                    type: ["string", "null"],
                    description: "Country where the cigar is manufactured (e.g., 'Nicaragua', 'Dominican Republic', 'Honduras'). Look for 'Made in' or 'Country of Origin' information. Set to null if not specified."
                  },
                  manufacturer: {
                    type: ["string", "null"],
                    description: "Company that physically manufactures the cigars (e.g., 'Plasencia', 'General Cigar', 'Drew Estate'). This may be different from the brand. Set to null if not specified."
                  },
                  blender: {
                    type: ["string", "null"],
                    description: "Person or entity responsible for creating the cigar blend (e.g., 'AJ Fernandez', 'Steve Saka', 'Drew Estate'). Sometimes the same as manufacturer. Set to null if not specified."
                  }
                },
                required: ["strength", "wrapper", "binder", "filler", "origin", "manufacturer", "blender"],
                additionalProperties: false
              },
              size_options: {
                type: "array",
                description: "Array of available size and pricing combinations. Even for single-size products, use an array with one element. Each element contains size info, pricing, and availability for that specific option.",
                items: {
                  type: "object",
                  properties: {
                    size: {
                      type: "object",
                      properties: {
                        length: {
                          type: ["number", "null"],
                          description: "Exact length measurement of the cigar as a decimal number (e.g., 5.5, 6.25). Extract from size strings like '5 1/2 x 42' or '6.25 x 50'. Set to null if not found."
                        },
                        length_unit: {
                          type: ["string", "null"],
                          enum: ["inches", "mm", null],
                          description: "Unit of measurement for the length. Use 'inches' for US cigars (most common), 'mm' for European measurements. Default to 'inches' if unit is unclear but length is provided."
                        },
                        ring_gauge: {
                          type: ["number", "null"],
                          description: "Ring gauge measurement as a whole number (e.g., 42, 50, 54). This is the diameter measurement. Extract from size strings like '5 x 42' where 42 is the ring gauge. Set to null if not found."
                        },
                        display: {
                          type: ["string", "null"],
                          description: "Original size display format exactly as shown on the website (e.g., '5 1/2 x 42', '6.25 x 50', 'Robusto'). Keep the exact formatting including fractions and spacing."
                        }
                      },
                      required: ["length", "length_unit", "ring_gauge", "display"],
                      additionalProperties: false
                    },
                    price: {
                      type: "object",
                      properties: {
                        current_price: {
                          type: ["number", "null"],
                          description: "Current selling price as a decimal number WITHOUT currency symbols (e.g., 12.99, 150.00). Extract from prices like '$12.99' → 12.99 or '€15.50' → 15.50. Set to null if price not available."
                        },
                        msrp: {
                          type: ["number", "null"],
                          description: "Manufacturer's Suggested Retail Price (MSRP) as a decimal number WITHOUT currency symbols. Often labeled as 'MSRP', 'List Price', or 'Retail Price'. Set to null if not shown."
                        },
                        savings: {
                          type: ["number", "null"],
                          description: "Dollar amount saved from MSRP as a decimal number WITHOUT currency symbols. Calculate as (MSRP - current_price) or extract from 'You Save' text. Set to null if no savings shown."
                        },
                        currency: {
                          type: ["string", "null"],
                          description: "Currency code in standard 3-letter format (USD, EUR, GBP, CAD). Extract from currency symbols: $ = USD, € = EUR, £ = GBP. Default to 'USD' for US websites if currency symbol is $."
                        },
                        quantity: {
                          type: ["number", "null"],
                          description: "Number of cigars included at this price (e.g., 1, 5, 20, 25). Extract from quantity indicators like 'Single', '5-Pack', 'Box of 20'. Set to 1 for single cigars, or null if unclear."
                        },
                        quantity_type: {
                          type: ["string", "null"],
                          enum: ["single", "pack", "box", "bundle", "sampler", null],
                          description: "Type of quantity packaging: 'single' for individual cigars, 'pack' for small quantities (2-10), 'box' for standard boxes (10-25), 'bundle' for bulk packaging, 'sampler' for variety packs."
                        }
                      },
                      required: ["current_price", "msrp", "savings", "currency", "quantity", "quantity_type"],
                      additionalProperties: false
                    },
                    availability: {
                      type: ["string", "null"],
                      description: "Stock status for this specific option (e.g., 'In Stock', 'Out of Stock', 'Limited', 'Backorder'). Set to null if not specified."
                    }
                  },
                  required: ["size", "price", "availability"],
                  additionalProperties: false
                }
              }
            },
            required: ["product_name", "brand", "description", "specifications", "size_options"],
            additionalProperties: false
          }
        }
      },
      required: ["page_type", "products"],
      additionalProperties: false
    }
  };
}
