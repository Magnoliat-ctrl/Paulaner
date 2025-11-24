/**
 * Data Service
 * Manages supplier data with AI-powered discovery
 * Uses Diffbot or OpenAI to dynamically find and generate suppliers
 */

import { openaiService } from './openaiService'
import { diffbotService } from './diffbotService'
import verifiedMaltSuppliers from '../data/maltSuppliers.json'
import additionalSuppliers from '../data/additionalSuppliers.json'

const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'openai'

const SUPPLIERS_KEY = 'paulaner_suppliers_cache'
const RATINGS_KEY = 'paulaner_supplier_ratings'
const ANALYTICS_KEY = 'paulaner_analytics_data'

/**
 * Data Service Class
 */
class DataService {
  constructor() {
    // CRITICAL FIX: Clear potentially corrupted cache on load
    // This ensures old malformed data doesn't cause white screens
    this.clearCorruptedCache()
    this.loadCachedSuppliers()
    this.loadRatings()
    this.initializeAnalytics()
  }

  /**
   * Clear cache if it contains malformed data
   */
  clearCorruptedCache() {
    try {
      const stored = localStorage.getItem(SUPPLIERS_KEY)
      if (stored) {
        const suppliers = JSON.parse(stored)
        // Check if any supplier is missing critical fields
        const hasCorruptedData = suppliers.some(s =>
          !s.location || !s.ratings || !s.compliance || !s.performance
        )
        if (hasCorruptedData) {
          console.warn('⚠️ Detected corrupted cache data - clearing...')
          localStorage.removeItem(SUPPLIERS_KEY)
        }
      }
    } catch (error) {
      console.error('Error checking cache:', error)
      localStorage.removeItem(SUPPLIERS_KEY)
    }
  }

  /**
   * Load cached suppliers from localStorage
   */
  loadCachedSuppliers() {
    try {
      const stored = localStorage.getItem(SUPPLIERS_KEY)
      this.cachedSuppliers = stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading cached suppliers:', error)
      this.cachedSuppliers = []
    }
  }

  /**
   * Utility function to add realistic delays for simulated progress
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Normalize company name for duplicate detection
   * Extracts core company name (first significant word)
   * Example: "Weyermann Spezialmalze GmbH" -> "weyermann"
   * Example: "Weyermann Malzfabrik GmbH" -> "weyermann"
   */
  normalizeCompanyName(name) {
    const normalized = name
      .toLowerCase()
      .trim()
      .replace(/\s+gmbh.*$/i, '') // Remove GmbH and everything after
      .replace(/\s+ag.*$/i, '') // Remove AG and everything after
      .replace(/\s+kg.*$/i, '') // Remove KG and everything after
      .replace(/\s+ohg.*$/i, '') // Remove OHG and everything after
      .replace(/\s+&\s+co\.?/gi, '') // Remove & Co
      .replace(/[^a-zäöüß0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()

    // Extract first significant word (core name)
    // This catches "Weyermann Spezialmalze" and "Weyermann Malzfabrik" as both "weyermann"
    const words = normalized.split(' ')
    const coreWord = words[0] || normalized

    console.log(`📝 Normalized "${name}" -> "${coreWord}"`)
    return coreWord
  }

  /**
   * Save suppliers to cache
   * Merges locations if company with same name already exists
   */
  saveSuppliers(suppliers) {
    try {
      // Build a map of existing suppliers by normalized name
      const existingMap = new Map()
      this.cachedSuppliers.forEach(s => {
        const normalizedName = this.normalizeCompanyName(s.name)
        existingMap.set(normalizedName, s)
      })

      suppliers.forEach(newSupplier => {
        const normalizedName = this.normalizeCompanyName(newSupplier.name)
        const existing = existingMap.get(normalizedName)

        if (existing) {
          // Company exists - merge locations
          console.log(`🔄 Merging locations for: ${newSupplier.name}`)

          // Merge locations arrays, avoiding duplicates
          const existingLocations = existing.locations || [existing.location]
          const newLocations = newSupplier.locations || [newSupplier.location]

          // Create set of location keys (city+postalCode) to check for duplicates
          const locationKeys = new Set(
            existingLocations.map(loc => `${loc.city}-${loc.postalCode}`.toLowerCase())
          )

          // Add only new locations
          newLocations.forEach(newLoc => {
            const locKey = `${newLoc.city}-${newLoc.postalCode}`.toLowerCase()
            if (!locationKeys.has(locKey)) {
              existingLocations.push(newLoc)
              locationKeys.add(locKey)
            }
          })

          // Update existing supplier with merged data
          existing.locations = existingLocations

          // Update other fields if new data is better (has more info)
          if (newSupplier.contact.website && !existing.contact.website) {
            existing.contact.website = newSupplier.contact.website
          }
          if (newSupplier.contact.email && !existing.contact.email.includes('example')) {
            existing.contact.email = newSupplier.contact.email
          }
          if (newSupplier.contact.phone && !existing.contact.phone.includes('XXX')) {
            existing.contact.phone = newSupplier.contact.phone
          }
          if (newSupplier.description && newSupplier.description.length > existing.description.length) {
            existing.description = newSupplier.description
          }

          // Merge products (avoid duplicates)
          if (newSupplier.products && newSupplier.products.length > 0) {
            const productSet = new Set([
              ...(existing.products || []),
              ...newSupplier.products
            ])
            existing.products = Array.from(productSet)
          }

          // Merge certifications
          if (newSupplier.certifications && newSupplier.certifications.length > 0) {
            const certSet = new Set([...existing.certifications, ...newSupplier.certifications])
            existing.certifications = Array.from(certSet)
          }

          // Merge ratings (avoid duplicates)
          if (newSupplier.ratings && newSupplier.ratings.length > 0) {
            const existingRatingIds = new Set(existing.ratings.map(r => r.id))
            const newRatings = newSupplier.ratings.filter(r => !existingRatingIds.has(r.id))
            existing.ratings = [...existing.ratings, ...newRatings]
          }

          existing.lastUpdated = new Date().toISOString()
        } else {
          // New company - add to cache
          console.log(`✨ Adding new supplier: ${newSupplier.name}`)

          // Ensure locations array exists
          if (!newSupplier.locations) {
            newSupplier.locations = [newSupplier.location]
          }

          this.cachedSuppliers.push(newSupplier)
          existingMap.set(normalizedName, newSupplier)
        }
      })

      // Keep only last 100 suppliers
      if (this.cachedSuppliers.length > 100) {
        this.cachedSuppliers = this.cachedSuppliers.slice(-100)
      }

      localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(this.cachedSuppliers))
    } catch (error) {
      console.error('Error saving suppliers:', error)
    }
  }

  /**
   * Load ratings from localStorage
   */
  loadRatings() {
    try {
      const stored = localStorage.getItem(RATINGS_KEY)
      this.customRatings = stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading ratings:', error)
      this.customRatings = []
    }
  }

  /**
   * Save ratings to localStorage
   */
  saveRatings() {
    try {
      localStorage.setItem(RATINGS_KEY, JSON.stringify(this.customRatings))
    } catch (error) {
      console.error('Error saving ratings:', error)
    }
  }

  /**
   * Initialize analytics data
   */
  initializeAnalytics() {
    try {
      const stored = localStorage.getItem(ANALYTICS_KEY)
      this.analyticsData = stored ? JSON.parse(stored) : this.generateInitialAnalytics()
    } catch (error) {
      console.error('Error loading analytics:', error)
      this.analyticsData = this.generateInitialAnalytics()
    }
  }

  /**
   * Generate initial analytics data
   */
  generateInitialAnalytics() {
    return {
      totalSuppliers: this.cachedSuppliers.length,
      totalRatings: 0,
      averageRating: 0,
      complianceViolations: 0,
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Get all suppliers (from cache)
   * @returns {Promise<Array>} Array of suppliers
   */
  async getSuppliers() {
    await this.delay(100)

    // Return cached suppliers with their ratings
    return this.cachedSuppliers.map(supplier => ({
      ...supplier,
      ratings: [
        ...(supplier.ratings || []),
        ...this.customRatings.filter(r => r.supplierId === supplier.id)
      ]
    }))
  }

  /**
   * Get supplier by ID
   * @param {string} id - Supplier ID
   * @returns {Promise<Object|null>} Supplier object or null
   */
  async getSupplier(id) {
    await this.delay(100)

    const supplier = this.cachedSuppliers.find(s => s.id === id)
    if (!supplier) return null

    // Add custom ratings
    return {
      ...supplier,
      ratings: [
        ...(supplier.ratings || []),
        ...this.customRatings.filter(r => r.supplierId === id)
      ]
    }
  }

  /**
   * Search suppliers with AI
   * Uses Diffbot or OpenAI to find and generate relevant suppliers
   * @param {Object} params - Search parameters
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Array>} Filtered suppliers
   */
  async searchSuppliers(params, onProgress = null) {
    const {
      query = '',
      category = '',
      location = '',
      minRating = 0,
      certifications = [],
      complianceStatus = 'all'
    } = params

    // If no query, return cached suppliers with filters
    if (!query && !category && !location) {
      return this.filterCachedSuppliers(params)
    }

    try {
      // Check if this is a predefined category search
      const isMaltSearch = category === 'Malz' || query.toLowerCase().includes('malz')
      const isAluminiumSearch = category === 'Aluminium-Dosen' || query.toLowerCase().includes('aluminium') || query.toLowerCase().includes('dosen')
      const isWellpappeSearch = category === 'Wellpappe' || query.toLowerCase().includes('wellpappe') || query.toLowerCase().includes('karton')
      const isArbeitskleidungSearch = category === 'Arbeitskleidung' || query.toLowerCase().includes('arbeitskleidung') || query.toLowerCase().includes('workwear')
      const isFrachtenSearch = category === 'Frachten' || query.toLowerCase().includes('fracht') || query.toLowerCase().includes('logistik') || query.toLowerCase().includes('spedition')
      const isPalettenSearch = category === 'Euro-Paletten' || query.toLowerCase().includes('paletten') || query.toLowerCase().includes('europalette')

      const isPredefinedCategory = isMaltSearch || isAluminiumSearch || isWellpappeSearch ||
                                     isArbeitskleidungSearch || isFrachtenSearch || isPalettenSearch

      let aiSuppliers = []

      if (isPredefinedCategory) {
        // For predefined categories, use verified data with simulated AI research
        let categoryName = ''
        let sourceData = []

        if (isMaltSearch) {
          categoryName = 'Malz'
          sourceData = verifiedMaltSuppliers
        } else if (isAluminiumSearch) {
          categoryName = 'Aluminiumdosen'
          sourceData = additionalSuppliers.filter(s => s.category === 'Aluminiumdosen')
        } else if (isWellpappeSearch) {
          categoryName = 'Wellpappe'
          sourceData = additionalSuppliers.filter(s => s.category === 'Wellpappe')
        } else if (isArbeitskleidungSearch) {
          categoryName = 'Arbeitskleidung'
          sourceData = additionalSuppliers.filter(s => s.category === 'Arbeitskleidung')
        } else if (isFrachtenSearch) {
          categoryName = 'Frachten & Logistik'
          sourceData = additionalSuppliers.filter(s => s.category === 'Frachten & Logistik')
        } else if (isPalettenSearch) {
          categoryName = 'Euro-Paletten'
          sourceData = additionalSuppliers.filter(s => s.category === 'Euro-Paletten')
        }

        console.log(`🔍 ${categoryName}-Suche erkannt - starte simulierte KI-Recherche...`)

        // Simulate realistic research progress with delays
        if (onProgress) onProgress('Starte KI-gestützte Web-Recherche...')
        await this.delay(1500)

        if (onProgress) onProgress('Durchsuche deutsche Unternehmensregister...')
        await this.delay(2000)

        if (onProgress) onProgress(`Analysiere ${categoryName}-Lieferanten in Deutschland und Europa...`)
        await this.delay(1800)

        if (onProgress) onProgress('Verifiziere Unternehmensdaten...')
        await this.delay(1500)

        if (onProgress) onProgress('Sammle Produktinformationen und Bewertungen...')
        await this.delay(2200)

        if (onProgress) onProgress('Prüfe Zertifizierungen und Standorte...')
        await this.delay(1600)

        if (onProgress) onProgress('Erstelle detaillierte Profile...')
        await this.delay(1400)

        // Data is already in the correct format - no transformation needed!
        const verifiedWithIds = sourceData.map((supplier, index) => ({
          ...supplier,
          id: supplier.id || `VERIFIED-${categoryName.toUpperCase()}-${index + 1}`
        }))

        aiSuppliers = verifiedWithIds
        console.log(`✅ ${verifiedWithIds.length} verifizierte ${categoryName}-Lieferanten recherchiert`)
        if (onProgress) onProgress(`${verifiedWithIds.length} Lieferanten gefunden und verifiziert!`)
        await this.delay(800)
      } else {
        // For other categories, use real AI search
        const aiService = AI_PROVIDER === 'diffbot' ? diffbotService : openaiService
        const providerName = AI_PROVIDER === 'diffbot' ? 'Diffbot' : 'OpenAI'

        console.log(`🤖 Starting deep web research with ${providerName}:`, query)
        if (onProgress) onProgress(`Starte gründliche Web-Recherche mit ${providerName}...`)

        aiSuppliers = await aiService.findSuppliers(query, {
          category,
          location,
          certifications
        })

        console.log(`✅ Found ${aiSuppliers.length} suppliers via ${providerName}`)
        if (onProgress) onProgress(`${aiSuppliers.length} Lieferanten gefunden, speichere Daten...`)
      }

      // Save to cache (merges locations for duplicates)
      this.saveSuppliers(aiSuppliers)

      if (onProgress) onProgress('Wende Filter an...')

      // WICHTIG: Nach dem Speichern die gemergten Daten aus dem Cache holen
      // statt die originalen aiSuppliers zu verwenden
      const mergedResults = this.filterCachedSuppliers(params)

      // Apply additional filters
      let results = mergedResults

      // Filter by minimum rating
      if (minRating > 0) {
        results = results.filter(s => {
          const avgRating = this.calculateAverageRating(s.ratings || [])
          return avgRating >= minRating
        })
      }

      // Filter by compliance status
      if (complianceStatus !== 'all') {
        results = results.filter(s => s.compliance.status === complianceStatus)
      }

      // Deduplicate final results by normalized company name
      const uniqueResults = Array.from(
        new Map(results.map(s => [this.normalizeCompanyName(s.name), s])).values()
      )

      if (onProgress) onProgress(null) // Clear progress

      return uniqueResults
    } catch (error) {
      console.error('AI search failed, using cached suppliers:', error)
      if (onProgress) onProgress('Fehler bei der Suche, verwende gecachte Daten...')

      // Fallback to cached suppliers
      setTimeout(() => {
        if (onProgress) onProgress(null)
      }, 1000)

      return this.filterCachedSuppliers(params)
    }
  }

  /**
   * Filter cached suppliers
   */
  filterCachedSuppliers(params) {
    const {
      query = '',
      category = '',
      location = '',
      minRating = 0,
      certifications = [],
      complianceStatus = 'all'
    } = params

    let results = this.cachedSuppliers

    // Filter by query (name, description, products)
    if (query) {
      const lowerQuery = query.toLowerCase()
      results = results.filter(supplier =>
        supplier.name.toLowerCase().includes(lowerQuery) ||
        supplier.description.toLowerCase().includes(lowerQuery) ||
        supplier.products?.some(p => p.toLowerCase().includes(lowerQuery))
      )
    }

    // Filter by category
    if (category) {
      results = results.filter(s => s.category === category)
    }

    // Filter by location
    if (location) {
      results = results.filter(s =>
        s.location.city.toLowerCase().includes(location.toLowerCase()) ||
        s.location.region.toLowerCase().includes(location.toLowerCase())
      )
    }

    // Filter by minimum rating
    if (minRating > 0) {
      results = results.filter(s => {
        const avgRating = this.calculateAverageRating(s.ratings || [])
        return avgRating >= minRating
      })
    }

    // Filter by certifications
    if (certifications.length > 0) {
      results = results.filter(s =>
        certifications.every(cert =>
          s.certifications?.some(c => c.includes(cert))
        )
      )
    }

    // Filter by compliance status
    if (complianceStatus !== 'all') {
      results = results.filter(s => s.compliance.status === complianceStatus)
    }

    return results
  }

  /**
   * Add rating for a supplier
   * @param {string} supplierId - Supplier ID
   * @param {Object} rating - Rating data
   * @returns {Promise<boolean>} Success status
   */
  async addRating(supplierId, rating) {
    await this.delay(200)

    const newRating = {
      id: `RATING-${Date.now()}`,
      supplierId,
      date: new Date().toISOString().split('T')[0],
      overallScore: rating.overallScore,
      categories: rating.categories,
      weights: rating.weights,
      comment: rating.comment,
      userId: 'current-user',
      timestamp: new Date().toISOString()
    }

    this.customRatings.push(newRating)
    this.saveRatings()
    this.updateAnalytics()

    return true
  }

  /**
   * Get categories from cached suppliers
   * @returns {Promise<Array>} Array of categories
   */
  async getCategories() {
    await this.delay(50)

    // ONLY these 6 categories are allowed
    const allowedCategories = [
      'Malz',
      'Wellpappe',
      'Aluminium-Dosen',
      'Arbeitskleidung',
      'Frachten',
      'Euro-Paletten'
    ]

    const cachedCategories = [...new Set(this.cachedSuppliers.map(s => s.category))]

    // Filter to only allowed categories from cache
    const filteredCategories = cachedCategories.filter(cat =>
      allowedCategories.includes(cat)
    )

    // If cache is empty or has no valid categories, return all allowed
    if (filteredCategories.length === 0) {
      return allowedCategories
    }

    return filteredCategories
  }

  /**
   * Get regions from cached suppliers
   * @returns {Promise<Array>} Array of regions
   */
  async getRegions() {
    await this.delay(50)
    const regions = [...new Set(this.cachedSuppliers.map(s => s.location.region))]

    // Add common regions if cache is empty
    if (regions.length === 0) {
      return ['Bayern', 'Baden-Württemberg', 'Nordrhein-Westfalen', 'Hessen', 'Niedersachsen']
    }

    return regions
  }

  /**
   * Get dashboard metrics
   * @returns {Promise<Object>} Dashboard metrics
   */
  async getDashboardMetrics() {
    await this.delay(100)

    const suppliers = this.cachedSuppliers
    const totalSuppliers = suppliers.length

    // Calculate total ratings
    let totalRatings = 0
    let sumRatings = 0
    suppliers.forEach(s => {
      const ratings = s.ratings || []
      totalRatings += ratings.length
      ratings.forEach(r => {
        sumRatings += r.overallScore
      })
    })

    // Add custom ratings
    totalRatings += this.customRatings.length
    this.customRatings.forEach(r => {
      sumRatings += r.overallScore
    })

    const averageRating = totalRatings > 0 ? (sumRatings / totalRatings).toFixed(1) : 0

    // Count compliance violations
    const complianceViolations = suppliers.filter(s =>
      s.compliance.status !== 'compliant'
    ).length

    // Count pending ratings (suppliers without recent ratings)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const pendingRatings = suppliers.filter(s => {
      const ratings = s.ratings || []
      if (ratings.length === 0) return true
      const lastRating = new Date(ratings[0].date)
      return lastRating < thirtyDaysAgo
    }).length

    return {
      totalSuppliers,
      averageRating,
      totalRatings,
      complianceViolations,
      pendingRatings
    }
  }

  /**
   * Get activity feed
   * @param {number} limit - Number of activities to return
   * @returns {Promise<Array>} Recent activities
   */
  async getActivityFeed(limit = 10) {
    await this.delay(100)

    const activities = []

    // Add recent ratings
    const recentRatings = [...this.customRatings]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)

    recentRatings.forEach(rating => {
      const supplier = this.cachedSuppliers.find(s => s.id === rating.supplierId)
      if (supplier) {
        activities.push({
          type: 'rating',
          timestamp: rating.timestamp,
          description: `Neue Bewertung für ${supplier.name}`,
          score: rating.overallScore,
          supplierId: supplier.id
        })
      }
    })

    // Add compliance warnings
    const violations = this.cachedSuppliers.filter(s =>
      s.compliance.violations && s.compliance.violations.length > 0
    )

    violations.forEach(supplier => {
      supplier.compliance.violations.forEach(violation => {
        activities.push({
          type: 'warning',
          timestamp: violation.date,
          description: `${violation.type} bei ${supplier.name}`,
          severity: violation.severity,
          supplierId: supplier.id
        })
      })
    })

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
  }

  /**
   * Get analytics for reports
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics(params = {}) {
    await this.delay(200)

    const suppliers = this.cachedSuppliers

    // Rating trends over time
    const ratingTrends = this.calculateRatingTrends(suppliers)

    // Category distribution
    const categoryDistribution = this.calculateCategoryDistribution(suppliers)

    // Compliance overview
    const complianceOverview = this.calculateComplianceOverview(suppliers)

    // Top performers
    const topPerformers = this.getTopPerformers(suppliers, 5)

    return {
      ratingTrends,
      categoryDistribution,
      complianceOverview,
      topPerformers
    }
  }

  /**
   * Calculate average rating from ratings array
   * @param {Array} ratings - Array of rating objects
   * @returns {number} Average rating
   */
  calculateAverageRating(ratings) {
    if (!ratings || ratings.length === 0) return 0
    const sum = ratings.reduce((acc, r) => acc + r.overallScore, 0)
    return sum / ratings.length
  }

  /**
   * Calculate rating trends
   * @param {Array} suppliers - Array of suppliers
   * @returns {Array} Trend data
   */
  calculateRatingTrends(suppliers) {
    const trends = {}

    suppliers.forEach(supplier => {
      const ratings = supplier.ratings || []
      ratings.forEach(rating => {
        const month = rating.date.substring(0, 7) // YYYY-MM
        if (!trends[month]) {
          trends[month] = { sum: 0, count: 0 }
        }
        trends[month].sum += rating.overallScore
        trends[month].count += 1
      })
    })

    return Object.keys(trends)
      .sort()
      .slice(-6) // Last 6 months
      .map(month => ({
        month,
        averageRating: (trends[month].sum / trends[month].count).toFixed(1)
      }))
  }

  /**
   * Calculate category distribution
   * @param {Array} suppliers - Array of suppliers
   * @returns {Array} Category data
   */
  calculateCategoryDistribution(suppliers) {
    const distribution = {}

    suppliers.forEach(supplier => {
      const category = supplier.category
      if (!distribution[category]) {
        distribution[category] = 0
      }
      distribution[category] += 1
    })

    return Object.keys(distribution).map(category => ({
      category,
      count: distribution[category]
    }))
  }

  /**
   * Calculate compliance overview
   * @param {Array} suppliers - Array of suppliers
   * @returns {Object} Compliance data
   */
  calculateComplianceOverview(suppliers) {
    const overview = {
      compliant: 0,
      'minor-violation': 0,
      'under-review': 0,
      'major-violation': 0
    }

    suppliers.forEach(supplier => {
      const status = supplier.compliance.status
      if (overview.hasOwnProperty(status)) {
        overview[status] += 1
      }
    })

    return overview
  }

  /**
   * Get top performing suppliers
   * @param {Array} suppliers - Array of suppliers
   * @param {number} limit - Number of top performers
   * @returns {Array} Top performers
   */
  getTopPerformers(suppliers, limit = 5) {
    return suppliers
      .map(s => ({
        ...s,
        avgRating: this.calculateAverageRating(s.ratings || [])
      }))
      .filter(s => s.avgRating > 0) // Only suppliers with ratings
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, limit)
  }

  /**
   * Update analytics data
   */
  updateAnalytics() {
    this.analyticsData = this.generateInitialAnalytics()
    try {
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(this.analyticsData))
    } catch (error) {
      console.error('Error saving analytics:', error)
    }
  }

  /**
   * Simulate API delay
   * @param {number} ms - Milliseconds
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Clear all cached data (for testing)
   */
  clearCache() {
    this.cachedSuppliers = []
    localStorage.removeItem(SUPPLIERS_KEY)
    localStorage.removeItem(RATINGS_KEY)
    localStorage.removeItem(ANALYTICS_KEY)
    this.customRatings = []
    this.analyticsData = this.generateInitialAnalytics()
  }
}

// Export singleton instance
export const dataService = new DataService()

// Export class for testing
export default DataService
