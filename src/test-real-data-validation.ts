/**
 * Test script to validate real extraction data against the new schema
 */

import { CigarExtractionSchema } from './types/cigar-schema.js';
import { sanitizeExtractionData } from './utils/validation.js';

// Simulate real data that had the "tin" error
const realDataWithTin = {
  "page_type": "search_results",
  "products": [
    {
      "product_name": "Foundation Charter Oak Connecticut Rothschild",
      "brand": "Foundation",
      "description": "Robusto, Mild, Claro, from Nicaragua",
      "specifications": {
        "strength": "Mild",
        "wrapper": "Claro",
        "binder": null,
        "filler": null,
        "origin": "Nicaragua",
        "manufacturer": null,
        "blender": null
      },
      "size_options": [
        {
          "size": {
            "length": 4.25,
            "length_unit": "inches",
            "ring_gauge": 50,
            "display": "4\"1/4 * 50"
          },
          "price": {
            "current_price": 115.95,
            "msrp": 128,
            "savings": 12.05,
            "currency": "USD",
            "quantity": 20,
            "quantity_type": "box"
          },
          "availability": "In Stock"
        },
        {
          "size": {
            "length": 4.25,
            "length_unit": "inches",
            "ring_gauge": 50,
            "display": "4\"1/4 * 50"
          },
          "price": {
            "current_price": 6.1,
            "msrp": 6.4,
            "savings": 0.3,
            "currency": "USD",
            "quantity": 1,
            "quantity_type": "single"
          },
          "availability": "In Stock"
        },
        {
          "size": {
            "length": 4.25,
            "length_unit": "inches",
            "ring_gauge": 50,
            "display": "4\"1/4 * 50"
          },
          "price": {
            "current_price": 85.99,
            "msrp": 92.50,
            "savings": 6.51,
            "currency": "USD",
            "quantity": 10,
            "quantity_type": "tin"  // This would have caused the original error
          },
          "availability": "In Stock"
        }
      ]
    }
  ]
};

// Test data with unknown packaging type
const dataWithUnknownType = {
  "page_type": "single_product",
  "products": [
    {
      "product_name": "Test Cigar",
      "brand": "Test Brand",
      "description": "Test Description",
      "specifications": {
        "strength": "Medium",
        "wrapper": null,
        "binder": null,
        "filler": null,
        "origin": null,
        "manufacturer": null,
        "blender": null
      },
      "size_options": [
        {
          "size": {
            "length": 6,
            "length_unit": "inches",
            "ring_gauge": 50,
            "display": "6 x 50"
          },
          "price": {
            "current_price": 15.99,
            "msrp": null,
            "savings": null,
            "currency": "USD",
            "quantity": 3,
            "quantity_type": "humidor"  // Unknown type that should become "other"
          },
          "availability": "In Stock"
        }
      ]
    }
  ]
};

async function testRealData(): Promise<void> {
  console.log('🧪 Testing real extraction data against new schema...\n');

  try {
    // Test 1: Real data with "tin" packaging type
    console.log('✅ Testing data with "tin" packaging type...');
    const validatedTin = CigarExtractionSchema.parse(realDataWithTin);
    console.log(`   Product: ${validatedTin.products[0]?.product_name}`);
    console.log('   Packaging types found:');
    validatedTin.products[0]?.size_options.forEach((option, index) => {
      const price = option.price;
      console.log(`     ${index + 1}. ${price.quantity} ${price.quantity_type} - $${price.current_price}`);
    });
    console.log('   ✅ "tin" validation passed!\n');

    // Test 2: Data with unknown packaging type that gets sanitized
    console.log('✅ Testing data sanitization for unknown packaging type...');
    const sanitizedData = sanitizeExtractionData(dataWithUnknownType);
    const validatedSanitized = CigarExtractionSchema.parse(sanitizedData);
    const sanitizedQuantityType = validatedSanitized.products[0]?.size_options[0]?.price.quantity_type;
    console.log(`   Original: "humidor" → Sanitized: "${sanitizedQuantityType}"`);
    console.log('   ✅ Data sanitization passed!\n');

    // Test 3: All new packaging types
    console.log('✅ Testing all supported packaging types...');
    const allPackagingTypes = ['single', 'pack', 'box', 'bundle', 'sampler', 'tin', 'tube', 'cabinet', 'case', 'sleeve', 'other', 'unspecified'];

    for (const packagingType of allPackagingTypes) {
      const testData = {
        page_type: "single_product",
        products: [{
          product_name: `Test ${packagingType}`,
          brand: "Test Brand",
          description: "Test",
          specifications: {
            strength: null, wrapper: null, binder: null, filler: null,
            origin: null, manufacturer: null, blender: null
          },
          size_options: [{
            size: { length: 6, length_unit: "inches", ring_gauge: 50, display: "6 x 50" },
            price: { current_price: 15.99, msrp: null, savings: null, currency: "USD", quantity: 1, quantity_type: packagingType },
            availability: "In Stock"
          }]
        }]
      };

      // Validate the test data
      CigarExtractionSchema.parse(testData);
      console.log(`     ✓ "${packagingType}" packaging type validated`);
    }

    console.log('\n🎉 All tests passed! The new schema successfully handles:');
    console.log('   ✅ Original packaging types (single, pack, box, bundle, sampler)');
    console.log('   ✅ New packaging types (tin, tube, cabinet, case, sleeve)');
    console.log('   ✅ Fallback options (other, unspecified)');
    console.log('   ✅ Data sanitization for unknown types');
    console.log('   ✅ No more "Invalid enum value" errors!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testRealData().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
