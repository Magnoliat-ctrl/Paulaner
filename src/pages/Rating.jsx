/**
 * Rating Page
 * Multi-criteria rating system with weighted scoring
 */

import React, { useState, useEffect } from 'react'
import { dataService } from '../services/dataService'
import { memoryService } from '../services/memoryService'
import '../styles/Rating.css'

function Rating({ supplier, navigateTo, onRatingComplete }) {
  const [selectedSupplier, setSelectedSupplier] = useState(supplier)
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Rating categories with default values
  const [ratings, setRatings] = useState({
    quality: 5,
    delivery: 5,
    cost: 5,
    reliability: 5,
    innovation: 5,
    communication: 5,
    esg: 5
  })

  // Weights for each category (in percentage)
  const [weights, setWeights] = useState({
    quality: 20,
    delivery: 15,
    cost: 15,
    reliability: 20,
    innovation: 10,
    communication: 10,
    esg: 10
  })

  const [comment, setComment] = useState('')

  // Category labels in German
  const categoryLabels = {
    quality: 'Qualität',
    delivery: 'Lieferleistung',
    cost: 'Kosten',
    reliability: 'Zuverlässigkeit',
    innovation: 'Innovation',
    communication: 'Kommunikation',
    esg: 'ESG-Compliance'
  }

  // Category descriptions
  const categoryDescriptions = {
    quality: 'Produkttreue, Fehlerrate, Qualitätskonstanz',
    delivery: 'Pünktlichkeit, Flexibilität, Liefergeschwindigkeit',
    cost: 'Preis-Leistungs-Verhältnis, Zahlungsbedingungen',
    reliability: 'Stabilität, Krisenresistenz, Verlässlichkeit',
    innovation: 'Produktentwicklung, Nachhaltigkeit, Technologie',
    communication: 'Reaktionszeit, Lösungsbereitschaft, Transparenz',
    esg: 'Menschenrechte, Umweltstandards, Ethisches Handeln'
  }

  useEffect(() => {
    if (!selectedSupplier) {
      loadSuppliers()
    }

    // Load saved weights from memory
    const savedWeights = memoryService.getRatingWeights()
    if (savedWeights) {
      setWeights(savedWeights)
    }
  }, [])

  /**
   * Load suppliers for selection
   */
  const loadSuppliers = async () => {
    setLoading(true)
    try {
      const data = await dataService.getSuppliers()
      setSuppliers(data)
    } catch (error) {
      console.error('Error loading suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Calculate weighted overall score
   */
  const calculateOverallScore = () => {
    let weightedSum = 0
    let totalWeight = 0

    Object.keys(ratings).forEach(category => {
      const rating = ratings[category]
      const weight = weights[category]
      weightedSum += (rating * weight)
      totalWeight += weight
    })

    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : 0
  }

  /**
   * Update rating for a category
   */
  const handleRatingChange = (category, value) => {
    setRatings(prev => ({
      ...prev,
      [category]: parseFloat(value)
    }))
  }

  /**
   * Update weight for a category
   */
  const handleWeightChange = (category, value) => {
    setWeights(prev => ({
      ...prev,
      [category]: parseInt(value)
    }))
  }

  /**
   * Normalize weights to sum to 100
   */
  const normalizeWeights = () => {
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
    if (total === 0) return

    const normalized = {}
    Object.keys(weights).forEach(key => {
      normalized[key] = Math.round((weights[key] / total) * 100)
    })

    setWeights(normalized)
  }

  /**
   * Submit rating
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedSupplier) {
      alert('Bitte wählen Sie einen Lieferanten aus')
      return
    }

    setSubmitting(true)

    try {
      const overallScore = parseFloat(calculateOverallScore())

      await dataService.addRating(selectedSupplier.id, {
        overallScore,
        categories: ratings,
        weights,
        comment
      })

      // Save weights to memory for next time
      memoryService.updateRatingWeights(weights)

      // Show success message
      setShowSuccess(true)

      // Reset form after short delay
      setTimeout(() => {
        setRatings({
          quality: 5,
          delivery: 5,
          cost: 5,
          reliability: 5,
          innovation: 5,
          communication: 5,
          esg: 5
        })
        setComment('')
        setSelectedSupplier(null)
        setShowSuccess(false)

        // Call completion callback
        if (onRatingComplete) {
          onRatingComplete()
        }
      }, 2000)
    } catch (error) {
      console.error('Error submitting rating:', error)
      alert('Fehler beim Speichern der Bewertung')
    } finally {
      setSubmitting(false)
    }
  }

  const overallScore = calculateOverallScore()
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)

  return (
    <div className="page rating-page">
      {/* Page Header */}
      <header className="page-header">
        <h1 className="page-title">Lieferanten bewerten</h1>
        <p className="page-description">
          Bewerten Sie Lieferanten nach verschiedenen Kriterien mit individueller Gewichtung
        </p>
      </header>

      {showSuccess && (
        <div className="alert alert-success">
          <strong>✓ Bewertung erfolgreich gespeichert!</strong>
          <p>Ihre Bewertung wurde erfasst und das Dashboard wird aktualisiert.</p>
        </div>
      )}

      <div className="rating-container">
        {/* Supplier Selection */}
        {!supplier && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Lieferant auswählen</h2>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="loading">
                  <div className="spinner"></div>
                </div>
              ) : (
                <select
                  className="form-select"
                  value={selectedSupplier?.id || ''}
                  onChange={(e) => {
                    const supplier = suppliers.find(s => s.id === e.target.value)
                    setSelectedSupplier(supplier)
                  }}
                >
                  <option value="">-- Lieferant wählen --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {selectedSupplier && (
          <>
            {/* Selected Supplier Info */}
            <div className="card selected-supplier-card">
              <div className="selected-supplier-header">
                <div>
                  <h2 className="supplier-name">{selectedSupplier.name}</h2>
                  <p className="supplier-category">{selectedSupplier.category}</p>
                </div>
                {!supplier && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setSelectedSupplier(null)}
                  >
                    Ändern
                  </button>
                )}
              </div>
            </div>

            {/* Overall Score Display */}
            <div className="overall-score-card">
              <div className="score-display">
                <span className="score-label">Gesamtscore</span>
                <span className="score-value">{overallScore}</span>
                <span className="score-max">/10</span>
              </div>
              {totalWeight !== 100 && (
                <div className="weight-warning">
                  <span>⚠️ Gewichtung: {totalWeight}% (sollte 100% sein)</span>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={normalizeWeights}
                  >
                    Normalisieren
                  </button>
                </div>
              )}
            </div>

            {/* Rating Form */}
            <form onSubmit={handleSubmit} className="rating-form">
              {/* Rating Categories */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Bewertungskriterien</h2>
                  <p className="card-subtitle">
                    Bewerten Sie jeden Bereich von 1-10 und passen Sie die Gewichtung nach Bedarf an
                  </p>
                </div>
                <div className="card-body">
                  <div className="rating-categories">
                    {Object.keys(ratings).map(category => (
                      <div key={category} className="rating-category">
                        <div className="category-header">
                          <div>
                            <h3 className="category-title">{categoryLabels[category]}</h3>
                            <p className="category-description">{categoryDescriptions[category]}</p>
                          </div>
                        </div>

                        {/* Rating Slider */}
                        <div className="rating-controls">
                          <div className="rating-slider-group">
                            <label className="slider-label">
                              Bewertung: <strong>{ratings[category]}/10</strong>
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="0.5"
                              value={ratings[category]}
                              onChange={(e) => handleRatingChange(category, e.target.value)}
                              className="rating-slider"
                              aria-label={`Bewertung für ${categoryLabels[category]}`}
                            />
                            <div className="slider-labels">
                              <span>1</span>
                              <span>10</span>
                            </div>
                          </div>

                          {/* Weight Slider */}
                          <div className="weight-slider-group">
                            <label className="slider-label">
                              Gewichtung: <strong>{weights[category]}%</strong>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="50"
                              step="5"
                              value={weights[category]}
                              onChange={(e) => handleWeightChange(category, e.target.value)}
                              className="weight-slider"
                              aria-label={`Gewichtung für ${categoryLabels[category]}`}
                            />
                            <div className="slider-labels">
                              <span>0%</span>
                              <span>50%</span>
                            </div>
                          </div>
                        </div>

                        {/* Weighted Contribution */}
                        <div className="category-contribution">
                          Beitrag zum Gesamtscore: <strong>
                            {((ratings[category] * weights[category]) / (totalWeight || 100)).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Comment Section */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Kommentar (optional)</h2>
                </div>
                <div className="card-body">
                  <textarea
                    className="form-textarea"
                    rows="5"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Fügen Sie hier qualitative Rückmeldungen, besondere Beobachtungen oder Empfehlungen hinzu..."
                    aria-label="Kommentar zur Bewertung"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigateTo('dashboard')}
                  disabled={submitting}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={submitting}
                >
                  {submitting ? 'Wird gespeichert...' : 'Bewertung abgeben'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default Rating
