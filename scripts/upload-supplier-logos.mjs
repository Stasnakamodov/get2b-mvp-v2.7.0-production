/**
 * One-time script: generate themed SVG logos and upload to Supabase Storage
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ejkhdhexkadecpbjjmsz.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Themed SVG logos for each supplier
const SUPPLIER_LOGOS = {
  // TechLine — microchip icon (blue)
  'Shenzhen TechLine': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="48" fill="#1e3a5f"/>
  <g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round">
    <rect x="80" y="80" width="96" height="96" rx="12" fill="#fff" fill-opacity="0.1"/>
    <rect x="80" y="80" width="96" height="96" rx="12"/>
    <rect x="104" y="104" width="48" height="48" rx="4"/>
    <line x1="108" y1="56" x2="108" y2="80"/><line x1="128" y1="56" x2="128" y2="80"/><line x1="148" y1="56" x2="148" y2="80"/>
    <line x1="108" y1="176" x2="108" y2="200"/><line x1="128" y1="176" x2="128" y2="200"/><line x1="148" y1="176" x2="148" y2="200"/>
    <line x1="56" y1="108" x2="80" y2="108"/><line x1="56" y1="128" x2="80" y2="128"/><line x1="56" y1="148" x2="80" y2="148"/>
    <line x1="176" y1="108" x2="200" y2="108"/><line x1="176" y1="128" x2="200" y2="128"/><line x1="176" y1="148" x2="200" y2="148"/>
  </g>
</svg>`,

  // BuildMart — buildings with crane (orange)
  'Shanghai BuildMart': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="48" fill="#b45309"/>
  <g fill="#fff">
    <rect x="60" y="80" width="76" height="120" rx="6" opacity="0.9"/>
    <rect x="144" y="116" width="52" height="84" rx="6" opacity="0.7"/>
    <rect x="76" y="96" width="14" height="14" rx="2" fill="#b45309"/>
    <rect x="106" y="96" width="14" height="14" rx="2" fill="#b45309"/>
    <rect x="76" y="122" width="14" height="14" rx="2" fill="#b45309"/>
    <rect x="106" y="122" width="14" height="14" rx="2" fill="#b45309"/>
    <rect x="76" y="148" width="14" height="14" rx="2" fill="#b45309"/>
    <rect x="106" y="148" width="14" height="14" rx="2" fill="#b45309"/>
    <rect x="90" y="176" width="18" height="24" rx="3" fill="#b45309"/>
    <rect x="158" y="132" width="12" height="12" rx="2" fill="#b45309"/>
    <rect x="158" y="158" width="12" height="12" rx="2" fill="#b45309"/>
  </g>
  <g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round">
    <line x1="98" y1="80" x2="98" y2="56"/>
    <line x1="98" y1="56" x2="152" y2="56"/>
    <line x1="152" y1="56" x2="152" y2="72"/>
  </g>
</svg>`,

  // HomeTrade — house with chimney (green)
  'Guangzhou HomeTrade': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="48" fill="#065f46"/>
  <g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M52 136 L128 72 L204 136" fill="#fff" fill-opacity="0.1"/>
    <rect x="76" y="136" width="104" height="64" rx="4" fill="#fff" fill-opacity="0.1"/>
    <rect x="112" y="162" width="28" height="38" rx="4"/>
    <rect x="86" y="148" width="20" height="18" rx="3"/>
    <rect x="152" y="148" width="20" height="18" rx="3"/>
    <rect x="166" y="88" width="14" height="40" rx="2"/>
  </g>
</svg>`,

  // BeautyPro — flower (purple)
  'Yiwu BeautyPro': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="48" fill="#7c3aed"/>
  <g fill="#fff" fill-opacity="0.7">
    <ellipse cx="128" cy="96" rx="18" ry="32" transform="rotate(0 128 128)"/>
    <ellipse cx="128" cy="96" rx="18" ry="32" transform="rotate(72 128 128)"/>
    <ellipse cx="128" cy="96" rx="18" ry="32" transform="rotate(144 128 128)"/>
    <ellipse cx="128" cy="96" rx="18" ry="32" transform="rotate(216 128 128)"/>
    <ellipse cx="128" cy="96" rx="18" ry="32" transform="rotate(288 128 128)"/>
  </g>
  <circle cx="128" cy="128" r="14" fill="#fff"/>
</svg>`,
}

function generateLogo(name) {
  if (SUPPLIER_LOGOS[name]) {
    return Buffer.from(SUPPLIER_LOGOS[name])
  }
  // Fallback: initials logo for unknown suppliers
  const words = name.split(' ')
  const initials = words.slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const colors = ['1e3a5f', 'b45309', '065f46', '7c3aed', 'dc2626', '0369a1']
  const bg = colors[hash % colors.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="48" fill="#${bg}"/>
  <text x="128" y="148" font-family="Arial,sans-serif" font-size="96" font-weight="bold" fill="#fff" text-anchor="middle">${initials}</text>
</svg>`
  return Buffer.from(svg)
}

async function main() {
  console.log('--- Upload Supplier Logos ---')

  // 1. Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketName = 'supplier-logos'
  if (!buckets?.find(b => b.name === bucketName)) {
    const { error } = await supabase.storage.createBucket(bucketName, { public: true })
    if (error) {
      console.error('Bucket create error:', error.message)
      // Try to continue - bucket might already exist
    } else {
      console.log('Created bucket:', bucketName)
    }
  }

  // 2. Get all verified suppliers
  const { data: suppliers, error: fetchErr } = await supabase
    .from('catalog_verified_suppliers')
    .select('id, name')
    .eq('is_active', true)

  if (fetchErr) {
    console.error('Fetch error:', fetchErr.message)
    process.exit(1)
  }

  console.log(`Found ${suppliers.length} suppliers`)

  // 3. Upload logo for each supplier
  for (const supplier of suppliers) {
    const svgBuffer = generateLogo(supplier.name)
    const fileName = `${supplier.id}.svg`

    // Upload to storage
    const { error: uploadErr } = await supabase.storage
      .from(bucketName)
      .upload(fileName, svgBuffer, {
        contentType: 'image/svg+xml',
        upsert: true
      })

    if (uploadErr) {
      console.error(`Upload error for ${supplier.name}:`, uploadErr.message)
      continue
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    const logoUrl = urlData.publicUrl + '?v=' + Date.now()

    // Update supplier record
    const { error: updateErr } = await supabase
      .from('catalog_verified_suppliers')
      .update({ logo_url: logoUrl })
      .eq('id', supplier.id)

    if (updateErr) {
      console.error(`Update error for ${supplier.name}:`, updateErr.message)
    } else {
      console.log(`OK: ${supplier.name} -> ${logoUrl}`)
    }
  }

  console.log('--- Done ---')
}

main().catch(console.error)
