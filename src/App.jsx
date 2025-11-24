/**
 * Main App Component
 * Manages application state, routing, and layout
 */

import React, { useState, useEffect } from 'react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Dashboard from './pages/Dashboard'
import SupplierDiscovery from './pages/SupplierDiscovery'
import SupplierProfile from './pages/SupplierProfile'
import Rating from './pages/Rating'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import AIAssistant from './pages/AIAssistant'
import MarketReport from './pages/MarketReport'
import { memoryService } from './services/memoryService'
import './styles/App.css'

function App() {
  // Current page state
  const [currentPage, setCurrentPage] = useState('dashboard')

  // Selected supplier for profile view
  const [selectedSupplierId, setSelectedSupplierId] = useState(null)

  // Supplier to rate
  const [supplierToRate, setSupplierToRate] = useState(null)

  // User preferences and memory
  const [userMemory, setUserMemory] = useState(null)

  // Load user memory on component mount
  useEffect(() => {
    const memory = memoryService.loadUserMemory()
    setUserMemory(memory)

    // Restore last visited page if available
    if (memory.lastPage) {
      setCurrentPage(memory.lastPage)
    }
  }, [])

  // Save current page to memory when it changes
  useEffect(() => {
    if (userMemory) {
      memoryService.updateLastPage(currentPage)
    }
  }, [currentPage, userMemory])

  /**
   * Navigate to a specific page
   * @param {string} page - Page identifier
   * @param {object} params - Optional navigation parameters
   */
  const navigateTo = (page, params = {}) => {
    setCurrentPage(page)

    // Handle specific page parameters
    if (page === 'profile' && params.supplierId) {
      setSelectedSupplierId(params.supplierId)
      memoryService.addVisitedSupplier(params.supplierId)
    }

    if (page === 'rating' && params.supplier) {
      setSupplierToRate(params.supplier)
    }

    // Scroll to top on navigation
    window.scrollTo(0, 0)
  }

  /**
   * Render the current page component
   */
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard navigateTo={navigateTo} userMemory={userMemory} />

      case 'discovery':
        return <SupplierDiscovery navigateTo={navigateTo} userMemory={userMemory} />

      case 'profile':
        return (
          <SupplierProfile
            supplierId={selectedSupplierId}
            navigateTo={navigateTo}
          />
        )

      case 'rating':
        return (
          <Rating
            supplier={supplierToRate}
            navigateTo={navigateTo}
            onRatingComplete={() => {
              // Refresh dashboard after rating
              setCurrentPage('dashboard')
            }}
          />
        )

      case 'reports':
        return <Reports navigateTo={navigateTo} />

      case 'settings':
        return (
          <Settings
            userMemory={userMemory}
            onSettingsUpdate={(newMemory) => setUserMemory(newMemory)}
          />
        )

      case 'ai-assistant':
        return <AIAssistant navigateTo={navigateTo} />

      case 'market-report':
        return <MarketReport navigateTo={navigateTo} />

      default:
        return <Dashboard navigateTo={navigateTo} userMemory={userMemory} />
    }
  }

  return (
    <div className="app">
      <Header
        currentPage={currentPage}
        onNavigate={navigateTo}
      />

      <main className="main-content" role="main">
        {renderPage()}
      </main>

      <Footer />
    </div>
  )
}

export default App
