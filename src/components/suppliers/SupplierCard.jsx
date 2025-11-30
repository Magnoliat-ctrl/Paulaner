/**
 * Supplier Card Component
 * Individual supplier card in grid view
 */

import React from 'react'
import '../../styles/SupplierCard.css'

function SupplierCard({ supplier, onClick }) {
  /**
   * Calculate average rating
   */
  const avgRating = supplier.ratings && supplier.ratings.length > 0
    ? (supplier.ratings.reduce((sum, r) => sum + r.overallScore, 0) / supplier.ratings.length).toFixed(1)
    : 'N/A'

  return (
    <div
      className="supplier-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={`${supplier.name} - ${supplier.description}`}
    >
      {/* Card Header */}
      <div className="supplier-card-header">
        <h3 className="supplier-card-title">{supplier.name}</h3>
        {/* Compliance badge removed - not available during tender process */}
      </div>

      {/* Card Body */}
      <div className="supplier-card-body">
        <p className="supplier-card-description">{supplier.description}</p>

        <div className="supplier-card-info">
          <div className="info-item">
            <span className="info-icon" aria-hidden="true">📍</span>
            <span className="info-text">
              {supplier.locations && supplier.locations.length > 0
                ? `${supplier.locations.length} Standort${supplier.locations.length > 1 ? 'e' : ''}: ${supplier.locations.map(loc => loc.city).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`
                : supplier.location
                  ? `${supplier.location.city}${supplier.location.region ? ', ' + supplier.location.region : ''}`
                  : 'Keine Standorte angegeben'
              }
            </span>
          </div>

          <div className="info-item">
            <span className="info-icon" aria-hidden="true">📦</span>
            <span className="info-text">{supplier.category}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="supplier-card-rating">
          <div className="rating-stars" aria-hidden="true">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`star ${i < Math.round(avgRating / 2) ? 'star-filled' : ''}`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="rating-score">
            {avgRating}{avgRating !== 'N/A' && '/10'}
          </span>
          {supplier.ratings && supplier.ratings.length > 0 && (
            <span className="rating-count">({supplier.ratings.length} Bewertungen)</span>
          )}
        </div>

        {/* Certifications */}
        {supplier.certifications && supplier.certifications.length > 0 && (
          <div className="supplier-card-certs">
            {supplier.certifications.slice(0, 3).map(cert => (
              <span key={cert} className="cert-badge">
                {cert}
              </span>
            ))}
            {supplier.certifications.length > 3 && (
              <span className="cert-badge cert-more">
                +{supplier.certifications.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="supplier-card-footer">
        <button className="btn btn-primary btn-sm" aria-label={`Profil von ${supplier.name} anzeigen`}>
          Zum Profil →
        </button>
      </div>
    </div>
  )
}

export default SupplierCard
