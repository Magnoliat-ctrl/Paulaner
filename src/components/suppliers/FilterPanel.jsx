/**
 * Filter Panel Component
 * Advanced filtering options for supplier search
 */

import React from 'react'
import '../../styles/FilterPanel.css'

function FilterPanel({ filters, onFilterChange, categories, regions }) {
  const handleChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    })
  }

  const handleCertificationToggle = (cert) => {
    const currentCerts = filters.certifications || []
    const newCerts = currentCerts.includes(cert)
      ? currentCerts.filter(c => c !== cert)
      : [...currentCerts, cert]

    onFilterChange({
      ...filters,
      certifications: newCerts
    })
  }

  const availableCertifications = [
    'ISO 9001',
    'ISO 14001',
    'ISO 27001',
    'Bio-Zertifizierung',
    'FSSC 22000',
    'GlobalG.A.P.',
    'FSC'
  ]

  return (
    <div className="filter-panel card">
      <div className="filter-panel-content">
        {/* Category Filter */}
        <div className="filter-group">
          <label htmlFor="filter-category" className="filter-label">
            Kategorie
          </label>
          <select
            id="filter-category"
            className="filter-select"
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            <option value="">Alle Kategorien</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div className="filter-group">
          <label htmlFor="filter-location" className="filter-label">
            Standort
          </label>
          <select
            id="filter-location"
            className="filter-select"
            value={filters.location}
            onChange={(e) => handleChange('location', e.target.value)}
          >
            <option value="">Alle Standorte</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        {/* Min Rating Filter */}
        <div className="filter-group">
          <label htmlFor="filter-rating" className="filter-label">
            Mindestbewertung: {filters.minRating}/10
          </label>
          <input
            id="filter-rating"
            type="range"
            className="filter-range"
            min="0"
            max="10"
            step="0.5"
            value={filters.minRating}
            onChange={(e) => handleChange('minRating', parseFloat(e.target.value))}
            aria-label="Mindestbewertung"
          />
          <div className="filter-range-labels">
            <span>0</span>
            <span>10</span>
          </div>
        </div>

        {/* Compliance Status Filter */}
        <div className="filter-group">
          <label htmlFor="filter-compliance" className="filter-label">
            Compliance-Status
          </label>
          <select
            id="filter-compliance"
            className="filter-select"
            value={filters.complianceStatus}
            onChange={(e) => handleChange('complianceStatus', e.target.value)}
          >
            <option value="all">Alle Status</option>
            <option value="compliant">Konform</option>
            <option value="minor-violation">Geringfügige Verstöße</option>
            <option value="under-review">In Prüfung</option>
            <option value="major-violation">Schwere Verstöße</option>
          </select>
        </div>

        {/* Certifications Filter */}
        <div className="filter-group filter-group-certifications">
          <label className="filter-label">
            Zertifizierungen
          </label>
          <div className="filter-checkboxes">
            {availableCertifications.map(cert => (
              <label key={cert} className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.certifications.includes(cert)}
                  onChange={() => handleCertificationToggle(cert)}
                  aria-label={cert}
                />
                <span>{cert}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterPanel
