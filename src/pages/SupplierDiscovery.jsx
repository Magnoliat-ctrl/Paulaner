/**
 * Supplier Discovery Page
 * Search and filter suppliers with AI-powered recommendations
 */

import React, { useState, useEffect } from 'react'
import { dataService } from '../services/dataService'
import { openaiService } from '../services/openaiService'
import { memoryService } from '../services/memoryService'
import SearchBar from '../components/suppliers/SearchBar'
import FilterPanel from '../components/suppliers/FilterPanel'
import SupplierGrid from '../components/suppliers/SupplierGrid'
import '../styles/SupplierDiscovery.css'

function SupplierDiscovery({ navigateTo, userMemory }) {
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState([])
  const [filteredSuppliers, setFilteredSuppliers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    minRating: 0,
    certifications: [],
    complianceStatus: 'all'
  })
  const [categories, setCategories] = useState([])
  const [regions, setRegions] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [searchProgress, setSearchProgress] = useState(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    performSearch()
  }, [searchQuery, filters])

  /**
   * Load initial data and user preferences
   */
  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [suppliersData, categoriesData, regionsData] = await Promise.all([
        dataService.getSuppliers(),
        dataService.getCategories(),
        dataService.getRegions()
      ])

      setSuppliers(suppliersData)
      setFilteredSuppliers(suppliersData)
      setCategories(categoriesData)
      setRegions(regionsData)

      // Load saved filter preferences from memory
      if (userMemory && userMemory.filterPreferences) {
        setFilters(userMemory.filterPreferences)
      }
    } catch (error) {
      console.error('Error loading supplier data:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Perform search with current query and filters
   * Integrates with AI service for enhanced search
   */
  const performSearch = async () => {
    try {
      setSearchProgress('Starte Suche...')

      // Search with dataService and progress callback
      const results = await dataService.searchSuppliers({
        query: searchQuery,
        ...filters
      }, (progress) => {
        setSearchProgress(progress)
      })

      setFilteredSuppliers(results)

      // Save search to memory
      if (searchQuery) {
        memoryService.addSearchQuery(searchQuery, results)
      }

      // Get AI suggestions if query is not empty
      // AI INTEGRATION POINT: This calls the AI service to enhance search results
      if (searchQuery) {
        setSearchProgress('Lade KI-Vorschläge...')
        const suggestions = await openaiService.analyzeQuery(searchQuery, userMemory)
        setAiSuggestions(suggestions)

        // Optionally apply AI-suggested filters
        if (suggestions.suggestedFilters && Object.keys(filters).every(k => !filters[k])) {
          // Only apply if no manual filters are set
          // Uncomment to auto-apply AI suggestions:
          // setFilters(prev => ({ ...prev, ...suggestions.suggestedFilters }))
        }
      }

      setSearchProgress(null)
    } catch (error) {
      console.error('Error performing search:', error)
      setSearchProgress(null)
    }
  }

  /**
   * Handle search query change
   * @param {string} query - Search query
   */
  const handleSearchChange = (query) => {
    setSearchQuery(query)
  }

  /**
   * Handle filter change
   * @param {Object} newFilters - Updated filters
   */
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    // Save filter preferences to memory
    memoryService.updateFilterPreferences(newFilters)
  }

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    const emptyFilters = {
      category: '',
      location: '',
      minRating: 0,
      certifications: [],
      complianceStatus: 'all'
    }
    setFilters(emptyFilters)
    setSearchQuery('')
    setAiSuggestions(null)
  }

  /**
   * Apply AI suggested filters
   */
  const applyAiSuggestions = () => {
    if (aiSuggestions && aiSuggestions.suggestedFilters) {
      setFilters(prev => ({
        ...prev,
        ...aiSuggestions.suggestedFilters
      }))
    }
  }

  if (loading) {
    return (
      <div className="page supplier-discovery-page">
        <div className="loading">
          <div className="spinner" aria-label="Lädt..."></div>
        </div>
      </div>
    )
  }

  return (
    <div className="page supplier-discovery-page">
      {/* Page Header */}
      <header className="page-header">
        <h1 className="page-title">Lieferanten finden</h1>
        <p className="page-description">
          Durchsuchen und filtern Sie Lieferanten nach verschiedenen Kriterien
        </p>
      </header>

      {/* Search Bar */}
      <SearchBar
        query={searchQuery}
        onQueryChange={handleSearchChange}
        onSearch={performSearch}
        placeholder="Suche nach Lieferanten, Produkten, Standorten..."
      />

      {/* Search Progress Indicator */}
      {searchProgress && (
        <div className="search-progress" role="status" aria-live="polite">
          <div className="progress-content">
            <div className="spinner-small" aria-hidden="true"></div>
            <span className="progress-text">{searchProgress}</span>
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {aiSuggestions && !aiSuggestions.isAIGenerated && aiSuggestions.suggestedFilters && (
        <div className="ai-suggestions">
          <div className="alert alert-info">
            <div className="ai-suggestions-header">
              <span className="ai-icon" aria-hidden="true">🤖</span>
              <strong>KI-Vorschlag:</strong>
              {aiSuggestions.reasoning && (
                <span className="ai-reasoning">{aiSuggestions.reasoning}</span>
              )}
            </div>
            <button
              className="btn btn-sm btn-secondary"
              onClick={applyAiSuggestions}
              aria-label="KI-Vorschläge anwenden"
            >
              Vorschläge übernehmen
            </button>
          </div>
        </div>
      )}

      {/* Filter Toggle */}
      <div className="filter-toggle">
        <button
          className="btn btn-outline"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          aria-label="Filter anzeigen/verstecken"
        >
          <span aria-hidden="true">🔍</span>
          Filter {showFilters ? 'ausblenden' : 'anzeigen'}
        </button>

        {Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : v !== 0 && v !== 'all')) && (
          <button
            className="btn btn-sm btn-outline"
            onClick={handleClearFilters}
            aria-label="Alle Filter zurücksetzen"
          >
            Filter zurücksetzen
          </button>
        )}

        <span className="results-count">
          {filteredSuppliers.length} Lieferant{filteredSuppliers.length !== 1 ? 'en' : ''} gefunden
        </span>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          categories={categories}
          regions={regions}
        />
      )}

      {/* Results */}
      <SupplierGrid
        suppliers={filteredSuppliers}
        navigateTo={navigateTo}
        emptyMessage="Keine Lieferanten gefunden. Versuchen Sie, die Suchkriterien anzupassen."
      />
    </div>
  )
}

export default SupplierDiscovery
