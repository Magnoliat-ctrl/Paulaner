/**
 * AI Query Engine
 * Processes natural language queries about supplier and malt data
 * Uses ONLY local data - no external APIs
 */

import maltSuppliersData from '../data/maltSuppliers.json'
import productDetailsData from '../data/productDetails.json'
import esgAnalysisData from '../data/esgAnalysis.json'

class AIQueryEngine {
  constructor() {
    this.suppliers = maltSuppliersData
    this.products = productDetailsData
    this.esgData = esgAnalysisData
    this.context = null // Store conversation context
  }

  /**
   * Main query processing function
   */
  processQuery(query) {
    const normalizedQuery = query.toLowerCase().trim()

    // Detect query type and route to appropriate handler
    if (this.isComparisonQuery(normalizedQuery)) {
      return this.handleComparison(normalizedQuery, query)
    } else if (this.isESGQuery(normalizedQuery)) {
      return this.handleESGQuery(normalizedQuery)
    } else if (this.isProductSearchQuery(normalizedQuery)) {
      return this.handleProductSearch(normalizedQuery)
    } else if (this.isSupplierInfoQuery(normalizedQuery)) {
      return this.handleSupplierInfo(normalizedQuery)
    } else if (this.isRecommendationQuery(normalizedQuery)) {
      return this.handleRecommendation(normalizedQuery)
    } else if (this.isStatisticsQuery(normalizedQuery)) {
      return this.handleStatistics(normalizedQuery)
    } else if (this.isCertificationQuery(normalizedQuery)) {
      return this.handleCertification(normalizedQuery)
    } else if (this.isColorQuery(normalizedQuery)) {
      return this.handleColorQuery(normalizedQuery)
    } else {
      return this.handleGeneralQuery(normalizedQuery)
    }
  }

  /**
   * Query type detection methods
   */
  isComparisonQuery(query) {
    const keywords = ['vergleich', 'vergleiche', 'unterschied', 'vs', 'versus', 'oder', 'besser']
    return keywords.some(kw => query.includes(kw))
  }

  isESGQuery(query) {
    const keywords = ['esg', 'nachhaltig', 'umwelt', 'sozial', 'governance', 'co2', 'energie']
    return keywords.some(kw => query.includes(kw))
  }

  isProductSearchQuery(query) {
    const keywords = ['zeige', 'suche', 'finde', 'alle', 'liste', 'welche malz']
    return keywords.some(kw => query.includes(kw)) && !this.isSupplierInfoQuery(query)
  }

  isSupplierInfoQuery(query) {
    const keywords = ['lieferant', 'hersteller', 'welcher lieferant', 'informationen über']
    const hasSupplierName = this.suppliers.some(s => query.includes(s.name.toLowerCase()))
    return keywords.some(kw => query.includes(kw)) || hasSupplierName
  }

  isRecommendationQuery(query) {
    const keywords = ['empfehlung', 'empfehle', 'geeignet', 'welches malz für', 'für pilsner', 'für weizen', 'für bock']
    return keywords.some(kw => query.includes(kw))
  }

  isStatisticsQuery(query) {
    const keywords = ['wie viele', 'anzahl', 'statistik', 'übersicht', 'gesamt']
    return keywords.some(kw => query.includes(kw))
  }

  isCertificationQuery(query) {
    const keywords = ['zertifizierung', 'zertifikat', 'iso', 'bio', 'qualität']
    return keywords.some(kw => query.includes(kw))
  }

  isColorQuery(query) {
    const keywords = ['farbe', 'ebc', 'hell', 'dunkel', 'schwarz', 'rot']
    return keywords.some(kw => query.includes(kw)) && !this.isComparisonQuery(query)
  }

  /**
   * Comparison handler - compare products or suppliers
   */
  handleComparison(normalizedQuery, originalQuery) {
    // Extract product names or supplier names
    const supplierNames = this.extractSupplierNames(normalizedQuery)
    const products = this.extractProductNames(originalQuery)

    if (products.length >= 2) {
      return this.compareProducts(products)
    } else if (supplierNames.length >= 2) {
      return this.compareSuppliers(supplierNames)
    } else if (products.length === 1) {
      // Try to auto-expand to similar products across suppliers
      const similarProducts = this.findSimilarProductsAcrossSuppliers(products[0])

      if (similarProducts.length >= 2) {
        // Auto-compare with similar products
        return this.compareProducts(similarProducts.map(p => p.name))
      } else {
        // If no similar products found, show suggestions
        return this.suggestProductComparisons(products[0])
      }
    } else {
      return {
        type: 'clarification',
        message: 'Ich kann Produkte oder Lieferanten vergleichen. Bitte geben Sie konkrete Namen an.',
        suggestions: [
          'Vergleiche Weyermann Pilsner mit Bestmalz Pilsner',
          'Vergleiche Weyermann mit Ireks ESG-Bewertung',
          'Welcher ist besser: Caramel Pils oder Caramel Amber?'
        ]
      }
    }
  }

  /**
   * Find similar products across suppliers (e.g., all "Pilsner" variants)
   */
  findSimilarProductsAcrossSuppliers(productName) {
    const similar = []

    // Extract the core product type (remove supplier names and common words)
    const coreType = productName.toLowerCase()
      .replace(/weyermann|bestmalz|ireks/gi, '')
      .replace(/gmbh|malz|braumalz/gi, '')
      .trim()
      .split(/\s+/)[0] // Take first significant word

    if (coreType.length < 4) return [] // Too short to be meaningful

    // Find all products matching this core type across all suppliers
    for (const [supplierName, supplierData] of Object.entries(this.products)) {
      if (!supplierData.categories) continue

      for (const [category, products] of Object.entries(supplierData.categories)) {
        for (const product of products) {
          const productNameLower = product.name.toLowerCase()

          // Check if this product matches the core type
          if (productNameLower.includes(coreType)) {
            similar.push({
              name: product.name,
              supplier: supplierName
            })
            // Only take one product per supplier
            break
          }
        }
        // Break if we found a match for this supplier
        if (similar.some(p => p.supplier === supplierName)) break
      }
    }

    return similar
  }

  /**
   * Compare two or more products
   */
  compareProducts(productNames) {
    const foundProducts = []

    // Find products across all suppliers
    for (const [supplierName, supplierData] of Object.entries(this.products)) {
      if (!supplierData.categories) continue

      for (const [category, products] of Object.entries(supplierData.categories)) {
        for (const product of products) {
          if (productNames.some(name => product.name.toLowerCase().includes(name.toLowerCase()))) {
            foundProducts.push({
              ...product,
              supplier: supplierName,
              category
            })
          }
        }
      }
    }

    if (foundProducts.length < 2) {
      return {
        type: 'error',
        message: `Ich konnte nicht genügend Produkte finden. Gefunden: ${foundProducts.length === 1 ? foundProducts[0].name : 'keine'}`,
        suggestions: ['Versuchen Sie genauere Produktnamen']
      }
    }

    // Build comparison table
    return {
      type: 'comparison',
      title: 'Produktvergleich',
      products: foundProducts.map(p => ({
        name: p.name,
        supplier: p.supplier,
        color: p.color.ebc,
        colorCategory: p.color.category,
        usage: p.usage,
        enzymes: p.enzymes,
        aroma: p.aroma,
        beerTypes: p.beerTypes,
        rating: p.rating
      }))
    }
  }

  /**
   * Compare suppliers based on ESG
   */
  compareSuppliers(supplierNames) {
    const comparisons = []

    for (const name of supplierNames) {
      const supplier = this.suppliers.find(s =>
        s.name.toLowerCase().includes(name.toLowerCase())
      )

      if (supplier) {
        const esgData = this.esgData.suppliers[supplier.name]
        comparisons.push({
          name: supplier.name,
          esgScore: esgData?.overallESGScore || 'N/A',
          environmental: esgData?.environmental.score || 'N/A',
          social: esgData?.social.score || 'N/A',
          governance: esgData?.governance.score || 'N/A',
          rating: esgData?.rating || 'N/A',
          strengths: esgData?.strengths || [],
          certifications: supplier.certifications
        })
      }
    }

    if (comparisons.length === 0) {
      return {
        type: 'error',
        message: 'Keine Lieferanten gefunden. Verfügbare Lieferanten: ' +
                 this.suppliers.map(s => s.name).join(', ')
      }
    }

    return {
      type: 'supplier_comparison',
      title: 'Lieferantenvergleich',
      suppliers: comparisons
    }
  }

