/**
 * Supplier Evaluation Panel
 * LLM-based supplier assessment interface for the dashboard
 */

import React, { useState } from 'react'
import { evaluateSupplier, saveEvaluation } from '../../services/supplierEvaluator'
import { CATEGORY_LABELS, CLASSIFICATION_CONFIG } from '../../types/supplierEvaluation'
import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'
import '../../styles/SupplierEvaluation.css'

// Register Chart.js components for Radar chart
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

function SupplierEvaluationPanel() {
  const [supplierName, setSupplierName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [evaluation, setEvaluation] = useState(null)

  /**
   * Handle evaluation request
   */
  const handleEvaluate = async () => {
    if (!supplierName.trim()) {
      setError('Bitte geben Sie einen Lieferantennamen ein')
      return
    }

    setLoading(true)
    setError(null)
    setEvaluation(null)

    try {
      const result = await evaluateSupplier(supplierName.trim())
      setEvaluation(result)
      saveEvaluation(result)
    } catch (err) {
      setError(err.message || 'Ein Fehler ist aufgetreten')
      console.error('Evaluation error:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleEvaluate()
    }
  }

  /**
   * Prepare radar chart data
   */
  const getRadarChartData = () => {
    if (!evaluation) return null

    const labels = Object.keys(evaluation.scores).map(key => {
      // Shorten labels for radar chart
      const label = CATEGORY_LABELS[key]
      return label.split('&')[0].trim() // Take first part before &
    })

    const data = Object.values(evaluation.scores)

    return {
      labels,
      datasets: [
        {
          label: evaluation.lieferant,
          data: data,
          backgroundColor: 'rgba(212, 175, 55, 0.2)',
          borderColor: '#D4AF37',
          borderWidth: 2,
          pointBackgroundColor: '#D4AF37',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#D4AF37'
        }
      ]
    }
  }

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 2
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  }

  /**
   * Get classification badge config
   */
  const getClassificationBadge = () => {
    if (!evaluation) return null
    return CLASSIFICATION_CONFIG[evaluation.einstufung] || CLASSIFICATION_CONFIG.eingeschraenkt_geeignet
  }

  return (
    <div className="supplier-evaluation-panel">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🤖 KI-Lieferantenbewertung</h2>
          <p className="card-subtitle">
            Automatisierte Bewertung auf Basis öffentlich verfügbarer Informationen
          </p>
        </div>

        <div className="card-body">
          {/* Search Bar */}
          <div className="evaluation-search">
            <input
              type="text"
              className="evaluation-input"
              placeholder="Lieferantennamen eingeben (z.B. IREKS GmbH)..."
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button
              className="evaluation-button"
              onClick={handleEvaluate}
              disabled={loading || !supplierName.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Analysiere...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Bewerten
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="evaluation-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="evaluation-loading">
              <div className="loading-content">
                <div className="spinner"></div>
                <p>Analysiere {supplierName}...</p>
                <p className="loading-subtext">
                  Durchsuche Unternehmenswebsite, Presse, Register und Bewertungsportale
                </p>
              </div>
            </div>
          )}

          {/* Evaluation Results */}
          {evaluation && !loading && (
            <div className="evaluation-results">
              {/* Summary Card */}
              <div className="evaluation-summary">
                <div className="summary-header">
                  <h3 className="summary-title">{evaluation.lieferant}</h3>
                  <div
                    className="classification-badge"
                    style={{
                      backgroundColor: getClassificationBadge().bgColor,
                      color: getClassificationBadge().color
                    }}
                  >
                    <span className="badge-icon">{getClassificationBadge().icon}</span>
                    <span className="badge-text">{getClassificationBadge().label}</span>
                  </div>
                </div>

                <p className="summary-profile">{evaluation.kurzprofil}</p>

                <div className="summary-score">
                  <div className="score-circle">
                    <span className="score-value">{evaluation.gesamt_score}</span>
                    <span className="score-max">/100</span>
                  </div>
                  <div className="score-label">Gesamtbewertung</div>
                </div>
              </div>

              {/* Scores Visualization */}
              <div className="scores-section">
                <h4 className="section-title">Detailbewertungen</h4>

                <div className="scores-grid">
                  {/* Radar Chart */}
                  <div className="radar-chart-container">
                    <div className="chart-wrapper" style={{ height: '350px' }}>
                      <Radar data={getRadarChartData()} options={radarOptions} />
                    </div>
                  </div>

                  {/* Scores Table */}
                  <div className="scores-table">
                    {Object.entries(evaluation.scores).map(([key, value]) => (
                      <div key={key} className="score-row">
                        <span className="score-label">{CATEGORY_LABELS[key]}</span>
                        <div className="score-bar-container">
                          <div
                            className="score-bar"
                            style={{
                              width: `${(value / 10) * 100}%`,
                              backgroundColor: value >= 8 ? '#28A745' :
                                             value >= 6 ? '#FFC107' :
                                             value >= 4 ? '#FF9800' : '#DC3545'
                            }}
                          />
                          <span className="score-value">{value.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Justifications */}
              <div className="justifications-section">
                <h4 className="section-title">Begründungen</h4>
                <div className="justifications-grid">
                  {Object.entries(evaluation.kuerze_begruendungen).map(([key, text]) => (
                    <div key={key} className="justification-card">
                      <h5 className="justification-title">{CATEGORY_LABELS[key]}</h5>
                      <p className="justification-text">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Risks */}
              <div className="strengths-risks-section">
                <div className="strengths-column">
                  <h4 className="section-title">
                    <span className="title-icon">✓</span>
                    Stärken
                  </h4>
                  <div className="items-list">
                    {evaluation.staerken.map((strength, index) => (
                      <div key={index} className="item strength-item">
                        <span className="item-bullet">•</span>
                        <span className="item-text">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="risks-column">
                  <h4 className="section-title">
                    <span className="title-icon">⚠</span>
                    Risiken
                  </h4>
                  <div className="items-list">
                    {evaluation.risiken.map((risk, index) => (
                      <div key={index} className="item risk-item">
                        <span className="item-bullet">•</span>
                        <span className="item-text">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="evaluation-footer">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setEvaluation(null)
                    setSupplierName('')
                  }}
                >
                  Neue Bewertung
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const dataStr = JSON.stringify(evaluation, null, 2)
                    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
                    const exportFileDefaultName = `bewertung_${evaluation.lieferant}_${new Date().toISOString().split('T')[0]}.json`

                    const linkElement = document.createElement('a')
                    linkElement.setAttribute('href', dataUri)
                    linkElement.setAttribute('download', exportFileDefaultName)
                    linkElement.click()
                  }}
                >
                  📥 Exportieren
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SupplierEvaluationPanel
