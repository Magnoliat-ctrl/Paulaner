/**
 * Discovered Suppliers Page
 * View and manage suppliers found through AI Assistant
 */

import React, { useState, useEffect } from 'react'
import { discoveredSuppliersService } from '../services/discoveredSuppliersService'
import '../styles/DiscoveredSuppliers.css'

function DiscoveredSuppliers({ navigateTo }) {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterQuery, setFilterQuery] = useState('')

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = () => {
    setLoading(true)
    try {
      const allSuppliers = discoveredSuppliersService.getAllSuppliers()
      setSuppliers(allSuppliers)
    } catch (error) {
      console.error('Error loading suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Möchten Sie diesen Lieferanten wirklich löschen?')) {
      const success = discoveredSuppliersService.deleteSupplier(id)
      if (success) {
        loadSuppliers()
      }
    }
  }

  const handleExportCSV = () => {
    const csv = discoveredSuppliersService.exportAsCSV()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `discovered-suppliers-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportJSON = () => {
    const json = discoveredSuppliersService.exportAsJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `discovered-suppliers-${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClearAll = () => {
    if (window.confirm('Möchten Sie wirklich ALLE gefundenen Lieferanten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      discoveredSuppliersService.clearAll()
      loadSuppliers()
    }
  }

  const filteredSuppliers = filterQuery
    ? suppliers.filter(s =>
        s.firma?.toLowerCase().includes(filterQuery.toLowerCase()) ||
        s.searchQuery?.toLowerCase().includes(filterQuery.toLowerCase()) ||
        s.produktpalette?.some(p => p.toLowerCase().includes(filterQuery.toLowerCase()))
      )
    : suppliers

  if (loading) {
    return (
      <div className="page discovered-suppliers-page">
        <div className="loading">
          <div className="spinner" aria-label="Lädt..."></div>
        </div>
      </div>
    )
  }

  return (
    <div className="page discovered-suppliers-page">
      {/* Page Header */}
      <header className="page-header">
        <div className="header-top">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigateTo('dashboard')}
          >
            ← Zurück zum Dashboard
          </button>
          <div className="header-actions">
            {suppliers.length > 0 && (
              <>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportCSV}
                >
                  📄 CSV Export
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportJSON}
                >
                  📄 JSON Export
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleClearAll}
                >
                  🗑️ Alle löschen
                </button>
              </>
            )}
          </div>
        </div>
        <h1 className="page-title">
          <span className="page-icon">📚</span>
          Gefundene Lieferanten
        </h1>
        <p className="page-description">
          Über den AI Assistant gefundene und gespeicherte Lieferanten ({suppliers.length})
        </p>
      </header>

      {/* Empty State */}
      {suppliers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>Keine Lieferanten gespeichert</h2>
          <p>
            Nutzen Sie den AI Assistant, um nach Lieferanten zu suchen und speichern Sie interessante
            Ergebnisse, um sie hier zu verwalten.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigateTo('ai-assistant')}
          >
            🤖 Zum AI Assistant
          </button>
        </div>
      ) : (
        <>
          {/* Search Filter */}
          <div className="filter-section">
            <input
              type="text"
              className="filter-input"
              placeholder="Lieferanten filtern (Name, Produkt, Suchbegriff)..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
            {filterQuery && (
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setFilterQuery('')}
              >
                ✕ Filter löschen
              </button>
            )}
          </div>

          {/* Suppliers List */}
          <div className="suppliers-list">
            {filteredSuppliers.length === 0 ? (
              <div className="no-results">
                <p>Keine Lieferanten gefunden für "{filterQuery}"</p>
              </div>
            ) : (
              filteredSuppliers.map((supplier) => (
                <div key={supplier.id} className="supplier-card">
                  <div className="supplier-card-header">
                    <div>
                      <h3 className="supplier-name">{supplier.firma}</h3>
                      <div className="supplier-meta">
                        <span className="meta-item">
                          📍 {supplier.standort}, {supplier.land}
                        </span>
                        {supplier.searchQuery && (
                          <span className="meta-item search-query">
                            🔍 Gesucht: {supplier.searchQuery}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(supplier.id)}
                      title="Lieferant löschen"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="supplier-card-body">
                    <div className="supplier-info-grid">
                      <div className="info-item">
                        <label>Typ:</label>
                        <span>{supplier.typ || 'k. A.'}</span>
                      </div>
                      <div className="info-item">
                        <label>Größe:</label>
                        <span>{supplier.größe || 'k. A.'}</span>
                      </div>
                      <div className="info-item">
                        <label>Mitarbeiter:</label>
                        <span>{supplier.mitarbeiter || 'k. A.'}</span>
                      </div>
                      {supplier.website && (
                        <div className="info-item">
                          <label>Website:</label>
                          <a
                            href={supplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="website-link"
                          >
                            🔗 Website öffnen
                          </a>
                        </div>
                      )}
                    </div>

                    {supplier.produktpalette && supplier.produktpalette.length > 0 && (
                      <div className="supplier-products">
                        <label>Produktpalette:</label>
                        <div className="products-list">
                          {supplier.produktpalette.map((product, idx) => (
                            <span key={idx} className="product-tag">
                              {product}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {supplier.zertifikate && supplier.zertifikate.length > 0 && (
                      <div className="supplier-certifications">
                        <label>Zertifikate:</label>
                        <ul className="cert-list">
                          {supplier.zertifikate.map((cert, idx) => (
                            <li key={idx}>{cert}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="supplier-footer">
                      <span className="saved-date">
                        💾 Gespeichert am: {new Date(supplier.savedAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default DiscoveredSuppliers
