const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://ejkhdhexkadecpbjjmsz.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || require('fs').readFileSync('.env.local', 'utf8').match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1]

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function test() {
  console.log('🧪 Testing get_products_by_category...')

  const { data, error } = await supabase.rpc('get_products_by_category', {
    category_name: 'ТЕСТОВАЯ',
    user_id_param: null,
    search_query: null,
    limit_param: 1,
    offset_param: 0
  })

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (data && data.length > 0) {
    const product = data[0]
    console.log('')
    console.log('📦 Product:', product.product_name)
    console.log('🖼️  Images field:', product.images ? '✅ EXISTS' : '❌ MISSING')
    console.log('🖼️  Image URL:', product.image_url || 'N/A')

    if (product.images) {
      console.log('📋 Images array:', JSON.stringify(product.images, null, 2))
    }
  } else {
    console.log('⚠️  No products found')
  }
}

test().then(() => process.exit(0)).catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
