/**
 * Discovered Suppliers Service
 * Manages suppliers found through AI Assistant's supplier search
 */

const DISCOVERED_SUPPLIERS_KEY = 'paulaner_discovered_suppliers'

/**
 * Discovered Suppliers Service Class
 */
class DiscoveredSuppliersService {
  constructor() {
    this.loadSuppliers()
  }

  /**
   * Load discovered suppliers from localStorage
   */
  loadSuppliers() {
    try {
      const stored = localStorage.getItem(DISCOVERED_SUPPLIERS_KEY)
      this.suppliers = stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading discovered suppliers:', error)
      this.suppliers = []
    }
  }

  /**
   * Save suppliers to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(DISCOVERED_SUPPLIERS_KEY, JSON.stringify(this.suppliers))
    } catch (error) {
      console.error('Error saving discovered suppliers:', error)
    }
  }

  /**
   * Add a single supplier
   * @param {Object} supplier - Supplier data from AI search
   * @param {string} searchQuery - The original search query
   * @returns {boolean} Success status
   */
  addSupplier(supplier, searchQuery = '') {
    try {
      // Check if supplier already exists (by name)
      const existingIndex = this.suppliers.findIndex(
        s => s.firma?.toLowerCase() === supplier.firma?.toLowerCase()
      )

      const enrichedSupplier = {
        ...supplier,
        id: supplier.id || `DISCOVERED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        savedAt: new Date().toISOString(),
        searchQuery,
        source: 'ai-assistant'
      }

      if (existingIndex >= 0) {
        // Update existing supplier
        this.suppliers[existingIndex] = enrichedSupplier
        console.log('📝 Updated existing supplier:', supplier.firma)
      } else {
        // Add new supplier
        this.suppliers.push(enrichedSupplier)
        console.log('✨ Added new supplier:', supplier.firma)
      }

      this.saveToStorage()
      return true
    } catch (error) {
      console.error('Error adding supplier:', error)
      return false
    }
  }

  /**
   * Add multiple suppliers at once
   * @param {Array} suppliers - Array of supplier data
   * @param {string} searchQuery - The original search query
   * @returns {number} Number of suppliers added
   */
  addMultipleSuppliers(suppliers, searchQuery = '') {
    let added = 0
    suppliers.forEach(supplier => {
      if (this.addSupplier(supplier, searchQuery)) {
        added++
      }
    })
    return added
  }

  /**
   * Get all discovered suppliers
   * @returns {Array} Array of suppliers
   */
  getAllSuppliers() {
    return [...this.suppliers].sort((a, b) =>
      new Date(b.savedAt) - new Date(a.savedAt)
    )
  }

  /**
   * Get supplier by ID
   * @param {string} id - Supplier ID
   * @returns {Object|null} Supplier object or null
   */
  getSupplier(id) {
    return this.suppliers.find(s => s.id === id) || null
  }

  /**
   * Delete supplier
   * @param {string} id - Supplier ID
   * @returns {boolean} Success status
   */
  deleteSupplier(id) {
    try {
      const index = this.suppliers.findIndex(s => s.id === id)
      if (index >= 0) {
        this.suppliers.splice(index, 1)
        this.saveToStorage()
        console.log('🗑️ Deleted supplier:', id)
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting supplier:', error)
      return false
    }
  }

  /**
   * Get suppliers by search query
   * @param {string} searchQuery - Search query to filter by
   * @returns {Array} Filtered suppliers
   */
  getSuppliersByQuery(searchQuery) {
    const lowerQuery = searchQuery.toLowerCase()
    return this.suppliers.filter(s =>
      s.searchQuery?.toLowerCase().includes(lowerQuery) ||
      s.firma?.toLowerCase().includes(lowerQuery) ||
      s.produktpalette?.some(p => p.toLowerCase().includes(lowerQuery))
    )
  }

  /**
   * Get count of discovered suppliers
   * @returns {number} Total count
   */
  getCount() {
    return this.suppliers.length
  }

  /**
   * Export suppliers as JSON
   * @returns {string} JSON string
   */
  exportAsJSON() {
    return JSON.stringify(this.suppliers, null, 2)
  }

  /**
   * Export suppliers as CSV
   * @returns {string} CSV string
   */
  exportAsCSV() {
    if (this.suppliers.length === 0) {
      return 'Keine Daten zum Exportieren'
    }

    const headers = [
      'Firma',
      'Land',
      'Standort',
      'Typ',
      'Größe',
      'Mitarbeiter',
      'Produktpalette',
      'Zertifikate',
      'Gespeichert am',
      'Suchbegriff'
    ]

    const rows = this.suppliers.map(s => [
      s.firma || '',
      s.land || '',
      s.standort || '',
      s.typ || '',
      s.größe || '',
      s.mitarbeiter || '',
      (s.produktpalette || []).join('; '),
      (s.zertifikate || []).join('; '),
      new Date(s.savedAt).toLocaleDateString('de-DE'),
      s.searchQuery || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return csvContent
  }

  /**
   * Clear all discovered suppliers
   */
  clearAll() {
    this.suppliers = []
    this.saveToStorage()
    console.log('🗑️ Cleared all discovered suppliers')
  }
}

// Export singleton instance
export const discoveredSuppliersService = new DiscoveredSuppliersService()

// Export class for testing
export default DiscoveredSuppliersService
