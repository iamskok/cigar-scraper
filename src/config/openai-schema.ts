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
              size_options: {
                type: "array",
                description: "Array of available size and pricing combinations. Even for single-size products, use an array with one element. Each element contains size info, pricing, and availability for that specific option.",
                items: {
                  type: "object",
                  properties: {
                    size: {
                      type: "object",
                      properties: {
                        length: { type: ["number", "null"], description: "Length as decimal number" },
                        length_unit: { type: ["string", "null"], enum: ["inches", "mm", null], description: "Unit of measurement" },
                        ring_gauge: { type: ["number", "null"], description: "Ring gauge as whole number" },
                        display: { type: ["string", "null"], description: "Original size display format" }
                      },
                      required: ["length", "length_unit", "ring_gauge", "display"],
                      additionalProperties: false
                    },
                    price: {
                      type: "object",
                      properties: {
                        current_price: { type: ["number", "null"], description: "Current price as number without currency" },
                        msrp: { type: ["number", "null"], description: "MSRP as number without currency" },
                        savings: { type: ["number", "null"], description: "Savings amount as number without currency" },
                        currency: { type: ["string", "null"], description: "Currency code like USD, EUR, GBP" },
                        quantity: { type: ["number", "null"], description: "Number of cigars included at this price (e.g., 1, 5, 20, 25)" },
                        quantity_type: { type: ["string", "null"], enum: ["single", "pack", "box", "bundle", "sampler", "tin", "tube", "cabinet", "case", "sleeve", "other", "unspecified", null], description: "Type of quantity packaging" }
                      },
                      required: ["current_price", "msrp", "savings", "currency", "quantity", "quantity_type"],
                      additionalProperties: false
                    },
                    availability: {
                      type: ["boolean", "null"],
                      description: "Whether this item is available for purchase. Set to true if you can find 'Add to Cart', 'Buy Now', 'In Stock', or similar purchase buttons/text. Set to false if you see 'Out of Stock', 'Sold Out', 'Unavailable', disabled purchase buttons, or clear unavailability indicators. Set to null only if availability cannot be determined from the page content."
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
  }
} as const;
