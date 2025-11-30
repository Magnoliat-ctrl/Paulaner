/**
 * Reports Page
 * Analytics, comparisons, and export functionality
 */

import React, { useState, useEffect } from 'react'
import { dataService } from '../services/dataService'
import { Bar, Line } from 'react-chartjs-2'
import '../styles/Reports.css'

function Reports({ navigateTo }) {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [selectedSuppliers, setSelectedSuppliers] = useState([])
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [analyticsData, suppliersData] = await Promise.all([
        dataService.getAnalytics(),
        dataService.getSuppliers()
      ])
      setAnalytics(analyticsData)
      setSuppliers(suppliersData)
    } catch (error) {
      console.error('Error loading reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSupplierToggle = (supplierId) => {
    if (selectedSuppliers.includes(supplierId)) {
      setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplierId))
    } else {
      setSelectedSuppliers([...selectedSuppliers, supplierId])
    }
  }

  const exportToCSV = () => {
    // Placeholder for CSV export
    alert('CSV-Export wird in der Produktivversion implementiert')
  }

  const exportToPDF = () => {
    // Placeholder for PDF export
    alert('PDF-Export wird in der Produktivversion implementiert')
  }

  if (loading) {
    return (
      <div className="page reports-page">
        <div className="loading"><div className="spinner"></div></div>
      </div>
    )
  }

  return (
    <div className="page reports-page">
      <header className="page-header">
        <h1 className="page-title">Berichte & Analytik</h1>
        <p className="page-description">Interaktive Auswertungen und Vergleichsberichte</p>
      </header>

      <div className="report-actions">
        <button className="btn btn-outline" onClick={exportToCSV}>
          📊 Als CSV exportieren
        </button>
        <button className="btn btn-outline" onClick={exportToPDF}>
          📄 Als PDF exportieren
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowComparison(!showComparison)}
        >
          {showComparison ? 'Übersicht anzeigen' : 'Lieferanten vergleichen'}
        </button>
      </div>

      {showComparison ? (
        <div className="comparison-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Lieferantenvergleich</h2>
              <p className="card-subtitle">Wählen Sie 2-5 Lieferanten zum Vergleichen</p>
            </div>
            <div className="card-body">
              <div className="supplier-selection">
                {suppliers.slice(0, 10).map(supplier => (
                  <label key={supplier.id} className="supplier-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedSuppliers.includes(supplier.id)}
                      onChange={() => handleSupplierToggle(supplier.id)}
                    />
                    <span>{supplier.name}</span>
                  </label>
                ))}
              </div>

              {selectedSuppliers.length >= 2 && (
                <div className="comparison-table">
                  <h3>Vergleichstabelle</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Kriterium</th>
                        {selectedSuppliers.map(id => {
                          const supplier = suppliers.find(s => s.id === id)
                          return <th key={id}>{supplier.name}</th>
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Performance and compliance metrics removed - not available during tender process */}
                      <tr>
                        <td colSpan={selectedSuppliers.length + 1} className="text-center">
                          <em>Performance- und Compliance-Daten sind während des Tender-Prozesses nicht verfügbar.</em>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="analytics-section">
          {/* Top Performers */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Top-Lieferanten</h2>
            </div>
            <div className="card-body">
              <div className="top-performers-list">
                {analytics.topPerformers.map((supplier, index) => (
                  <div
                    key={supplier.id}
                    className="performer-item"
                    onClick={() => navigateTo('profile', { supplierId: supplier.id })}
                  >
                    <span className="rank">#{index + 1}</span>
                    <span className="name">{supplier.name}</span>
                    <span className="score">{supplier.avgRating}/10</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Statistics */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Kategorie-Statistiken</h2>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Kategorie</th>
                    <th>Anzahl Lieferanten</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.categoryDistribution.map(cat => (
                    <tr key={cat.category}>
                      <td>{cat.category}</td>
                      <td>{cat.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