  /**
   * Handle ESG-related queries
   */
  handleESGQuery(query) {
    if (query.includes('beste') || query.includes('höchste')) {
      // Find supplier with best ESG score
      const ranked = Object.entries(this.esgData.suppliers)
        .map(([name, data]) => ({ name, score: data.overallESGScore, rating: data.rating }))
        .sort((a, b) => b.score - a.score)

      return {
        type: 'ranking',
        title: 'ESG-Bewertung (höchste zuerst)',
        items: ranked.map((item, idx) => ({
          rank: idx + 1,
          name: item.name,
          score: `${item.score}/10`,
          rating: item.rating
        }))
      }
    } else if (query.includes('umwelt')) {
      // Environmental rankings
      const ranked = Object.entries(this.esgData.suppliers)
        .map(([name, data]) => ({
          name,
          score: data.environmental.score,
          details: data.environmental.carbonFootprint?.level || 'N/A'
        }))
        .sort((a, b) => b.score - a.score)

      return {
        type: 'environmental_ranking',
        title: 'Umwelt-Bewertung',
        items: ranked
      }
    } else {
      // General ESG overview
      return {
        type: 'esg_overview',
        title: 'ESG-Übersicht',
        average: this.esgData.industryBenchmarks.averageESGScore,
        topPerformers: this.esgData.industryBenchmarks.topPerformers,
        needsImprovement: this.esgData.industryBenchmarks.needsImprovement
      }
    }
  }

  /**
   * Handle product search queries
   */
  handleProductSearch(query) {
    const results = []
    const criteria = this.extractSearchCriteria(query)

    for (const [supplierName, supplierData] of Object.entries(this.products)) {
      if (!supplierData.categories) continue

      for (const [category, products] of Object.entries(supplierData.categories)) {
        for (const product of products) {
          if (this.matchesCriteria(product, criteria)) {
            results.push({
              ...product,
              supplier: supplierName,
              category
            })
          }
        }
      }
    }

    if (results.length === 0) {
      return {
        type: 'error',
        message: 'Keine Produkte gefunden, die Ihren Kriterien entsprechen.',
        suggestions: ['Versuchen Sie andere Suchbegriffe']
      }
    }

    return {
      type: 'product_list',
      title: `Gefundene Produkte (${results.length})`,
      products: results.slice(0, 20) // Limit to 20 results
    }
  }

  /**
   * Extract search criteria from query
   */
  extractSearchCriteria(query) {
    const criteria = {}

    // Color category
    if (query.includes('sehr hell')) criteria.colorCategory = 'sehr hell'
    else if (query.includes('hell')) criteria.colorCategory = 'hell'
    else if (query.includes('dunkel')) criteria.colorCategory = 'dunkelbraun'
    else if (query.includes('schwarz')) criteria.colorCategory = 'schwarz'
    else if (query.includes('rot')) criteria.colorCategory = 'rot'

    // Category
    if (query.includes('basis')) criteria.category = 'Basismalze'
    if (query.includes('röst')) criteria.category = 'Röstmalze'
    if (query.includes('karamell') || query.includes('caramel')) criteria.category = 'Karamellmalze'
    if (query.includes('rauch')) criteria.category = 'Rauchmalze'
    if (query.includes('spezial')) criteria.category = 'Spezialmalze'

    // Enzymes
    if (query.includes('hoch') && query.includes('enzym')) criteria.enzymes = 'hoch'
    if (query.includes('keine') && query.includes('enzym')) criteria.enzymes = 'keine'

    // EBC range
    const ebcMatch = query.match(/unter (\d+)/i) || query.match(/< (\d+)/i)
    if (ebcMatch) {
      criteria.ebcMax = parseInt(ebcMatch[1])
    }
    const ebcMatchOver = query.match(/über (\d+)/i) || query.match(/> (\d+)/i)
    if (ebcMatchOver) {
      criteria.ebcMin = parseInt(ebcMatchOver[1])
    }

    return criteria
  }

  /**
   * Check if product matches criteria
   */
  matchesCriteria(product, criteria) {
    if (criteria.colorCategory && product.color.category !== criteria.colorCategory) {
      return false
    }
    if (criteria.enzymes && product.enzymes !== criteria.enzymes) {
      return false
    }
    if (criteria.ebcMax) {
      const ebc = this.parseEBC(product.color.ebc)
      if (ebc > criteria.ebcMax) return false
    }
    if (criteria.ebcMin) {
      const ebc = this.parseEBC(product.color.ebc)
      if (ebc < criteria.ebcMin) return false
    }
    return true
  }

  /**
   * Parse EBC value from string (handles ranges like "2,0-3,5")
   */
  parseEBC(ebcString) {
    if (ebcString === 'N/A') return 0
    const match = ebcString.match(/[\d,]+/)
    if (match) {
      return parseFloat(match[0].replace(',', '.'))
    }
    return 0
  }

  /**
   * Handle supplier information queries
   */
  handleSupplierInfo(query) {
    const supplierName = this.extractSupplierNames(query)[0]
    if (!supplierName) {
      return {
        type: 'list',
        title: 'Verfügbare Lieferanten',
        items: this.suppliers.map(s => s.name)
      }
    }

    const supplier = this.suppliers.find(s =>
      s.name.toLowerCase().includes(supplierName.toLowerCase())
    )

    if (!supplier) {
      return {
        type: 'error',
        message: `Lieferant "${supplierName}" nicht gefunden.`
      }
    }

    const esgData = this.esgData.suppliers[supplier.name]
    const productCount = this.countSupplierProducts(supplier.name)

    return {
      type: 'supplier_info',
      name: supplier.name,
      category: supplier.category,
      description: supplier.description,
      location: supplier.location,
      productCount,
      certifications: supplier.certifications,
      esg: esgData ? {
        score: esgData.overallESGScore,
        rating: esgData.rating,
        strengths: esgData.strengths,
        improvements: esgData.areasForImprovement
      } : null
    }
  }

  /**
   * Handle recommendation queries
   */
  handleRecommendation(query) {
    let beerStyle = null

    // Detect beer style
    const styles = [
      'pilsner', 'pils', 'weizen', 'bock', 'märzen', 'stout', 'porter',
      'ale', 'lager', 'schwarzbier', 'export', 'rauchbier'
    ]

    for (const style of styles) {
      if (query.includes(style)) {
        beerStyle = style
        break
      }
    }

    if (!beerStyle) {
      return {
        type: 'clarification',
        message: 'Für welchen Bierstil suchen Sie eine Empfehlung?',
        suggestions: ['Pilsner', 'Weizen', 'Bock', 'Porter', 'Stout', 'Märzen']
      }
    }

    // Find suitable products
    const recommendations = []

    for (const [supplierName, supplierData] of Object.entries(this.products)) {
      if (!supplierData.categories) continue

      for (const [category, products] of Object.entries(supplierData.categories)) {
        for (const product of products) {
          if (product.beerTypes.toLowerCase().includes(beerStyle)) {
            recommendations.push({
              ...product,
              supplier: supplierName,
              category
            })
          }
        }
      }
    }

    return {
      type: 'recommendations',
      title: `Empfohlene Malze für ${beerStyle.charAt(0).toUpperCase() + beerStyle.slice(1)}`,
      products: recommendations.slice(0, 10)
    }
  }

  /**
   * Handle statistics queries
   */
  handleStatistics(query) {
    const stats = {
      totalSuppliers: this.suppliers.length,
      totalProducts: 0,
      productsBySupplier: {},
      categoryCounts: {}
    }

    // Count products
    for (const [supplierName, supplierData] of Object.entries(this.products)) {
      if (!supplierData.categories) continue

      let supplierProductCount = 0
      for (const [category, products] of Object.entries(supplierData.categories)) {
        const count = products.length
        supplierProductCount += count
        stats.totalProducts += count
        stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + count
      }
      stats.productsBySupplier[supplierName] = supplierProductCount
    }

    return {
      type: 'statistics',
      title: 'Dashboard-Statistiken',
      stats
    }
  }

  /**
   * Handle certification queries
   */
  handleCertification(query) {
    const certResults = []

    for (const supplier of this.suppliers) {
      certResults.push({
        name: supplier.name,
        certifications: supplier.certifications || []
      })
    }

    return {
      type: 'certifications',
      title: 'Zertifizierungen der Lieferanten',
      suppliers: certResults
    }
  }

  /**
   * Handle color-related queries
   */
  handleColorQuery(query) {
    const results = []

    for (const [supplierName, supplierData] of Object.entries(this.products)) {
      if (!supplierData.categories) continue

      for (const [category, products] of Object.entries(supplierData.categories)) {
        for (const product of products) {
          results.push({
            name: product.name,
            supplier: supplierName,
            ebc: product.color.ebc,
            category: product.color.category
          })
        }
      }
    }

    // Sort by EBC value
    results.sort((a, b) => this.parseEBC(a.ebc) - this.parseEBC(b.ebc))

    return {
      type: 'color_chart',
      title: 'Malzfarben (sortiert nach EBC)',
      products: results
    }
  }

  /**
   * Handle general queries
   */
  handleGeneralQuery(query) {
    return {
      type: 'help',
      message: 'Ich kann Ihnen bei folgenden Themen helfen:',
      suggestions: [
        'Produktvergleiche: "Vergleiche Weyermann Pilsner mit Bestmalz Pilsner"',
        'ESG-Analysen: "Welcher Lieferant hat die beste ESG-Bewertung?"',
        'Produktsuche: "Zeige alle Röstmalze"',
        'Empfehlungen: "Welches Malz für Pilsner?"',
        'Statistiken: "Wie viele Produkte hat jeder Lieferant?"',
        'Zertifizierungen: "Welche Lieferanten haben ISO 50001?"',
        'Farbvergleiche: "Zeige alle sehr hellen Malze"'
      ]
    }
  }

  /**
   * Helper: Extract supplier names from query
   */
  extractSupplierNames(query) {
    const names = []
    for (const supplier of this.suppliers) {
      const simpleName = supplier.name.toLowerCase()
        .replace('gmbh', '')
        .replace('& co. kg', '')
        .trim()

      if (query.includes(simpleName) || query.includes(supplier.name.toLowerCase())) {
        names.push(supplier.name)
      }
    }
    return names
  }

  /**
   * Helper: Extract product names from query
   * Improved to handle "Supplier ProductType" patterns (e.g., "Weyermann Pilsner")
   */
  extractProductNames(query) {
    const foundProducts = []
    const queryLower = query.toLowerCase()

    // Extract supplier names from query
    const mentionedSuppliers = []
    for (const supplier of this.suppliers) {
      const simpleName = supplier.name.toLowerCase()
        .replace('gmbh', '')
        .replace('& co. kg', '')
        .trim()

      if (queryLower.includes(simpleName)) {
        mentionedSuppliers.push(supplier.name)
      }
    }

    // If suppliers are mentioned, look for product type keywords after them
    if (mentionedSuppliers.length > 0) {
      // Common product type keywords
      const productTypes = [
        'pilsner', 'pils', 'pale ale', 'wiener', 'münchner', 'munich',
        'weizen', 'wheat', 'roggen', 'rye', 'dinkel', 'spelt',
        'caramel', 'karamell', 'cara', 'chocolate', 'röst', 'roast',
        'rauch', 'smoke', 'sauermalz', 'melanoidin', 'biscuit',
        'amber', 'red', 'hell', 'dunkel', 'spezial', 'aromamalz'
      ]

      for (const supplierName of mentionedSuppliers) {
        const supplierData = this.products[supplierName]
        if (!supplierData || !supplierData.categories) continue

        // Find product type keywords in the query
        for (const productType of productTypes) {
          if (queryLower.includes(productType)) {
            // Search for products matching this type in this supplier's catalog
            for (const [category, products] of Object.entries(supplierData.categories)) {
              for (const product of products) {
                const productNameLower = product.name.toLowerCase()

                // Check if this product matches the type
                if (productNameLower.includes(productType)) {
                  foundProducts.push({
                    name: product.name,
                    supplier: supplierName,
                    matchType: 'supplier+type'
                  })
                  // Only take the first match per supplier+type combination
                  break
                }
              }
              if (foundProducts.some(p => p.supplier === supplierName)) break
            }
          }
        }
      }
    }

    // If no products found yet, try broader matching
    if (foundProducts.length === 0) {
      // Look for full product names or significant keywords
      for (const [supplierName, supplierData] of Object.entries(this.products)) {
        if (!supplierData.categories) continue

        for (const [category, products] of Object.entries(supplierData.categories)) {
          for (const product of products) {
            const productNameLower = product.name.toLowerCase()

            // Check for exact match or if query contains product name
            if (queryLower.includes(productNameLower)) {
              foundProducts.push({
                name: product.name,
                supplier: supplierName,
                matchType: 'exact'
              })
            } else {
              // Check for significant keyword matches (words > 4 chars)
              const productWords = productNameLower.split(/\s+/).filter(w => w.length > 4)
              const queryWords = queryLower.split(/\s+/)

              const matchCount = productWords.filter(pw =>
                queryWords.some(qw => qw.includes(pw) || pw.includes(qw))
              ).length

              // If more than half the significant words match, consider it a match
              if (matchCount > 0 && matchCount >= productWords.length / 2) {
                foundProducts.push({
                  name: product.name,
                  supplier: supplierName,
                  matchType: 'keyword',
                  matchCount
                })
              }
            }
          }
        }
      }
    }

    // Remove duplicates and sort by match quality
    const uniqueProducts = []
    const seenNames = new Set()

    // Prioritize: exact > supplier+type > keyword matches
    const sortedProducts = foundProducts.sort((a, b) => {
      const typeOrder = { 'exact': 0, 'supplier+type': 1, 'keyword': 2 }
      const orderA = typeOrder[a.matchType] || 3
      const orderB = typeOrder[b.matchType] || 3
      if (orderA !== orderB) return orderA - orderB
      return (b.matchCount || 0) - (a.matchCount || 0)
    })

    for (const product of sortedProducts) {
      const key = `${product.supplier}:${product.name}`
      if (!seenNames.has(key)) {
        seenNames.add(key)
        uniqueProducts.push(product.name)
      }
    }

    return uniqueProducts
  }

  /**
   * Helper: Count products for a supplier
   */
  countSupplierProducts(supplierName) {
    const supplierData = this.products[supplierName]
    if (!supplierData || !supplierData.categories) return 0

    let count = 0
    for (const products of Object.values(supplierData.categories)) {
      count += products.length
    }
    return count
  }

  /**
   * Suggest product comparisons
   */
  suggestProductComparisons(productName) {
    // Find similar products across suppliers
    const similar = []

    for (const [supplierName, supplierData] of Object.entries(this.products)) {
      if (!supplierData.categories) continue

      for (const [category, products] of Object.entries(supplierData.categories)) {
        for (const product of products) {
          // Check if product name contains similar keywords
          const baseName = productName.toLowerCase().replace(/weyermann|bestmalz|ireks/gi, '').trim()
          if (product.name.toLowerCase().includes(baseName)) {
            similar.push({
              name: product.name,
              supplier: supplierName
            })
          }
        }
      }
    }

    return {
      type: 'suggestions',
      message: `Möchten Sie ${productName} mit einem dieser Produkte vergleichen?`,
      products: similar.slice(0, 5)
    }
  }
}

export const aiQueryEngine = new AIQueryEngine()
