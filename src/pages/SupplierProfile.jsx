/**
 * Supplier Profile Page
 * Detailed view of a single supplier with all information
 */

import React, { useState, useEffect } from 'react'
import { dataService } from '../services/dataService'
import esgAnalysisData from '../data/esgAnalysis.json'
import productDetailsData from '../data/productDetails.json'
import '../styles/SupplierProfile.css'

function SupplierProfile({ supplierId, navigateTo }) {
  const [loading, setLoading] = useState(true)
  const [supplier, setSupplier] = useState(null)
  const [error, setError] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)

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
   * Calculate average rating
   */
  const calculateAverage = (ratings) => {
    if (!ratings || ratings.length === 0) return 0
    const sum = ratings.reduce((acc, r) => acc + r.overallScore, 0)
    return (sum / ratings.length).toFixed(1)
  }

  /**
   * Get ESG rating class and color
   */
  const getESGRatingClass = (rating) => {
    const ratingMap = {
      'Excellent': 'esg-rating-excellent',
      'Very Good': 'esg-rating-very-good',
      'Good': 'esg-rating-good',
      'Needs Improvement': 'esg-rating-needs-improvement'
    }
    return ratingMap[rating] || 'esg-rating-good'
  }

  /**
   * Get ESG analysis for current supplier
   */
  const getESGAnalysis = () => {
    if (!supplier || !esgAnalysisData) return null
    return esgAnalysisData.suppliers[supplier.name] || null
  }

  /**
   * Get product details for current supplier
   */
  const getProductDetails = () => {
    if (!supplier || !productDetailsData) return null
    return productDetailsData[supplier.name] || null
  }

  /**
   * Handle product click
   */
  const handleProductClick = (product) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  /**
   * Close product modal
   */
  const closeProductModal = () => {
    setIsProductModalOpen(false)
    setTimeout(() => setSelectedProduct(null), 300) // Wait for animation
  }

  /**
   * Get color badge class based on EBC value
   */
  const getColorBadgeClass = (category) => {
    const colorMap = {
      'sehr hell': 'color-badge-very-light',
      'hell': 'color-badge-light',
      'bernstein': 'color-badge-amber',
      'rot': 'color-badge-red',
      'rotbraun': 'color-badge-red-brown',
      'dunkelbraun': 'color-badge-dark-brown',
      'schwarz': 'color-badge-black',
      'N/A': 'color-badge-na'
    }
    return colorMap[category] || 'color-badge-light'
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
          <span className="badge badge-info badge-large">
            📋 Tender-Kandidat
          </span>
        </div>

        <p className="profile-description">{supplier.description}</p>

        {/* Key Metrics */}
        <div className="profile-metrics">
          <div className="metric-box">
            <span className="metric-label">Bewertung</span>
            <span className="metric-value">{avgRating}/10</span>
            <span className="metric-count">{supplier.ratings?.length || 0} Bewertungen</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Standorte</span>
            <span className="metric-value">{supplier.locations?.length || 1}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Produkte</span>
            <span className="metric-value">{supplier.products?.length || 0}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Zertifikate</span>
            <span className="metric-value">{supplier.certifications?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Kontaktinformationen</h2>
        </div>
        <div className="card-body contact-grid">
          {supplier.contact?.person && (
            <div className="contact-item">
              <span className="contact-label">Ansprechpartner:</span>
              <span className="contact-value">
                {supplier.contact.person}
                {supplier.contact.position && ` (${supplier.contact.position})`}
              </span>
            </div>
          )}
          {supplier.contact?.email && (
            <div className="contact-item">
              <span className="contact-label">E-Mail:</span>
              <a href={`mailto:${supplier.contact.email}`} className="contact-value">{supplier.contact.email}</a>
            </div>
          )}
          {supplier.contact?.phone && (
            <div className="contact-item">
              <span className="contact-label">Telefon:</span>
              <a href={`tel:${supplier.contact.phone}`} className="contact-value">{supplier.contact.phone}</a>
            </div>
          )}
          {supplier.contact?.website && (
            <div className="contact-item">
              <span className="contact-label">Website:</span>
              <a href={supplier.contact.website.startsWith('http') ? supplier.contact.website : `https://${supplier.contact.website}`} target="_blank" rel="noopener noreferrer" className="contact-value">
                {supplier.contact.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {!supplier.contact?.person && !supplier.contact?.email && !supplier.contact?.phone && !supplier.contact?.website && (
            <p className="text-muted">Keine Kontaktinformationen verfügbar</p>
          )}
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
                    {location.street && <div>{location.street}</div>}
                    <div>
                      {location.postalCode && `${location.postalCode} `}
                      {location.city}
                    </div>
                    <div>
                      {location.region && `${location.region}, `}
                      {location.country}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : supplier.location ? (
            <div className="location-item">
              <div className="location-header">
                <span className="location-icon">📍</span>
                <span className="location-type">Hauptstandort</span>
              </div>
              <div className="location-address">
                {supplier.location.street && <div>{supplier.location.street}</div>}
                <div>
                  {supplier.location.postalCode && `${supplier.location.postalCode} `}
                  {supplier.location.city}
                </div>
                <div>
                  {supplier.location.region && `${supplier.location.region}, `}
                  {supplier.location.country}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted">Keine Standortinformationen verfügbar</p>
          )}
        </div>
      </div>

      {/* Products & Services */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Produkte & Dienstleistungen</h2>
        </div>
        <div className="card-body">
          {(() => {
            const productDetails = getProductDetails()

            if (!productDetails) {
              // Fallback to simple product tags for suppliers without detailed products
              if (!supplier.products || supplier.products.length === 0) {
                return <p className="text-muted">Keine Produktinformationen verfügbar</p>
              }
              return (
                <div className="product-list">
                  {supplier.products.map((product, index) => (
                    <span key={index} className="product-tag">{product}</span>
                  ))}
                </div>
              )
            }

            // Enhanced product display with categories for suppliers with detailed products
            return (
              <div className="products-enhanced">
                <p className="products-intro">
                  Klicken Sie auf ein Produkt, um detaillierte Informationen zu sehen.
                </p>
                {Object.entries(productDetails.categories).map(([categoryName, products]) => (
                  <div key={categoryName} className="product-category-section">
                    <h3 className="product-category-title">{categoryName}</h3>
                    <div className="product-cards-grid">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="product-card"
                          onClick={() => handleProductClick(product)}
                          role="button"
                          tabIndex={0}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleProductClick(product)
                            }
                          }}
                          aria-label={`Details zu ${product.name}`}
                        >
                          <div className="product-card-header">
                            <span className={`product-color-badge ${getColorBadgeClass(product.color.category)}`}>
                              {product.color.ebc} EBC
                            </span>
                          </div>
                          <h4 className="product-card-name">{product.name}</h4>
                          <div className="product-card-info">
                            <span className="product-info-item">
                              <span className="product-info-icon">🎨</span>
                              {product.color.category}
                            </span>
                            <span className="product-info-item">
                              <span className="product-info-icon">📊</span>
                              {product.usage}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
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
          <h2 className="card-title">ESG-Bewertung (Environmental, Social, Governance)</h2>
        </div>
        <div className="card-body esg-section">
          {(() => {
            const esgAnalysis = getESGAnalysis()

            if (!esgAnalysis) {
              // Tender-focused ESG display with new data structure
              if (!supplier.esg) {
                return <p className="text-muted">Keine ESG-Informationen verfügbar</p>
              }

              return (
                <>
                  {/* Environmental */}
                  {supplier.esg.environmental && (
                    <div className="esg-category">
                      <h3 className="esg-title">
                        🌍 Umwelt (Environmental)
                        {supplier.esg.environmental.score && (
                          <span className="esg-score-badge"> {supplier.esg.environmental.score}/5</span>
                        )}
                      </h3>
                      <div className="esg-data">
                        {supplier.esg.environmental.flag && (
                          <div className="esg-item esg-flag-item">
                            <span className={`esg-flag ${supplier.esg.environmental.flag === 'Green Flag' ? 'flag-green' : supplier.esg.environmental.flag === 'Amber Flag' ? 'flag-amber' : 'flag-red'}`}>
                              {supplier.esg.environmental.flag}
                            </span>
                          </div>
                        )}
                        {supplier.esg.environmental.co2 && (
                          <div className="esg-item">
                            <span>CO₂:</span>
                            <strong>{supplier.esg.environmental.co2}</strong>
                          </div>
                        )}
                        {supplier.esg.environmental.water && (
                          <div className="esg-item">
                            <span>Wasser:</span>
                            <strong>{supplier.esg.environmental.water}</strong>
                          </div>
                        )}
                        {supplier.esg.environmental.sourcing && (
                          <div className="esg-item">
                            <span>Beschaffung:</span>
                            <strong>{supplier.esg.environmental.sourcing}</strong>
                          </div>
                        )}
                        {supplier.esg.environmental.recycling && (
                          <div className="esg-item">
                            <span>Recycling:</span>
                            <strong>{supplier.esg.environmental.recycling}</strong>
                          </div>
                        )}
                        {supplier.esg.environmental.comment && (
                          <div className="esg-item esg-comment">
                            <em>{supplier.esg.environmental.comment}</em>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Social */}
                  {supplier.esg.social && (
                    <div className="esg-category">
                      <h3 className="esg-title">
                        👥 Soziales (Social)
                        {supplier.esg.social.score && (
                          <span className="esg-score-badge"> {supplier.esg.social.score}/5</span>
                        )}
                      </h3>
                      <div className="esg-data">
                        {supplier.esg.social.details ? (
                          <div className="esg-item">
                            <span>{supplier.esg.social.details}</span>
                          </div>
                        ) : (
                          <div className="esg-item">
                            <span className="text-muted">Score: {supplier.esg.social.score}/5</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Governance */}
                  {supplier.esg.governance && (
                    <div className="esg-category">
                      <h3 className="esg-title">
                        ⚖️ Unternehmensführung (Governance)
                        {supplier.esg.governance.score && (
                          <span className="esg-score-badge"> {supplier.esg.governance.score}/5</span>
                        )}
                      </h3>
                      <div className="esg-data">
                        {supplier.esg.governance.details ? (
                          <div className="esg-item">
                            <span>{supplier.esg.governance.details}</span>
                          </div>
                        ) : (
                          <div className="esg-item">
                            <span className="text-muted">Score: {supplier.esg.governance.score}/5</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )
            }

            // Enhanced ESG display with comprehensive analysis
            return (
              <>
                {/* Overall ESG Score */}
                <div className="esg-overall-score">
                  <div className="esg-score-container">
                    <div className="esg-score-value">{esgAnalysis.overallESGScore}</div>
                    <div className="esg-score-max">/10</div>
                  </div>
                  <div className="esg-rating-info">
                    <span className={`esg-rating-badge ${getESGRatingClass(esgAnalysis.rating)}`}>
                      {esgAnalysis.rating}
                    </span>
                    <p className="esg-benchmark">
                      Branchendurchschnitt: {esgAnalysisData.industryBenchmarks.averageESGScore}/10
                    </p>
                  </div>
                </div>

                {/* Category Scores */}
                <div className="esg-categories-grid">
                  {/* Environmental */}
                  <div className="esg-category-card">
                    <div className="esg-category-header">
                      <h3 className="esg-category-title">🌍 Umwelt</h3>
                      <span className={`esg-category-score ${getESGRatingClass(esgAnalysis.environmental.rating)}`}>
                        {esgAnalysis.environmental.score}/10
                      </span>
                    </div>
                    <div className="esg-progress-bar">
                      <div
                        className="esg-progress-fill esg-environmental"
                        style={{ width: `${esgAnalysis.environmental.score * 10}%` }}
                      ></div>
                    </div>

                    <div className="esg-details">
                      <div className="esg-detail-item">
                        <strong>CO₂-Fußabdruck:</strong>
                        <span>{esgAnalysis.environmental.carbonFootprint.level}</span>
                      </div>
                      {esgAnalysis.environmental.energyManagement && (
                        <div className="esg-detail-item">
                          <strong>Erneuerbare Energien:</strong>
                          <span>{esgAnalysis.environmental.energyManagement.renewableEnergyPercentage}%</span>
                        </div>
                      )}
                      {esgAnalysis.environmental.waterManagement && (
                        <div className="esg-detail-item">
                          <strong>Wassermanagement:</strong>
                          <span>{esgAnalysis.environmental.waterManagement.efficiency}</span>
                        </div>
                      )}
                      {esgAnalysis.environmental.wasteManagement && (
                        <div className="esg-detail-item">
                          <strong>Abfallmanagement:</strong>
                          <span>{esgAnalysis.environmental.wasteManagement.level}</span>
                        </div>
                      )}
                    </div>

                    {esgAnalysis.environmental.keyAchievements && esgAnalysis.environmental.keyAchievements.length > 0 && (
                      <div className="esg-achievements">
                        <strong>Wichtige Maßnahmen:</strong>
                        <ul>
                          {esgAnalysis.environmental.keyAchievements.slice(0, 3).map((achievement, idx) => (
                            <li key={idx}>{achievement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Social */}
                  <div className="esg-category-card">
                    <div className="esg-category-header">
                      <h3 className="esg-category-title">👥 Soziales</h3>
                      <span className={`esg-category-score ${getESGRatingClass(esgAnalysis.social.rating)}`}>
                        {esgAnalysis.social.score}/10
                      </span>
                    </div>
                    <div className="esg-progress-bar">
                      <div
                        className="esg-progress-fill esg-social"
                        style={{ width: `${esgAnalysis.social.score * 10}%` }}
                      ></div>
                    </div>

                    <div className="esg-details">
                      {esgAnalysis.social.employeeWelfare && (
                        <>
                          <div className="esg-detail-item">
                            <strong>Arbeitsbedingungen:</strong>
                            <span>{esgAnalysis.social.employeeWelfare.workingConditions}</span>
                          </div>
                          <div className="esg-detail-item">
                            <strong>Weiterbildung:</strong>
                            <span>{esgAnalysis.social.employeeWelfare.trainingPrograms ? 'Ja' : 'Nein'}</span>
                          </div>
                        </>
                      )}
                      {esgAnalysis.social.diversity && (
                        <div className="esg-detail-item">
                          <strong>Diversity-Score:</strong>
                          <span>{esgAnalysis.social.diversity.score}/10</span>
                        </div>
                      )}
                      {esgAnalysis.social.communityEngagement && (
                        <div className="esg-detail-item">
                          <strong>Community Engagement:</strong>
                          <span>{esgAnalysis.social.communityEngagement.level}</span>
                        </div>
                      )}
                    </div>

                    {esgAnalysis.social.keyAchievements && esgAnalysis.social.keyAchievements.length > 0 && (
                      <div className="esg-achievements">
                        <strong>Wichtige Maßnahmen:</strong>
                        <ul>
                          {esgAnalysis.social.keyAchievements.slice(0, 3).map((achievement, idx) => (
                            <li key={idx}>{achievement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Governance */}
                  <div className="esg-category-card">
                    <div className="esg-category-header">
                      <h3 className="esg-category-title">⚖️ Governance</h3>
                      <span className={`esg-category-score ${getESGRatingClass(esgAnalysis.governance.rating)}`}>
                        {esgAnalysis.governance.score}/10
                      </span>
                    </div>
                    <div className="esg-progress-bar">
                      <div
                        className="esg-progress-fill esg-governance"
                        style={{ width: `${esgAnalysis.governance.score * 10}%` }}
                      ></div>
                    </div>

                    <div className="esg-details">
                      {esgAnalysis.governance.transparency && (
                        <div className="esg-detail-item">
                          <strong>Transparenz:</strong>
                          <span>{esgAnalysis.governance.transparency.level}</span>
                        </div>
                      )}
                      {esgAnalysis.governance.ethicalBusiness !== undefined && (
                        <div className="esg-detail-item">
                          <strong>Ethisches Geschäft:</strong>
                          <span>{esgAnalysis.governance.ethicalBusiness ? 'Ja' : 'Nein'}</span>
                        </div>
                      )}
                      {esgAnalysis.governance.certifications && (
                        <div className="esg-detail-item">
                          <strong>Zertifizierungen:</strong>
                          <span>{esgAnalysis.governance.certifications.length} aktiv</span>
                        </div>
                      )}
                    </div>

                    {esgAnalysis.governance.keyAchievements && esgAnalysis.governance.keyAchievements.length > 0 && (
                      <div className="esg-achievements">
                        <strong>Wichtige Maßnahmen:</strong>
                        <ul>
                          {esgAnalysis.governance.keyAchievements.slice(0, 3).map((achievement, idx) => (
                            <li key={idx}>{achievement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Strengths and Areas for Improvement */}
                <div className="esg-insights-grid">
                  <div className="esg-insights-card esg-strengths">
                    <h3 className="esg-insights-title">✅ Stärken</h3>
                    <ul className="esg-insights-list">
                      {esgAnalysis.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="esg-insights-card esg-improvements">
                    <h3 className="esg-insights-title">📈 Verbesserungspotenzial</h3>
                    <ul className="esg-insights-list">
                      {esgAnalysis.areasForImprovement.map((area, idx) => (
                        <li key={idx}>{area}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Methodology */}
                <div className="esg-methodology">
                  <h3 className="esg-methodology-title">📊 Bewertungsmethodik</h3>
                  <div className="esg-methodology-content">
                    <p><strong>Methode:</strong> {esgAnalysisData.analysisMetadata.methodology}</p>
                    <p><strong>Datenquellen:</strong> {esgAnalysisData.analysisMetadata.sources.join(', ')}</p>
                    <p><strong>Letzte Aktualisierung:</strong> {new Date(esgAnalysisData.analysisMetadata.lastUpdate).toLocaleDateString('de-DE')}</p>
                  </div>
                </div>
              </>
            )
          })()}
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

      {/* Product Details Modal */}
      {isProductModalOpen && selectedProduct && (
        <div
          className={`product-modal-overlay ${isProductModalOpen ? 'modal-open' : ''}`}
          onClick={closeProductModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <div
            className="product-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="product-modal-close"
              onClick={closeProductModal}
              aria-label="Schließen"
            >
              ✕
            </button>

            <div className="product-modal-header">
              <span className={`product-modal-color-badge ${getColorBadgeClass(selectedProduct.color.category)}`}>
                {selectedProduct.color.ebc} EBC
              </span>
              <h2 id="product-modal-title" className="product-modal-title">
                {selectedProduct.name}
              </h2>
              <p className="product-modal-subtitle">{selectedProduct.rating}</p>
            </div>

            <div className="product-modal-body">
              <div className="product-modal-grid">
                <div className="product-modal-detail">
                  <div className="product-modal-detail-label">
                    <span className="product-modal-icon">🎨</span>
                    Farbe
                  </div>
                  <div className="product-modal-detail-value">
                    <div className="product-modal-detail-primary">{selectedProduct.color.ebc} EBC</div>
                    <div className="product-modal-detail-secondary">{selectedProduct.color.category}</div>
                  </div>
                </div>

                <div className="product-modal-detail">
                  <div className="product-modal-detail-label">
                    <span className="product-modal-icon">📊</span>
                    Einsatz
                  </div>
                  <div className="product-modal-detail-value">
                    <div className="product-modal-detail-primary">{selectedProduct.usage}</div>
                  </div>
                </div>

                <div className="product-modal-detail">
                  <div className="product-modal-detail-label">
                    <span className="product-modal-icon">⚗️</span>
                    Enzyme
                  </div>
                  <div className="product-modal-detail-value">
                    <div className="product-modal-detail-primary">{selectedProduct.enzymes}</div>
                  </div>
                </div>

                <div className="product-modal-detail">
                  <div className="product-modal-detail-label">
                    <span className="product-modal-icon">👃</span>
                    Aroma
                  </div>
                  <div className="product-modal-detail-value">
                    <div className="product-modal-detail-primary">{selectedProduct.aroma}</div>
                  </div>
                </div>

                <div className="product-modal-detail product-modal-detail-full">
                  <div className="product-modal-detail-label">
                    <span className="product-modal-icon">🍺</span>
                    Biertypen
                  </div>
                  <div className="product-modal-detail-value">
                    <div className="product-modal-detail-primary">{selectedProduct.beerTypes}</div>
                  </div>
                </div>

                <div className="product-modal-detail product-modal-detail-full product-modal-rating">
                  <div className="product-modal-detail-label">
                    <span className="product-modal-icon">⭐</span>
                    Bewertung
                  </div>
                  <div className="product-modal-detail-value">
                    <div className="product-modal-detail-primary">{selectedProduct.rating}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="product-modal-footer">
              <button
                className="btn btn-primary btn-lg"
                onClick={closeProductModal}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupplierProfile
