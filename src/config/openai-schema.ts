/**
 * Unified OpenAI structured output schema for flexible cigar extraction
 */

export const CIGAR_EXTRACTION_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "cigar_extraction",
    description: "Extract structured cigar product information from any page type",
    schema: {
      type: "object",
      properties: {
        page_type: {
          type: "string",
          enum: ["single_product_single_size", "single_product_multiple_sizes", "multiple_products", "search_results"],
          description: "Type of page being scraped"
        },
        products: {
          type: "array",
          description: "Array of cigar products found on the page",
          items: {
            type: "object",
            properties: {
              product_name: {
                type: ["string", "null"],
                description: "Exact product name as displayed on the page"
              },
              brand: {
                type: ["string", "null"],
                description: "Brand or manufacturer name"
              },
              description: {
                type: ["string", "null"],
                description: "Product description or summary text from the page"
              },
              specifications: {
                type: "object",
                properties: {
                  strength: { type: ["string", "null"], description: "Cigar strength level" },
                  wrapper: { type: ["string", "null"], description: "Wrapper tobacco type and origin" },
                  binder: { type: ["string", "null"], description: "Binder tobacco type and origin" },
                  filler: { type: ["string", "null"], description: "Filler tobacco type and origin" },
                  origin: { type: ["string", "null"], description: "Country of manufacture" },
                  manufacturer: { type: ["string", "null"], description: "Manufacturing company" },
                  blender: { type: ["string", "null"], description: "Cigar blender or brand creator" }
                },
                required: ["strength", "wrapper", "binder", "filler", "origin", "manufacturer", "blender"],
                additionalProperties: false
              },
              single_size: {
                type: ["object", "null"],
                description: "Size info for single-size products. Null for multi-size or search results.",
                properties: {
                  length: { type: ["number", "null"], description: "Length as decimal number" },
                  length_unit: { type: ["string", "null"], enum: ["inches", "mm", null], description: "Unit of measurement" },
                  ring_gauge: { type: ["number", "null"], description: "Ring gauge as whole number" },
                  display: { type: ["string", "null"], description: "Original size display format" }
                },
                required: ["length", "length_unit", "ring_gauge", "display"],
                additionalProperties: false
              },
              single_price: {
                type: ["object", "null"],
                description: "Price info for single-price products. Null for multi-size or search results.",
                properties: {
                  current_price: { type: ["number", "null"], description: "Current price as number without currency" },
                  msrp: { type: ["number", "null"], description: "MSRP as number without currency" },
                  savings: { type: ["number", "null"], description: "Savings amount as number without currency" },
                  currency: { type: ["string", "null"], description: "Currency code like USD, EUR, GBP" }
                },
                required: ["current_price", "msrp", "savings", "currency"],
                additionalProperties: false
              },
              single_availability: {
                type: ["string", "null"],
                description: "Stock status for single-size products. Null for multi-size."
              },
              multiple_sizes: {
                type: ["array", "null"],
                description: "Array of size/price combinations for multi-size products. Null for single-size.",
                items: {
                  type: "object",
                  properties: {
                    size: {
                      type: "object",
                      properties: {
                        length: { type: ["number", "null"] },
                        length_unit: { type: ["string", "null"], enum: ["inches", "mm", null] },
                        ring_gauge: { type: ["number", "null"] },
                        display: { type: ["string", "null"] }
                      },
                      required: ["length", "length_unit", "ring_gauge", "display"],
                      additionalProperties: false
                    },
                    price: {
                      type: "object",
                      properties: {
                        current_price: { type: ["number", "null"] },
                        msrp: { type: ["number", "null"] },
                        savings: { type: ["number", "null"] },
                        currency: { type: ["string", "null"] }
                      },
                      required: ["current_price", "msrp", "savings", "currency"],
                      additionalProperties: false
                    },
                    availability: {
                      type: ["string", "null"],
                      description: "Stock status for this specific size"
                    }
                  },
                  required: ["size", "price", "availability"],
                  additionalProperties: false
                }
              }
            },
            required: ["product_name", "brand", "description", "specifications", "single_size", "single_price", "single_availability", "multiple_sizes"],
            additionalProperties: false
          }
        }
      },
      required: ["page_type", "products"],
      additionalProperties: false
    }
  }
} as const;
