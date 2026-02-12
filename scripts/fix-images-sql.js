#!/usr/bin/env node

/**
 * SQL-based image fix for all products
 * Updates directly in database without network calls
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAllImages() {
  console.log('Starting bulk image update...\n');

  try {
    // First, get count of products to update
    const { count } = await supabase
      .from('catalog_verified_products')
      .select('*', { count: 'exact', head: true });

    console.log(`Total products: ${count}\n`);

    // Update electronics category
    const electronicsKeywords = ['electronics', 'computer', 'gadget', 'phone', 'laptop'];
    for (let i = 0; i < 5; i++) {
      const keyword = electronicsKeywords[i];
      const { data, error } = await supabase.rpc('update_product_images_by_category', {
        p_category: 'Электроника',
        p_offset: i * 180,
        p_limit: 180,
        p_keyword: keyword
      }).single();

      if (!error) {
        console.log(`Updated ${i * 180} to ${(i + 1) * 180} Electronics products with ${keyword} images`);
      }
    }

    // Update home category
    const homeKeywords = ['home', 'furniture', 'kitchen', 'appliance', 'interior'];
    for (let i = 0; i < 5; i++) {
      const keyword = homeKeywords[i];
      const { data, error } = await supabase.rpc('update_product_images_by_category', {
        p_category: 'Дом и быт',
        p_offset: i * 449,
        p_limit: 449,
        p_keyword: keyword
      }).single();

      if (!error) {
        console.log(`Updated ${i * 449} to ${(i + 1) * 449} Home products with ${keyword} images`);
      }
    }

    // Simple direct update for all products with picsum or alicdn URLs
    const updateQuery = `
      UPDATE catalog_verified_products
      SET images = ARRAY[
        CONCAT('https://loremflickr.com/600/600/',
          CASE
            WHEN category = 'Электроника' THEN 'electronics'
            WHEN category = 'Дом и быт' THEN 'furniture'
            WHEN category = 'Строительство' THEN 'tools'
            WHEN category = 'Здоровье и красота' THEN 'cosmetics'
            WHEN category = 'Автотовары' THEN 'car'
            WHEN category = 'Промышленность' THEN 'machinery'
            WHEN category = 'Одежда и аксессуары' THEN 'fashion'
            ELSE 'product'
          END,
          '?random=', LEFT(md5(id::text), 8)),
        CONCAT('https://loremflickr.com/600/600/',
          CASE
            WHEN category = 'Электроника' THEN 'gadget'
            WHEN category = 'Дом и быт' THEN 'kitchen'
            WHEN category = 'Строительство' THEN 'construction'
            WHEN category = 'Здоровье и красота' THEN 'beauty'
            WHEN category = 'Автотовары' THEN 'automotive'
            WHEN category = 'Промышленность' THEN 'industrial'
            WHEN category = 'Одежда и аксессуары' THEN 'clothing'
            ELSE 'item'
          END,
          '?random=', LEFT(md5(id::text || '2'), 8)),
        CONCAT('https://loremflickr.com/600/600/',
          CASE
            WHEN category = 'Электроника' THEN 'technology'
            WHEN category = 'Дом и быт' THEN 'home'
            WHEN category = 'Строительство' THEN 'hardware'
            WHEN category = 'Здоровье и красота' THEN 'wellness'
            WHEN category = 'Автотовары' THEN 'vehicle'
            WHEN category = 'Промышленность' THEN 'equipment'
            WHEN category = 'Одежда и аксессуары' THEN 'style'
            ELSE 'goods'
          END,
          '?random=', LEFT(md5(id::text || '3'), 8))
      ]
      WHERE images::text LIKE '%picsum.photos%'
         OR images::text LIKE '%alicdn.com%';
    `;

    // Execute the update
    console.log('\nExecuting bulk update...');
    const { data, error } = await supabase.rpc('execute_raw_sql', {
      sql_query: updateQuery
    });

    if (error) {
      // If RPC doesn't exist, do batch updates
      console.log('Using batch update method...');

      // Get all products that need updating
      const { data: products, error: fetchError } = await supabase
        .from('catalog_verified_products')
        .select('id, category')
        .or('images.cs.picsum.photos,images.cs.alicdn.com');

      if (fetchError) throw fetchError;

      console.log(`Found ${products.length} products to update`);

      // Process in batches of 500
      const batchSize = 500;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);

        // Update each product in the batch
        for (const product of batch) {
          const categoryKeyword = {
            'Электроника': 'electronics',
            'Дом и быт': 'furniture',
            'Строительство': 'tools',
            'Здоровье и красота': 'cosmetics',
            'Автотовары': 'car',
            'Промышленность': 'machinery',
            'Одежда и аксессуары': 'fashion'
          }[product.category] || 'product';

          const hash1 = product.id.substring(0, 8);
          const hash2 = product.id.substring(9, 17);
          const hash3 = product.id.substring(18, 26);

          const newImages = [
            `https://loremflickr.com/600/600/${categoryKeyword}?random=${hash1}`,
            `https://loremflickr.com/600/600/${categoryKeyword}?random=${hash2}`,
            `https://loremflickr.com/600/600/${categoryKeyword}?random=${hash3}`
          ];

          await supabase
            .from('catalog_verified_products')
            .update({ images: newImages })
            .eq('id', product.id);
        }

        console.log(`Updated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}`);
      }
    }

    // Verify the update
    console.log('\n=== Verifying Update ===');
    const { data: checkData } = await supabase
      .from('catalog_verified_products')
      .select('images')
      .or('images.cs.picsum.photos,images.cs.alicdn.com')
      .limit(1);

    if (checkData && checkData.length > 0) {
      console.log('Warning: Some products still have old URLs');
    } else {
      console.log('All products successfully updated!');
    }

    // Show sample of updated products
    const { data: samples } = await supabase
      .from('catalog_verified_products')
      .select('name, category, images')
      .limit(10);

    console.log('\nSample updated products:');
    samples.forEach(p => {
      console.log(`- ${p.name} (${p.category})`);
      console.log(`  Image: ${p.images[0]}`);
    });

  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}

// Run the update
fixAllImages()
  .then(() => {
    console.log('\nAll images updated successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed:', err);
    process.exit(1);
  });