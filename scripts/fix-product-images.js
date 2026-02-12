#!/usr/bin/env node

/**
 * Script to fix product images in the database
 * Replaces broken picsum.photos and alicdn.com URLs with working loremflickr.com URLs
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg';

const supabase = createClient(supabaseUrl, supabaseKey);

// Keywords mapping for each category
const categoryKeywords = {
  'Электроника': ['electronics', 'computer', 'gadget', 'phone', 'laptop', 'tablet', 'camera', 'headphones'],
  'Дом и быт': ['home', 'furniture', 'kitchen', 'appliance', 'interior', 'decor', 'household'],
  'Строительство': ['construction', 'tools', 'building', 'hardware', 'paint', 'materials'],
  'Здоровье и красота': ['beauty', 'cosmetics', 'health', 'wellness', 'skincare', 'perfume'],
  'Автотовары': ['car', 'automotive', 'vehicle', 'auto', 'motor', 'engine'],
  'Промышленность': ['industry', 'machinery', 'equipment', 'factory', 'industrial'],
  'Одежда и аксессуары': ['fashion', 'clothing', 'accessories', 'style', 'apparel']
};

// Generate a loremflickr URL with appropriate keyword
function generateImageUrl(category, productId, imageIndex = 0) {
  const keywords = categoryKeywords[category] || ['product'];
  // Use productId as seed for consistent images
  const hash = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const keywordIndex = (hash + imageIndex) % keywords.length;
  const keyword = keywords[keywordIndex];

  // Generate unique URL using productId and index as seed
  const seed = `${productId}_${imageIndex}`;
  const seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return `https://loremflickr.com/600/600/${keyword}?random=${seedNum}`;
}

async function fixProductImages() {
  console.log('Starting image fix process...\n');

  // Get all products
  const { data: products, error } = await supabase
    .from('catalog_verified_products')
    .select('id, name, category, images')
    .order('category');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products.length} products to process\n`);

  // Group products by category for stats
  const categoryStats = {};

  let updated = 0;
  let skipped = 0;

  // Process products in batches
  const batchSize = 100;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const updates = [];

    for (const product of batch) {
      const category = product.category || 'Электроника';

      // Check if images need updating
      let needsUpdate = false;
      if (!product.images || product.images.length === 0) {
        needsUpdate = true;
      } else {
        // Check if any image is from picsum or alicdn
        for (const img of product.images) {
          if (typeof img === 'string' &&
              (img.includes('picsum.photos') || img.includes('alicdn.com'))) {
            needsUpdate = true;
            break;
          }
        }
      }

      if (needsUpdate) {
        // Generate 3 images for each product
        const newImages = [
          generateImageUrl(category, product.id, 0),
          generateImageUrl(category, product.id, 1),
          generateImageUrl(category, product.id, 2)
        ];

        updates.push({
          id: product.id,
          images: newImages
        });

        // Track stats
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      } else {
        skipped++;
      }
    }

    // Batch update
    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('catalog_verified_products')
          .update({ images: update.images })
          .eq('id', update.id);

        if (updateError) {
          console.error(`Error updating product ${update.id}:`, updateError);
        } else {
          updated++;
        }
      }

      console.log(`Progress: ${Math.min(i + batchSize, products.length)}/${products.length} products processed`);
    }
  }

  console.log('\n=== Update Complete ===');
  console.log(`Total products: ${products.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already valid): ${skipped}\n`);

  console.log('Updates by category:');
  for (const [category, count] of Object.entries(categoryStats)) {
    console.log(`  ${category}: ${count}`);
  }

  // Verify a few random updates
  console.log('\n=== Verification ===');
  const { data: samples } = await supabase
    .from('catalog_verified_products')
    .select('id, name, category, images')
    .limit(5);

  console.log('Sample updated products:');
  for (const sample of samples) {
    console.log(`- ${sample.name}`);
    console.log(`  Category: ${sample.category}`);
    console.log(`  First image: ${sample.images[0]}`);
  }
}

// Run the script
fixProductImages()
  .then(() => {
    console.log('\nScript completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });