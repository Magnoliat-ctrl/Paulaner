/**
 * Data Service
 * Manages supplier data with AI-powered discovery
 * Uses OpenAI to dynamically find and generate suppliers
 */

import { openaiService } from './openaiService'

const SUPPLIERS_KEY = 'paulaner_suppliers_cache'
const RATINGS_KEY = 'paulaner_supplier_ratings'
const ANALYTICS_KEY = 'paulaner_analytics_data'

/**
 * Data Service Class
 */
class DataService {
  constructor() {
    this.loadCachedSuppliers()
    this.loadRatings()
    this.initializeAnalytics()
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
   * Save suppliers to cache
   */
  saveSuppliers(suppliers) {
    try {
      // Merge with existing cached suppliers, avoid duplicates
      const existingIds = new Set(this.cachedSuppliers.map(s => s.id))
      const newSuppliers = suppliers.filter(s => !existingIds.has(s.id))

      this.cachedSuppliers = [...this.cachedSuppliers, ...newSuppliers]

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
   * Uses OpenAI to find and generate relevant suppliers
   * @param {Object} params - Search parameters
   * @returns {Promise<Array>} Filtered suppliers
   */
  async searchSuppliers(params) {
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
      // Use AI to find suppliers
      console.log('🤖 Searching with AI:', query)

      const aiSuppliers = await openaiService.findSuppliers(query, {
        category,
        location,
        certifications
      })

      console.log(`✅ Found ${aiSuppliers.length} suppliers via AI`)

      // Save to cache
      this.saveSuppliers(aiSuppliers)

      // Apply additional filters
      let results = aiSuppliers

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

      // Also search cached suppliers
      const cachedResults = this.filterCachedSuppliers(params)

      // Merge and deduplicate
      const allResults = [...results, ...cachedResults]
      const uniqueResults = Array.from(
        new Map(allResults.map(s => [s.id, s])).values()
      )

      return uniqueResults
    } catch (error) {
      console.error('AI search failed, using cached suppliers:', error)
      // Fallback to cached suppliers
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
    const categories = [...new Set(this.cachedSuppliers.map(s => s.category))]

    // Add common categories if cache is empty
    if (categories.length === 0) {
      return [
        'Rohstoffe - Hopfen',
        'Rohstoffe - Malz',
        'Verpackung',
        'Logistik',
        'IT & Technologie',
        'Energie',
        'Wartung & Instandhaltung'
      ]
    }

    return categories
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
