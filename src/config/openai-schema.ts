/**
 * Unified OpenAI structured output schema for flexible cigar extraction
 */

export const CIGAR_EXTRACTION_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "cigar_extraction",
    description: "Extract structured cigar product information from any page type, correctly grouping vitolas of the same blend",
    schema: {
      type: "object",
      properties: {
        page_type: {
          type: "string",
          enum: [
            "blend_page",
            "brand_page",
            "search_page",
            "single_vitola_page",
            "collection_page",
            "unknown"
          ],
          description: "Type of page being scraped: 'blend_page' displays a single cigar blend in multiple vitolas/sizes, 'brand_page' shows multiple blends from the same brand, 'search_page' shows search results across brands/blends, 'single_vitola_page' displays a single blend in a specific vitola, 'collection_page' shows curated collections or samplers, 'unknown' for any page type that cannot be determined"
        },
        products: {
          type: "array",
          description: "Array of cigar products found on the page. Group identical blends in different vitolas as a single product with multiple vitolas. For example, 'Highclere Castle Edwardian' in Corona, Robusto, and Toro should be ONE product with THREE vitolas, not three separate products.",
          items: {
            type: "object",
            properties: {
              product_name: {
                type: ["string", "null"],
                description: "Base blend name WITHOUT the vitola/size specification. For example, use 'Highclere Castle Edwardian' not 'Highclere Castle Edwardian Corona 5\"1/2 * 46'"
              },
              brand: {
                type: ["string", "null"],
                description: "Brand or manufacturer name, separate from the product name"
              },
              description: {
                type: ["string", "null"],
                description: "Product description or summary text from the page"
              },
              specifications: {
                type: "object",
                properties: {
                  strength: { type: ["string", "null"], description: "Cigar strength level (Mild, Medium, Full, etc.)" },
                  wrapper: { type: ["string", "null"], description: "Wrapper tobacco type and origin (e.g., 'USA Connecticut Shade', 'Ecuador Habano')" },
                  binder: { type: ["string", "null"], description: "Binder tobacco type and origin (e.g., 'Brazil Mata Fina', 'Nicaragua')" },
                  filler: { type: ["string", "null"], description: "Filler tobacco type and origin (e.g., 'Nicaragua', 'Dominican Republic, Nicaragua')" },
                  origin: { type: ["string", "null"], description: "Country of manufacture (e.g., 'Nicaragua', 'Dominican Republic')" },
                  manufacturer: { type: ["string", "null"], description: "Manufacturing company (e.g., 'Tabacalera Palma', 'My Father Cigars')" },
                  blender: { type: ["string", "null"], description: "Cigar blender or brand creator (e.g., 'Pete Johnson', 'AJ Fernandez')" }
                },
                required: ["strength", "wrapper", "binder", "filler", "origin", "manufacturer", "blender"],
                additionalProperties: true
              },
              vitolas: {
                type: "array",
                description: "Array of available vitolas (cigar sizes/shapes) with pricing and availability. 'Vitola' is the industry-standard term for cigar size/shape variations like Corona, Robusto, Churchill, etc. Group all sizes of the same blend here rather than as separate products.",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: ["string", "null"],
                      description: "Vitola name (e.g., Corona, Robusto, Toro, Churchill, Belicoso, Torpedo, etc.). Extract this from the full product name."
                    },
                    size: {
                      type: "object",
                      properties: {
                        length: { type: ["number", "null"], description: "Length as decimal number (e.g., 5, 5.5, 6)" },
                        length_unit: { type: ["string", "null"], enum: ["inches", "mm", null], description: "Unit of measurement (inches, mm)" },
                        ring_gauge: { type: ["number", "null"], description: "Ring gauge as whole number (e.g., 42, 46, 50, 52)" },
                        display: { type: ["string", "null"], description: "Original size display format (e.g., '5\"1/2 * 46', '6\" * 52')" }
                      },
                      required: ["length", "length_unit", "ring_gauge", "display"],
                      additionalProperties: true
                    },
                    price: {
                      type: "object",
                      properties: {
                        current_price: { type: ["number", "null"], description: "Current price as number without currency (e.g., 250.95)" },
                        msrp: { type: ["number", "null"], description: "MSRP/regular price as number without currency (e.g., 278)" },
                        savings: { type: ["number", "null"], description: "Savings amount as number without currency (e.g., 27.05)" },
                        currency: { type: ["string", "null"], description: "Currency code like USD, EUR, GBP" },
                        quantity: { type: ["number", "null"], description: "Number of cigars included at this price (e.g., 1, 5, 20, 25)" },
                        quantity_type: {
                          type: ["string", "null"],
                          enum: [
                            "single", "pack", "box", "bundle", "sampler",
                            "tin", "tube", "cabinet", "case", "sleeve",
                            "other", "unspecified", null
                          ],
                          description: "Type of quantity packaging (e.g., single cigar, box of 20, sampler of 5)"
                        }
                      },
                      required: ["current_price", "msrp", "savings", "currency", "quantity", "quantity_type"],
                      additionalProperties: true
                    },
                    availability: {
                      type: ["boolean", "null"],
                      description: "Whether this specific vitola is available for purchase. True for 'Add to Cart', 'Buy Now', 'In Stock', etc. False for 'Out of Stock', 'Sold Out', 'Unavailable', or disabled purchase buttons."
                    }
                  },
                  required: ["name", "size", "price", "availability"],
                  additionalProperties: true
                }
              }
            },
            required: ["product_name", "brand", "description", "specifications", "vitolas"],
            additionalProperties: true
          }
        }
      },
      required: ["page_type", "products"],
      additionalProperties: true
    }
  }
} as const;
