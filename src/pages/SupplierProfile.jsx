/**
 * Supplier Profile Page
 * Detailed view of a single supplier with all information
 */

import React, { useState, useEffect } from 'react'
import { dataService } from '../services/dataService'
import '../styles/SupplierProfile.css'

function SupplierProfile({ supplierId, navigateTo }) {
  const [loading, setLoading] = useState(true)
  const [supplier, setSupplier] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (supplierId) {
      loadSupplier()
    }
  }, [supplierId])

  /**
   * Load supplier data
   */
  const loadSupplier = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await dataService.getSupplier(supplierId)
      if (!data) {
        setError('Lieferant nicht gefunden')
      } else {
        setSupplier(data)
      }
    } catch (err) {
      console.error('Error loading supplier:', err)
      setError('Fehler beim Laden der Lieferantendaten')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get compliance status badge
   */
  const getComplianceStatus = (status) => {
    const statuses = {
      'compliant': {
        label: 'Vollständig konform',
        class: 'badge-success',
        icon: '✓'
      },
      'minor-violation': {
        label: 'Geringfügige Verstöße',
        class: 'badge-warning',
        icon: '⚠'
      },
      'under-review': {
        label: 'In Prüfung',
        class: 'badge-info',
        icon: '🔍'
      },
      'major-violation': {
        label: 'Schwere Verstöße',
        class: 'badge-danger',
        icon: '✕'
      }
    }
    return statuses[status] || statuses['under-review']
  }

  /**
   * Calculate average rating
   */
  const calculateAverage = (ratings) => {
    if (!ratings || ratings.length === 0) return 0
    const sum = ratings.reduce((acc, r) => acc + r.overallScore, 0)
    return (sum / ratings.length).toFixed(1)
  }

  if (loading) {
    return (
      <div className="page supplier-profile-page">
        <div className="loading">
          <div className="spinner" aria-label="Lädt..."></div>
        </div>
      </div>
    )
  }

  if (error || !supplier) {
    return (
      <div className="page supplier-profile-page">
        <div className="alert alert-danger">
          <strong>Fehler:</strong> {error || 'Lieferant nicht gefunden'}
        </div>
        <button className="btn btn-primary" onClick={() => navigateTo('discovery')}>
          Zurück zur Suche
        </button>
      </div>
    )
  }

  const complianceStatus = getComplianceStatus(supplier.compliance.status)
  const avgRating = calculateAverage(supplier.ratings)

  return (
    <div className="page supplier-profile-page">
      {/* Header with Actions */}
      <div className="profile-header">
        <button
          className="btn btn-outline btn-sm"
          onClick={() => navigateTo('discovery')}
          aria-label="Zurück zur Suche"
        >
          ← Zurück
        </button>

        <div className="profile-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigateTo('rating', { supplier })}
            aria-label={`${supplier.name} bewerten`}
          >
            ⭐ Bewerten
          </button>
          <button
            className="btn btn-secondary"
            aria-label={`${supplier.name} zur Beobachtungsliste hinzufügen`}
          >
            📌 Beobachten
          </button>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="card profile-card">
        <div className="profile-card-header">
          <div>
            <h1 className="profile-title">{supplier.name}</h1>
            <p className="profile-subtitle">{supplier.category}</p>
          </div>
          <span className={`badge ${complianceStatus.class} badge-large`}>
            <span aria-hidden="true">{complianceStatus.icon}</span>
            {complianceStatus.label}
          </span>
        </div>

        <p className="profile-description">{supplier.description}</p>

        {/* Key Metrics */}
        <div className="profile-metrics">
          <div className="metric-box">
            <span className="metric-label">Bewertung</span>
            <span className="metric-value">{avgRating}/10</span>
            <span className="metric-count">{supplier.ratings.length} Bewertungen</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Liefertreue</span>
            <span className="metric-value">{supplier.performance.onTimeDeliveryRate}%</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Fehlerrate</span>
            <span className="metric-value">{supplier.performance.defectRate}%</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Reaktionszeit</span>
            <span className="metric-value">{supplier.performance.responseTime}h</span>
          </div>
        </div>
      </div>

      {/* Compliance Warnings */}
      {supplier.compliance.violations && supplier.compliance.violations.length > 0 && (
        <div className="alert alert-danger">
          <h3>⚠️ Compliance-Verstöße</h3>
          {supplier.compliance.violations.map((violation, index) => (
            <div key={index} className="violation-item">
              <strong>{violation.type}</strong> ({violation.date})
              <p>{violation.description}</p>
              {violation.resolved && (
                <span className="badge badge-success">Behoben</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contact Information */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Kontaktinformationen</h2>
        </div>
        <div className="card-body contact-grid">
          <div className="contact-item">
            <span className="contact-label">Ansprechpartner:</span>
            <span className="contact-value">{supplier.contact.person} ({supplier.contact.position})</span>
          </div>
          <div className="contact-item">
            <span className="contact-label">E-Mail:</span>
            <a href={`mailto:${supplier.contact.email}`} className="contact-value">{supplier.contact.email}</a>
          </div>
          <div className="contact-item">
            <span className="contact-label">Telefon:</span>
            <a href={`tel:${supplier.contact.phone}`} className="contact-value">{supplier.contact.phone}</a>
          </div>
          <div className="contact-item">
            <span className="contact-label">Website:</span>
            <a href={`https://${supplier.contact.website}`} target="_blank" rel="noopener noreferrer" className="contact-value">
              {supplier.contact.website}
            </a>
          </div>
        </div>
      </div>

      {/* All Locations */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Standorte</h2>
        </div>
        <div className="card-body">
          {supplier.locations && supplier.locations.length > 0 ? (
            <div className="locations-list">
              {supplier.locations.map((location, index) => (
                <div key={index} className="location-item">
                  <div className="location-header">
                    <span className="location-icon">📍</span>
                    <span className="location-type">{location.type || 'Standort'}</span>
                  </div>
                  <div className="location-address">
                    <div>{location.street}</div>
                    <div>{location.postalCode} {location.city}</div>
                    <div>{location.region}, {location.country}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="location-item">
              <div className="location-header">
                <span className="location-icon">📍</span>
                <span className="location-type">Hauptstandort</span>
              </div>
              <div className="location-address">
                <div>{supplier.location.street}</div>
                <div>{supplier.location.postalCode} {supplier.location.city}</div>
                <div>{supplier.location.region}, {supplier.location.country}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products & Services */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Produkte & Dienstleistungen</h2>
        </div>
        <div className="card-body">
          <div className="product-list">
            {supplier.products.map((product, index) => (
              <span key={index} className="product-tag">{product}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Zertifizierungen</h2>
        </div>
        <div className="card-body">
          <div className="cert-list">
            {supplier.certifications.map((cert, index) => (
              <div key={index} className="cert-item">
                <span className="cert-icon">🏅</span>
                <span className="cert-name">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ESG Information */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">ESG-Daten (Environmental, Social, Governance)</h2>
        </div>
        <div className="card-body esg-section">
          <div className="esg-category">
            <h3 className="esg-title">🌍 Umwelt (Environmental)</h3>
            <div className="esg-data">
              <div className="esg-item">
                <span>CO₂-Fußabdruck:</span>
                <strong>{supplier.esg.environmental.carbonFootprint}</strong>
              </div>
              <div className="esg-item">
                <span>Wassernutzung:</span>
                <strong>{supplier.esg.environmental.waterUsage}</strong>
              </div>
              <div className="esg-item">
                <span>Abfallmanagement:</span>
                <strong>{supplier.esg.environmental.wasteManagement}</strong>
              </div>
              <div className="esg-item">
                <span>Erneuerbare Energie:</span>
                <strong>{supplier.esg.environmental.renewableEnergy}%</strong>
              </div>
            </div>
          </div>

          <div className="esg-category">
            <h3 className="esg-title">👥 Soziales (Social)</h3>
            <div className="esg-data">
              <div className="esg-item">
                <span>Faire Löhne:</span>
                <strong>{supplier.esg.social.fairWages ? 'Ja' : 'Nein'}</strong>
              </div>
              <div className="esg-item">
                <span>Arbeitsbedingungen:</span>
                <strong>{supplier.esg.social.workingConditions}</strong>
              </div>
              <div className="esg-item">
                <span>Mitarbeiterfortbildung:</span>
                <strong>{supplier.esg.social.employeeTraining ? 'Ja' : 'Nein'}</strong>
              </div>
              <div className="esg-item">
                <span>Diversity-Score:</span>
                <strong>{supplier.esg.social.diversityScore}/10</strong>
              </div>
            </div>
          </div>

          <div className="esg-category">
            <h3 className="esg-title">⚖️ Unternehmensführung (Governance)</h3>
            <div className="esg-data">
              <div className="esg-item">
                <span>Transparenz:</span>
                <strong>{supplier.esg.governance.transparency}</strong>
              </div>
              <div className="esg-item">
                <span>Ethisches Geschäftsgebaren:</span>
                <strong>{supplier.esg.governance.ethicalBusiness ? 'Ja' : 'Nein'}</strong>
              </div>
              <div className="esg-item">
                <span>Anti-Korruption:</span>
                <strong>{supplier.esg.governance.antiCorruption ? 'Ja' : 'Nein'}</strong>
              </div>
              <div className="esg-item">
                <span>Datenschutz:</span>
                <strong>{supplier.esg.governance.dataProtection ? 'Ja' : 'Nein'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      {supplier.documents && supplier.documents.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Dokumente</h2>
          </div>
          <div className="card-body">
            <div className="document-list">
              {supplier.documents.map((doc, index) => (
                <a key={index} href={doc.url} className="document-item" target="_blank" rel="noopener noreferrer">
                  <span className="doc-icon">📄</span>
                  <div className="doc-info">
                    <span className="doc-name">{doc.name}</span>
                    <span className="doc-date">{doc.date}</span>
                  </div>
                  <span className="doc-action">↓</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ratings History */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Bewertungsverlauf</h2>
        </div>
        <div className="card-body">
          {supplier.ratings && supplier.ratings.length > 0 ? (
            <div className="ratings-list">
              {supplier.ratings.map((rating, index) => (
                <div key={index} className="rating-item">
                  <div className="rating-header">
                    <span className="rating-date">{rating.date}</span>
                    <span className="rating-score-badge">{rating.overallScore}/10</span>
                  </div>
                  <div className="rating-categories">
                    {Object.entries(rating.categories).map(([key, value]) => (
                      <div key={key} className="rating-category-item">
                        <span className="category-name">{key}:</span>
                        <span className="category-value">{value}/10</span>
                      </div>
                    ))}
                  </div>
                  {rating.comment && (
                    <p className="rating-comment">"{rating.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">Noch keine Bewertungen vorhanden</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SupplierProfile
