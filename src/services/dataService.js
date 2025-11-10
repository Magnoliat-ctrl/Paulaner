/**
 * Data Service
 * Manages supplier data, ratings, and analytics
 * Currently uses mock data; should be replaced with API calls
 *
 * FUTURE ENHANCEMENT:
 * Replace with REST API calls to backend:
 * - GET /api/suppliers
 * - GET /api/suppliers/:id
 * - POST /api/suppliers/:id/ratings
 * - GET /api/analytics
 * - etc.
 */

import {
  getAllSuppliers,
  getSupplierById,
  getSuppliersByCategory,
  getAllCategories,
  getAllRegions
} from '../data/supplierData'

const RATINGS_KEY = 'paulaner_supplier_ratings'
const ANALYTICS_KEY = 'paulaner_analytics_data'

/**
 * Data Service Class
 */
class DataService {
  constructor() {
    this.suppliers = getAllSuppliers()
    this.loadRatings()
    this.initializeAnalytics()
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
      totalSuppliers: this.suppliers.length,
      totalRatings: 0,
      averageRating: 0,
      complianceViolations: 0,
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Get all suppliers
   * @returns {Promise<Array>} Array of suppliers
   */
  async getSuppliers() {
    // Simulate API call delay
    await this.delay(100)

    // Merge mock data with custom ratings
    return this.suppliers.map(supplier => ({
      ...supplier,
      ratings: [
        ...supplier.ratings,
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

    const supplier = getSupplierById(id)
    if (!supplier) return null

    // Add custom ratings
    return {
      ...supplier,
      ratings: [
        ...supplier.ratings,
        ...this.customRatings.filter(r => r.supplierId === id)
      ]
    }
  }

  /**
   * Search suppliers
   * @param {Object} params - Search parameters
   * @returns {Promise<Array>} Filtered suppliers
   */
  async searchSuppliers(params) {
    await this.delay(150)

    const {
      query = '',
      category = '',
      location = '',
      minRating = 0,
      certifications = [],
      complianceStatus = 'all'
    } = params

    let results = await this.getSuppliers()

    // Filter by query (name, description, products)
    if (query) {
      const lowerQuery = query.toLowerCase()
      results = results.filter(supplier =>
        supplier.name.toLowerCase().includes(lowerQuery) ||
        supplier.description.toLowerCase().includes(lowerQuery) ||
        supplier.products.some(p => p.toLowerCase().includes(lowerQuery))
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
        const avgRating = this.calculateAverageRating(s.ratings)
        return avgRating >= minRating
      })
    }

    // Filter by certifications
    if (certifications.length > 0) {
      results = results.filter(s =>
        certifications.every(cert =>
          s.certifications.some(c => c.includes(cert))
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
   *
   * API PLACEHOLDER:
   * POST /api/suppliers/:supplierId/ratings
   * Body: { categories, weights, comment, userId }
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
      userId: 'current-user', // Should come from auth service
      timestamp: new Date().toISOString()
    }

    this.customRatings.push(newRating)
    this.saveRatings()
    this.updateAnalytics()

    return true
  }

  /**
   * Get categories
   * @returns {Promise<Array>} Array of categories
   */
  async getCategories() {
    await this.delay(50)
    return getAllCategories()
  }

  /**
   * Get regions
   * @returns {Promise<Array>} Array of regions
   */
  async getRegions() {
    await this.delay(50)
    return getAllRegions()
  }

  /**
   * Get dashboard metrics
   * @returns {Promise<Object>} Dashboard metrics
   */
  async getDashboardMetrics() {
    await this.delay(100)

    const suppliers = await this.getSuppliers()
    const totalSuppliers = suppliers.length

    // Calculate total ratings
    let totalRatings = 0
    let sumRatings = 0
    suppliers.forEach(s => {
      totalRatings += s.ratings.length
      s.ratings.forEach(r => {
        sumRatings += r.overallScore
      })
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
      if (s.ratings.length === 0) return true
      const lastRating = new Date(s.ratings[0].date)
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
      const supplier = this.suppliers.find(s => s.id === rating.supplierId)
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
    const violations = this.suppliers.filter(s =>
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

    const suppliers = await this.getSuppliers()

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
      supplier.ratings.forEach(rating => {
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
        avgRating: this.calculateAverageRating(s.ratings)
      }))
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
}

// Export singleton instance
export const dataService = new DataService()

// Export class for testing
export default DataService
