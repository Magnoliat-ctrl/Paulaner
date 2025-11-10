/**
 * Memory Service
 * Client-side memory management using localStorage
 * Stores user preferences, search history, and personalization data
 *
 * FUTURE ENHANCEMENT:
 * This localStorage-based implementation should be replaced with:
 * - Server-side session management
 * - Database storage (MongoDB/PostgreSQL)
 * - Vector database for semantic search (Pinecone, Weaviate, etc.)
 * - User authentication integration
 */

const MEMORY_KEY = 'paulaner_supplier_portal_memory'

/**
 * Default User Memory Structure
 */
const defaultMemory = {
  userId: 'guest',
  lastPage: 'dashboard',
  searchHistory: [],
  visitedSuppliers: [],
  filterPreferences: {
    category: '',
    location: '',
    minRating: 0,
    certifications: [],
    complianceStatus: 'all'
  },
  ratingWeights: {
    quality: 20,
    delivery: 15,
    cost: 15,
    reliability: 20,
    innovation: 10,
    communication: 10,
    esg: 10
  },
  notifications: {
    enabled: true,
    emailAlerts: true,
    complianceAlerts: true,
    ratingReminders: true
  },
  preferences: {
    language: 'de',
    theme: 'light',
    dashboardLayout: 'default'
  },
  lastLogin: null,
  createdAt: new Date().toISOString()
}

/**
 * Memory Service Class
 */
class MemoryService {
  constructor() {
    this.memory = null
    this.initialize()
  }

  /**
   * Initialize memory from localStorage
   */
  initialize() {
    try {
      const stored = localStorage.getItem(MEMORY_KEY)
      if (stored) {
        this.memory = JSON.parse(stored)
        // Update last login
        this.memory.lastLogin = new Date().toISOString()
        this.save()
      } else {
        this.memory = { ...defaultMemory }
        this.save()
      }
    } catch (error) {
      console.error('Error initializing memory:', error)
      this.memory = { ...defaultMemory }
    }
  }

  /**
   * Save memory to localStorage
   */
  save() {
    try {
      localStorage.setItem(MEMORY_KEY, JSON.stringify(this.memory))
    } catch (error) {
      console.error('Error saving memory:', error)
    }
  }

  /**
   * Load user memory
   * @returns {Object} User memory object
   */
  loadUserMemory() {
    return { ...this.memory }
  }

  /**
   * Update last visited page
   * @param {string} page - Page identifier
   */
  updateLastPage(page) {
    this.memory.lastPage = page
    this.save()
  }

  /**
   * Add search query to history
   * @param {string} query - Search query
   * @param {Array} results - Search results
   */
  addSearchQuery(query, results = []) {
    const searchEntry = {
      query,
      timestamp: new Date().toISOString(),
      resultCount: results.length,
      topResults: results.slice(0, 3).map(r => r.id)
    }

    // Keep only last 50 searches
    this.memory.searchHistory.unshift(searchEntry)
    if (this.memory.searchHistory.length > 50) {
      this.memory.searchHistory = this.memory.searchHistory.slice(0, 50)
    }

    this.save()
  }

  /**
   * Get recent search queries
   * @param {number} limit - Number of recent queries to return
   * @returns {Array} Recent search queries
   */
  getRecentSearches(limit = 10) {
    return this.memory.searchHistory.slice(0, limit)
  }

  /**
   * Add visited supplier
   * @param {string} supplierId - Supplier ID
   */
  addVisitedSupplier(supplierId) {
    const visitEntry = {
      id: supplierId,
      timestamp: new Date().toISOString()
    }

    // Remove existing entry if present
    this.memory.visitedSuppliers = this.memory.visitedSuppliers.filter(
      v => v.id !== supplierId
    )

    // Add to beginning
    this.memory.visitedSuppliers.unshift(visitEntry)

    // Keep only last 50 visits
    if (this.memory.visitedSuppliers.length > 50) {
      this.memory.visitedSuppliers = this.memory.visitedSuppliers.slice(0, 50)
    }

    this.save()
  }

  /**
   * Get recently visited suppliers
   * @param {number} limit - Number of recent visits to return
   * @returns {Array} Recently visited supplier IDs
   */
  getRecentlyVisited(limit = 10) {
    return this.memory.visitedSuppliers.slice(0, limit).map(v => v.id)
  }

  /**
   * Update filter preferences
   * @param {Object} filters - Filter settings
   */
  updateFilterPreferences(filters) {
    this.memory.filterPreferences = {
      ...this.memory.filterPreferences,
      ...filters
    }
    this.save()
  }

  /**
   * Get filter preferences
   * @returns {Object} Filter preferences
   */
  getFilterPreferences() {
    return { ...this.memory.filterPreferences }
  }

  /**
   * Update rating weights
   * @param {Object} weights - Weight settings for rating categories
   */
  updateRatingWeights(weights) {
    this.memory.ratingWeights = {
      ...this.memory.ratingWeights,
      ...weights
    }
    this.save()
  }

  /**
   * Get rating weights
   * @returns {Object} Rating weights
   */
  getRatingWeights() {
    return { ...this.memory.ratingWeights }
  }

  /**
   * Update notification settings
   * @param {Object} settings - Notification settings
   */
  updateNotificationSettings(settings) {
    this.memory.notifications = {
      ...this.memory.notifications,
      ...settings
    }
    this.save()
  }

  /**
   * Get notification settings
   * @returns {Object} Notification settings
   */
  getNotificationSettings() {
    return { ...this.memory.notifications }
  }

  /**
   * Update user preferences
   * @param {Object} preferences - User preferences
   */
  updatePreferences(preferences) {
    this.memory.preferences = {
      ...this.memory.preferences,
      ...preferences
    }
    this.save()
  }

  /**
   * Get user preferences
   * @returns {Object} User preferences
   */
  getPreferences() {
    return { ...this.memory.preferences }
  }

  /**
   * Clear all memory (reset to default)
   */
  clearMemory() {
    this.memory = { ...defaultMemory }
    this.save()
  }

  /**
   * Export memory for backup or analysis
   * @returns {string} JSON string of memory
   */
  exportMemory() {
    return JSON.stringify(this.memory, null, 2)
  }

  /**
   * Import memory from backup
   * @param {string} jsonString - JSON string of memory
   * @returns {boolean} Success status
   */
  importMemory(jsonString) {
    try {
      const imported = JSON.parse(jsonString)
      this.memory = imported
      this.save()
      return true
    } catch (error) {
      console.error('Error importing memory:', error)
      return false
    }
  }

  /**
   * Get personalized recommendations based on memory
   * This is a placeholder for future AI-powered recommendations
   * @returns {Object} Recommendation data
   */
  getPersonalizedRecommendations() {
    // FUTURE ENHANCEMENT:
    // This method should integrate with AI service to provide:
    // - Supplier suggestions based on search history
    // - Similar suppliers based on visited profiles
    // - Predicted needs based on rating patterns

    const recentSuppliers = this.getRecentlyVisited(5)
    const recentSearches = this.getRecentSearches(5)

    return {
      recentlyViewed: recentSuppliers,
      popularSearches: recentSearches.map(s => s.query),
      suggestedCategories: [], // To be implemented with AI
      similarSuppliers: [] // To be implemented with AI
    }
  }
}

// Export singleton instance
export const memoryService = new MemoryService()

// Export class for testing
export default MemoryService
