# Cigar Data Extraction Pipeline

A modern TypeScript-based web scraper for extracting structured cigar product information from e-commerce websites using OpenAI's structured output APIs.

## Overview

This tool extracts cigar product data from various types of web pages (product pages, brand pages, search results, etc.) and converts unstructured HTML content into standardized, structured JSON data. It uses OpenAI's GPT models with structured output schemas to ensure consistent, reliable data extraction.

## Features

- **Multi-page Type Support**: Handles blend pages, brand pages, search results, and collection pages
- **Hybrid Schema Architecture**: Flexible data model supporting complex pricing and packaging scenarios
- **Robust Data Validation**: TypeScript types and schema validation ensure data integrity
- **Comprehensive Logging**: Detailed extraction summaries and metadata tracking
- **Configurable Extraction**: YAML-based configuration for different extraction scenarios

## Architecture

### Hybrid Schema Design

This project uses a **hybrid vitola-offer model** that balances flexibility with real-world e-commerce requirements:

```typescript
Product → Vitolas[] → Offers[]
```

Each **Product** represents a cigar blend (e.g., "Highclere Castle Edwardian")
Each **Vitola** represents a size/shape variation (e.g., "Corona", "Robusto") 
Each **Offer** represents a pricing/packaging option (e.g., "Singles", "Box of 20", "5-Pack")

#### Schema Design Comparison

| Approach | Structure | Pros | Cons | Best Use Cases |
|----------|-----------|------|------|----------------|
| **Vitola-Centric** | `Product → Vitolas[]` (single price per vitola) | Simple, mirrors physical reality | Can't handle multiple packaging options | Basic catalogs with fixed pricing |
| **Price-Centric** | `Product → Offers[]` (no size grouping) | Handles complex pricing well | Loses vitola relationships, harder to analyze | Pure e-commerce focus |
| **Hybrid** ⭐ | `Product → Vitolas[] → Offers[]` | Best of both worlds, real-world flexibility | Slightly more complex | Modern e-commerce with multiple package sizes |

#### Why We Chose the Hybrid Approach

1. **Real-World Accuracy**: Cigar retailers often sell the same vitola in multiple packaging options (singles, 5-packs, boxes)
2. **Data Integrity**: Preserves the relationship between cigar sizes and their pricing options
3. **Analytical Power**: Enables analysis at both the vitola level (size preferences) and offer level (pricing strategies)
4. **Future-Proof**: Accommodates complex scenarios like samplers, limited editions, and bulk pricing
5. **Backward Compatibility**: Can easily be flattened to simpler models when needed

#### Example Data Structure

```json
{
  "product_name": "Highclere Castle Edwardian",
  "brand": "Highclere Castle",
  "vitolas": [
    {
      "name": "Corona",
      "size": { "length": 5.5, "ring_gauge": 42 },
      "offers": [
        {
          "current_price": 12.50,
          "package_type": "single",
          "cigars_per_package": 1,
          "total_cigars": 1
        },
        {
          "current_price": 62.50,
          "package_type": "pack",
          "cigars_per_package": 5,
          "total_cigars": 5
        },
        {
          "current_price": 225.00,
          "package_type": "box",
          "cigars_per_package": 20,
          "total_cigars": 20
        }
      ]
    },
    {
      "name": "Robusto",
      "size": { "length": 5.0, "ring_gauge": 50 },
      "offers": [
        {
          "current_price": 13.75,
          "package_type": "single",
          "cigars_per_package": 1,
          "total_cigars": 1
        }
      ]
    }
  ]
}
```

## Installation

```bash
npm install
```

## Configuration

The pipeline is configured via `config.yaml`:

```yaml
extraction:
  model: "gpt-4o-2024-08-06"  # OpenAI model for extraction
  max_tokens: 16384           # Maximum response tokens
  temperature: 0.1            # Low temperature for consistent extraction

outputs:
  save_extracted_data: true   # Save structured JSON output
  save_summary: true          # Save human-readable summary
  save_clean_html: true       # Save cleaned HTML
  save_clean_markdown: true   # Save cleaned Markdown
  save_raw_html: true         # Save original HTML
  save_raw_markdown: true     # Save original Markdown conversion
  save_screenshots: true      # Save page screenshots
```

