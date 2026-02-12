/**
 * ProductQualityEnricher - Generate quality product names and descriptions
 * from raw OTAPI data instead of generic Chinese-translated titles.
 */

import type { OtapiProduct } from './OtapiService'

// ─── Generic patterns that indicate a low-quality name ─────────────────────

const GENERIC_PATTERNS = [
  /^силиконов/i,
  /^чехол\b/i,
  /^защитн/i,
  /^универсальн/i,
  /^новый\s/i,
  /^горяч/i,
  /^модн/i,
  /^высококачествен/i,
  /^бесплатная доставка/i,
  /^оптов/i,
  /^популярн/i,
  /^лучш/i,
  /^дешев/i,
  /^2\d{3}\s/i,         // starts with year like "2026 new..."
  /^без названия$/i,
]

const MAX_NAME_LENGTH = 100

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cleanRawName(name: string): string {
  return name
    .replace(/[!@#$%^&*(){}\[\]<>|\\~`]+/g, '')  // strip noise punctuation
    .replace(/\s+/g, ' ')
    .trim()
}

function isGenericName(name: string): boolean {
  if (name.length < 15) return true
  return GENERIC_PATTERNS.some(p => p.test(name))
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  // Cut at last space before max
  const cut = s.lastIndexOf(' ', max)
  return (cut > max * 0.5 ? s.slice(0, cut) : s.slice(0, max)).trimEnd()
}

/**
 * Extract useful attribute values from product.attributes
 */
function getAttrValue(
  product: OtapiProduct,
  keys: string[]
): string | undefined {
  for (const attr of product.attributes) {
    for (const k of keys) {
      if (attr.name.toLowerCase().includes(k.toLowerCase()) && attr.value) {
        return attr.value
      }
    }
  }
  return undefined
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class ProductQualityEnricher {
  /**
   * Enrich product name.
   *
   * @param product  Raw OTAPI product
   * @param batchNames  Set of names already used in current batch (for uniqueness)
   * @returns quality unique name
   */
  enrichName(product: OtapiProduct, batchNames: Set<string>): string {
    let name = cleanRawName(product.name)

    // If the name is generic, try to build a better one from attributes
    if (isGenericName(name)) {
      name = this.buildEnrichedName(product, name)
    }

    // Ensure uniqueness within batch
    name = this.ensureUniqueName(name, product, batchNames)

    // Final truncation
    name = truncate(name, MAX_NAME_LENGTH)

    batchNames.add(name.toLowerCase())
    return name
  }

  /**
   * Build an enriched name from brand, color, material, model attributes.
   */
  private buildEnrichedName(product: OtapiProduct, rawName: string): string {
    const parts: string[] = []

    // Brand
    if (product.brand && product.brand !== 'N/A') {
      parts.push(product.brand)
    }

    // Core name (cleaned)
    parts.push(rawName)

    // Color
    const color = getAttrValue(product, ['цвет', 'color', 'colour'])
    if (color) parts.push(color)

    // Material
    const material = getAttrValue(product, ['материал', 'material', 'ткань', 'fabric'])
    if (material) parts.push(material)

    // Size / Model
    const model = getAttrValue(product, ['модель', 'model', 'размер', 'size'])
    if (model) parts.push(model)

    return parts.join(' ')
  }

  /**
   * If name already exists in batchNames, append distinguishing attributes.
   */
  private ensureUniqueName(
    name: string,
    product: OtapiProduct,
    batchNames: Set<string>
  ): string {
    if (!batchNames.has(name.toLowerCase())) return name

    // Try adding color
    const color = getAttrValue(product, ['цвет', 'color'])
    if (color) {
      const withColor = `${name} ${color}`
      if (!batchNames.has(withColor.toLowerCase())) return withColor
    }

    // Try adding model/size
    const model = getAttrValue(product, ['модель', 'model', 'размер', 'size', 'артикул'])
    if (model) {
      const withModel = `${name} ${model}`
      if (!batchNames.has(withModel.toLowerCase())) return withModel
    }

    // Try adding SKU suffix
    if (product.id) {
      const skuSuffix = product.id.slice(-6)
      const withSku = `${name} #${skuSuffix}`
      if (!batchNames.has(withSku.toLowerCase())) return withSku
    }

    // Fallback: append vendor ID
    return `${name} (${product.vendorId?.slice(-8) || Date.now()})`
  }

  /**
   * Enrich product description from OTAPI data.
   *
   * @param product  Raw OTAPI product
   * @param category Category name for context
   * @returns rich description string
   */
  enrichDescription(product: OtapiProduct, category: string): string {
    const sections: string[] = []

    // 1. Intro line with brand / category
    const brand = product.brand && product.brand !== 'N/A' ? product.brand : null
    const intro = brand
      ? `${product.name} от ${brand}. Категория: ${category}.`
      : `${product.name}. Категория: ${category}.`
    sections.push(intro)

    // 2. Specifications block (up to 10 key specs)
    const specs = product.specifications
    const specEntries = Object.entries(specs || {}).filter(
      ([, v]) => v !== null && v !== undefined && String(v).trim() !== ''
    )
    if (specEntries.length > 0) {
      sections.push('\nХарактеристики:')
      for (const [key, value] of specEntries.slice(0, 10)) {
        sections.push(`  - ${key}: ${value}`)
      }
    }

    // 3. Attributes block (if specs are empty)
    if (specEntries.length === 0 && product.attributes.length > 0) {
      sections.push('\nХарактеристики:')
      for (const attr of product.attributes.slice(0, 10)) {
        if (attr.name && attr.value) {
          sections.push(`  - ${attr.name}: ${attr.value}`)
        }
      }
    }

    // 4. Supplier info
    if (product.seller?.name && product.seller.name !== 'Неизвестный поставщик') {
      const sellerLine = product.seller.city
        ? `Поставщик: ${product.seller.name} (${product.seller.country}, ${product.seller.city}).`
        : `Поставщик: ${product.seller.name} (${product.seller.country}).`
      sections.push('\n' + sellerLine)
    }

    // 5. Rating and sales
    const ratingParts: string[] = []
    if (product.rating && product.rating > 0) {
      ratingParts.push(`Рейтинг: ${product.rating}/5`)
    }
    if (product.soldCount && product.soldCount > 0) {
      ratingParts.push(`Продано: ${product.soldCount} шт.`)
    }
    if (product.reviewsCount && product.reviewsCount > 0) {
      ratingParts.push(`Отзывов: ${product.reviewsCount}`)
    }
    if (ratingParts.length > 0) {
      sections.push(ratingParts.join(' | '))
    }

    const result = sections.join('\n')

    // 6. Fallback: if description is too short, use a basic template
    if (result.length < 30) {
      return `${product.name}. Категория: ${category}. Прямая поставка из Китая.`
    }

    return result
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let _instance: ProductQualityEnricher | null = null

export function getProductQualityEnricher(): ProductQualityEnricher {
  if (!_instance) {
    _instance = new ProductQualityEnricher()
  }
  return _instance
}