## Usage

### Basic Usage

```bash
# Extract data from a single URL
npm run build && node build/src/main.js --url "https://example-cigar-site.com/product-page"

# Extract with custom output directory
npm run build && node build/src/main.js --url "https://example.com" --output-dir "./custom-output"
```

### Testing and Validation

```bash
# Run all tests
npm test

# Test schema validation with real data
npm run test:schema

# Test single URL extraction
npm run test:single

# Analyze existing extraction results
npm run analyze
```

## Data Output

For each extraction, the pipeline generates:

- `extracteddata.json` - Structured product data
- `summary.txt` - Human-readable extraction summary
- `metadata.json` - Extraction metadata and configuration
- `cleanHtml/` - Cleaned HTML content
- `cleanMarkdown/` - Cleaned Markdown conversion
- `rawHtml/` - Original HTML content
- `rawMarkdown/` - Original Markdown conversion
- `screenshots/` - Page screenshots

### Summary Format

The extraction summary provides a quick overview:

```
=== EXTRACTION SUMMARY ===
URL: https://example.com/cigars/highclere-castle-edwardian
Page Type: blend_page
Timestamp: 2024-01-15T10:30:00.000Z

Products Found: 1
├── Highclere Castle Edwardian (Highclere Castle)
    └── 3 vitolas, 7 offers total
        ├── Corona (5.5" × 42): 3 offers
        ├── Robusto (5" × 50): 2 offers  
        └── Toro (6" × 52): 2 offers

Total: 1 products, 3 vitolas, 7 offers
```

## Project Structure

```
├── src/
│   ├── main.ts                 # Main CLI application
│   ├── config/
│   │   ├── extraction.ts       # Extraction configuration
│   │   └── openai-schema.ts    # OpenAI structured output schema
│   ├── core/
│   │   ├── scraper.ts         # Web scraping functionality
│   │   ├── processor.ts       # HTML processing and cleaning
│   │   └── extractor.ts       # OpenAI-based data extraction
│   ├── types/
│   │   ├── cigar-schema.ts    # TypeScript type definitions
│   │   └── index.ts           # Type exports
│   └── utils/
│       ├── fileManager.ts     # File I/O operations
│       └── validation.ts      # Data validation utilities
├── tests/                     # Test files
├── config.yaml               # Main configuration file
└── data/                     # Extracted data storage
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Test specific functionality
npm run test:schema          # Schema validation tests
npm run test:single          # Single URL extraction test
npm run test:real-data       # Real data validation tests
```

### Adding New Extractors

1. Update the OpenAI schema in `src/config/openai-schema.ts`
2. Update TypeScript types in `src/types/cigar-schema.ts`
3. Add validation logic in `src/utils/validation.ts`
4. Update summary generation in `src/core/extractor.ts`

## API Reference

### Main Classes

#### `CigarScraper`
Handles web scraping and page loading.

#### `HtmlProcessor`  
Processes and cleans HTML content for extraction.

#### `CigarExtractor`
Manages OpenAI-based structured data extraction.

#### `FileManager`
Handles all file I/O operations and data persistence.

### Key Types

#### `CigarExtractionType`
Main extraction result containing page type and products array.

#### `CigarProductType`
Individual product with specifications and vitolas.

#### `VitolaType`
Cigar size/shape variation with offers array.

#### `OfferType`
Specific pricing/packaging option for a vitola.

## Error Handling

The pipeline includes comprehensive error handling:

- **Network Errors**: Retry logic for failed requests
- **Parsing Errors**: Graceful handling of malformed HTML
- **Schema Validation**: Strict validation of extracted data
- **File I/O Errors**: Safe file operations with error recovery

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Dependencies

- **OpenAI**: GPT-based structured data extraction
- **Playwright**: Web scraping and browser automation
- **Turndown**: HTML to Markdown conversion
- **js-yaml**: YAML configuration parsing
- **Jest**: Testing framework
- **TypeScript**: Type safety and development tooling

---

Built with ❤️ for the cigar community
