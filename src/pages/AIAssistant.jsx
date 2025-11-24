/**
 * AI Assistant Page
 * Interactive chat interface for querying supplier and product data
 */

import React, { useState, useRef, useEffect } from 'react'
import { aiQueryEngine } from '../services/aiQueryEngine'
import '../styles/AIAssistant.css'

function AIAssistant({ navigateTo }) {
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: {
        type: 'welcome',
        message: 'Willkommen beim Paulaner Supplier Dashboard Assistant! 👋',
        intro: 'Ich kann Ihnen bei folgenden Themen helfen:',
        capabilities: [
          '🔍 Produktvergleiche und Analysen',
          '📊 ESG-Bewertungen und Rankings',
          '🎨 Malzfarben und EBC-Werte',
          '✅ Zertifizierungen und Compliance',
          '📈 Statistiken und Übersichten',
          '💡 Empfehlungen für Bierstile'
        ],
        examples: [
          'Vergleiche Weyermann Pilsner mit Bestmalz Pilsner',
          'Welcher Lieferant hat die beste ESG-Bewertung?',
          'Zeige alle Röstmalze unter 1000 EBC',
          'Welches Malz empfiehlst du für Weizenbier?'
        ]
      },
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || isProcessing) return

    const userMessage = {
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsProcessing(true)

    // Process query (async for OpenAI support)
    ;(async () => {
      try {
        // Pass conversation history to enable context-aware responses
        const response = await aiQueryEngine.processQuery(inputValue, messages)

        const assistantMessage = {
          type: 'assistant',
          content: response,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, assistantMessage])
      } catch (error) {
        console.error('Query processing error:', error)

        const errorMessage = {
          type: 'assistant',
          content: {
            type: 'error',
            message: 'Es gab einen Fehler bei der Verarbeitung Ihrer Anfrage. Bitte versuchen Sie es erneut.',
            suggestions: ['Dashboard anzeigen', 'Produktvergleich starten', 'ESG-Analysen']
          },
          timestamp: new Date()
        }

        setMessages(prev => [...prev, errorMessage])
      } finally {
        setIsProcessing(false)
      }
    })()
  }

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion)
    inputRef.current?.focus()
  }

  const handleClearChat = () => {
    // Clear conversation context in the AI engine
    aiQueryEngine.clearContext()

    setMessages([
      {
        type: 'assistant',
        content: {
          type: 'help',
          message: 'Chat wurde zurückgesetzt. Wie kann ich Ihnen helfen?',
          suggestions: [
            'Produktvergleiche',
            'ESG-Analysen',
            'Malzsuche',
            'Statistiken'
          ]
        },
        timestamp: new Date()
      }
    ])
  }

  return (
    <div className="page ai-assistant-page">
      <div className="ai-assistant-header">
        <button
          className="btn btn-outline btn-sm"
          onClick={() => navigateTo('dashboard')}
        >
          ← Zurück zum Dashboard
        </button>
        <h1 className="ai-assistant-title">
          <span className="ai-icon">🤖</span>
          Paulaner AI Assistant
        </h1>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleClearChat}
        >
          Chat zurücksetzen
        </button>
      </div>

      <div className="ai-chat-container">
        <div className="ai-chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`ai-message ${message.type === 'user' ? 'ai-message-user' : 'ai-message-assistant'}`}
            >
              <div className="ai-message-content">
                {message.type === 'user' ? (
                  <p>{message.content}</p>
                ) : (
                  <ResponseRenderer
                    response={message.content}
                    onSuggestionClick={handleSuggestionClick}
                  />
                )}
              </div>
              <div className="ai-message-timestamp">
                {message.timestamp.toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="ai-message ai-message-assistant">
              <div className="ai-message-content">
                <div className="ai-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form className="ai-chat-input-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="ai-chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Stellen Sie eine Frage über Lieferanten, Produkte oder ESG..."
            disabled={isProcessing}
          />
          <button
            type="submit"
            className="ai-chat-submit"
            disabled={!inputValue.trim() || isProcessing}
          >
            <span className="ai-send-icon">➤</span>
          </button>
        </form>
      </div>
    </div>
  )
}

/**
 * Component to render different response types
 */
function ResponseRenderer({ response, onSuggestionClick }) {
  switch (response.type) {
    case 'welcome':
      return (
        <div className="ai-response-welcome">
          <p className="ai-welcome-message">{response.message}</p>
          <p className="ai-welcome-intro">{response.intro}</p>
          <div className="ai-capabilities">
            {response.capabilities.map((cap, idx) => (
              <div key={idx} className="ai-capability-item">{cap}</div>
            ))}
          </div>
          <div className="ai-examples">
            <strong>Beispiele:</strong>
            {response.examples.map((ex, idx) => (
              <button
                key={idx}
                className="ai-example-btn"
                onClick={() => onSuggestionClick(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )

    case 'comparison':
      return (
        <div className="ai-response-comparison">
          <h3>{response.title}</h3>
          <div className="ai-comparison-table">
            <table>
              <thead>
                <tr>
                  <th>Eigenschaft</th>
                  {response.products.map((p, idx) => (
                    <th key={idx}>{p.name}<br/><small>{p.supplier}</small></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Farbe (EBC)</td>
                  {response.products.map((p, idx) => (
                    <td key={idx}><strong>{p.color}</strong> ({p.colorCategory})</td>
                  ))}
                </tr>
                <tr>
                  <td>Einsatz</td>
                  {response.products.map((p, idx) => (
                    <td key={idx}>{p.usage}</td>
                  ))}
                </tr>
                <tr>
                  <td>Enzyme</td>
                  {response.products.map((p, idx) => (
                    <td key={idx}>{p.enzymes}</td>
                  ))}
                </tr>
                <tr>
                  <td>Aroma</td>
                  {response.products.map((p, idx) => (
                    <td key={idx}>{p.aroma}</td>
                  ))}
                </tr>
                <tr>
                  <td>Geeignet für</td>
                  {response.products.map((p, idx) => (
                    <td key={idx}>{p.beerTypes}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )

    case 'supplier_comparison':
      return (
        <div className="ai-response-supplier-comparison">
          <h3>{response.title}</h3>
          <div className="ai-supplier-cards">
            {response.suppliers.map((supplier, idx) => (
              <div key={idx} className="ai-supplier-card">
                <h4>{supplier.name}</h4>
                <div className="ai-esg-score-large">{supplier.esgScore}/10</div>
                <div className="ai-esg-rating">{supplier.rating}</div>
                <div className="ai-esg-breakdown">
                  <div className="ai-esg-item">
                    <span>🌍 Umwelt:</span>
                    <strong>{supplier.environmental}/10</strong>
                  </div>
                  <div className="ai-esg-item">
                    <span>👥 Soziales:</span>
                    <strong>{supplier.social}/10</strong>
                  </div>
                  <div className="ai-esg-item">
                    <span>⚖️ Governance:</span>
                    <strong>{supplier.governance}/10</strong>
                  </div>
                </div>
                {supplier.strengths.length > 0 && (
                  <div className="ai-strengths">
                    <strong>Stärken:</strong>
                    <ul>
                      {supplier.strengths.slice(0, 3).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )

    case 'ranking':
      return (
        <div className="ai-response-ranking">
          <h3>{response.title}</h3>
          <div className="ai-ranking-list">
            {response.items.map((item, idx) => (
              <div key={idx} className="ai-ranking-item">
                <span className="ai-rank">#{item.rank}</span>
                <span className="ai-rank-name">{item.name}</span>
                <span className="ai-rank-score">{item.score}</span>
                <span className="ai-rank-rating">{item.rating}</span>
              </div>
            ))}
          </div>
        </div>
      )

    case 'product_list':
      return (
        <div className="ai-response-product-list">
          <h3>{response.title}</h3>
          <div className="ai-product-grid">
            {response.products.map((product, idx) => (
              <div key={idx} className="ai-product-card-small">
                <div className="ai-product-header">
                  <strong>{product.name}</strong>
                  <span className="ai-product-supplier">{product.supplier}</span>
                </div>
                <div className="ai-product-details">
                  <span>🎨 {product.color.ebc} EBC ({product.color.category})</span>
                  <span>📊 {product.usage}</span>
                  <span>⚗️ {product.enzymes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'supplier_info':
      return (
        <div className="ai-response-supplier-info">
          <h3>{response.name}</h3>
          <p className="ai-supplier-description">{response.description}</p>
          <div className="ai-supplier-stats">
            <div className="ai-stat">
              <span className="ai-stat-label">Standort:</span>
              <span className="ai-stat-value">{response.location.city}, {response.location.country}</span>
            </div>
            <div className="ai-stat">
              <span className="ai-stat-label">Produkte:</span>
              <span className="ai-stat-value">{response.productCount}</span>
            </div>
            {response.esg && (
              <div className="ai-stat">
                <span className="ai-stat-label">ESG-Score:</span>
                <span className="ai-stat-value">{response.esg.score}/10 ({response.esg.rating})</span>
              </div>
            )}
          </div>
          {response.certifications && response.certifications.length > 0 && (
            <div className="ai-certifications">
              <strong>Zertifizierungen:</strong>
              <div className="ai-cert-list">
                {response.certifications.map((cert, idx) => (
                  <span key={idx} className="ai-cert-badge">{cert}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )

    case 'recommendations':
      return (
        <div className="ai-response-recommendations">
          <h3>{response.title}</h3>
          <div className="ai-recommendation-list">
            {response.products.map((product, idx) => (
              <div key={idx} className="ai-recommendation-item">
                <div className="ai-rec-header">
                  <strong>{product.name}</strong>
                  <span className="ai-rec-supplier">{product.supplier}</span>
                </div>
                <div className="ai-rec-info">
                  <span>🎨 {product.color.ebc} EBC</span>
                  <span>📊 {product.usage}</span>
                </div>
                <p className="ai-rec-rating">{product.rating}</p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'statistics':
      return (
        <div className="ai-response-statistics">
          <h3>{response.title}</h3>
          <div className="ai-stats-grid">
            <div className="ai-stat-card">
              <div className="ai-stat-value">{response.stats.totalSuppliers}</div>
              <div className="ai-stat-label">Lieferanten</div>
            </div>
            <div className="ai-stat-card">
              <div className="ai-stat-value">{response.stats.totalProducts}</div>
              <div className="ai-stat-label">Produkte</div>
            </div>
          </div>
          <div className="ai-stats-breakdown">
            <h4>Produkte pro Lieferant:</h4>
            {Object.entries(response.stats.productsBySupplier).map(([name, count]) => (
              <div key={name} className="ai-stat-bar">
                <span className="ai-stat-bar-label">{name}</span>
                <div className="ai-stat-bar-track">
                  <div
                    className="ai-stat-bar-fill"
                    style={{ width: `${(count / response.stats.totalProducts) * 100}%` }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'certifications':
      return (
        <div className="ai-response-certifications">
          <h3>{response.title}</h3>
          <div className="ai-cert-suppliers">
            {response.suppliers.map((supplier, idx) => (
              <div key={idx} className="ai-cert-supplier">
                <h4>{supplier.name}</h4>
                <div className="ai-cert-tags">
                  {supplier.certifications.map((cert, i) => (
                    <span key={i} className="ai-cert-tag">{cert}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'help':
      return (
        <div className="ai-response-help">
          <p>{response.message}</p>
          {response.suggestions && (
            <div className="ai-suggestions">
              {response.suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  className="ai-suggestion-btn"
                  onClick={() => onSuggestionClick(sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>
      )

    case 'error':
      return (
        <div className="ai-response-error">
          <p>❌ {response.message}</p>
          {response.suggestions && (
            <div className="ai-suggestions">
              {response.suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  className="ai-suggestion-btn"
                  onClick={() => onSuggestionClick(sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>
      )

    case 'clarification':
      return (
        <div className="ai-response-clarification">
          <p>🤔 {response.message}</p>
          {response.suggestions && (
            <div className="ai-suggestions">
              <p><strong>Vorschläge:</strong></p>
              {response.suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  className="ai-suggestion-btn"
                  onClick={() => onSuggestionClick(sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>
      )

    case 'analysis':
      return (
        <div className="ai-response-analysis">
          <h3>📊 {response.title}</h3>

          <div className="ai-analysis-content">
            {response.analysis.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {response.keyFindings && response.keyFindings.length > 0 && (
            <div className="ai-key-findings">
              <h4>🔍 Wichtigste Erkenntnisse:</h4>
              <ul>
                {response.keyFindings.map((finding, idx) => (
                  <li key={idx}>{finding}</li>
                ))}
              </ul>
            </div>
          )}

          {response.dataPoints && Object.keys(response.dataPoints).length > 0 && (
            <div className="ai-data-points">
              <h4>📈 Datenpunkte:</h4>
              <div className="ai-data-grid">
                {Object.entries(response.dataPoints).map(([label, value], idx) => (
                  <div key={idx} className="ai-data-item">
                    <span className="ai-data-label">{label}:</span>
                    <strong className="ai-data-value">{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {response.recommendation && (
            <div className="ai-recommendation-box">
              <h4>💡 Empfehlung:</h4>
              <p>{response.recommendation}</p>
            </div>
          )}
        </div>
      )

    case 'supplier_search':
      return (
        <div className="ai-response-supplier-search">
          <h3>🔍 Lieferantensuche: {response.product}</h3>

          {response.summary && (
            <div className="search-summary">
              <p><strong>Zusammenfassung:</strong> {response.summary}</p>
            </div>
          )}

          {response.methodology && (
            <div className="search-methodology">
              <p><strong>Methodik:</strong> {response.methodology}</p>
              <p><strong>Suchgebiet:</strong> {response.searchRegion}</p>
            </div>
          )}

          {/* Suppliers Table */}
          {response.suppliers && response.suppliers.length > 0 && (
            <div className="suppliers-section">
              <h4>📋 Gefundene Lieferanten ({response.suppliers.length})</h4>
              <div className="suppliers-table-wrapper">
                <table className="suppliers-table">
                  <thead>
                    <tr>
                      <th>Firma</th>
                      <th>Land</th>
                      <th>Standort</th>
                      <th>Typ</th>
                      <th>Größe</th>
                      <th>Mitarbeiter</th>
                      <th>Produktpalette</th>
                      <th>Zertifikate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {response.suppliers.map((supplier, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{supplier.companyName}</strong>
                          {supplier.website && (
                            <div className="supplier-website">
                              <a href={supplier.website} target="_blank" rel="noopener noreferrer">
                                🔗 Website
                              </a>
                            </div>
                          )}
                        </td>
                        <td>{supplier.country}</td>
                        <td className="location-cell">{supplier.location}</td>
                        <td>{supplier.companyType}</td>
                        <td>{supplier.companySize}</td>
                        <td>{supplier.employees}</td>
                        <td className="product-range-cell">{supplier.productRange}</td>
                        <td>
                          {supplier.certifications && supplier.certifications.length > 0 ? (
                            <ul className="cert-list">
                              {supplier.certifications.map((cert, i) => (
                                <li key={i}>{cert}</li>
                              ))}
                            </ul>
                          ) : (
                            'k. A.'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Evaluation Criteria */}
          {response.evaluationCriteria && response.evaluationCriteria.length > 0 && (
            <div className="evaluation-section">
              <h4>⚖️ Bewertungskriterien</h4>
              <div className="criteria-grid">
                {response.evaluationCriteria.map((criterion, idx) => (
                  <div key={idx} className="criterion-card">
                    <div className="criterion-header">
                      <h5>{criterion.criterion}</h5>
                      <span className="criterion-weight">{criterion.weight}%</span>
                    </div>
                    <p className="criterion-desc">{criterion.description}</p>
                    <div className="criterion-meta">
                      <p><strong>Bedeutung:</strong> {criterion.strategicImportance}</p>
                      <p><strong>Quelle:</strong> {criterion.dataSource}</p>
                      {criterion.reference && <p><strong>Referenz:</strong> {criterion.reference}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scoring System */}
          {response.scoringSystem && (
            <div className="scoring-section">
              <h4>📊 Bewertungssystem</h4>
              <div className="scoring-info">
                <p><strong>Skala:</strong> {response.scoringSystem.scale}</p>
                {response.scoringSystem.thresholds && (
                  <div className="thresholds">
                    <div className="threshold preferred">
                      <span className="threshold-label">Bevorzugt:</span>
                      <span className="threshold-value">≥ {response.scoringSystem.thresholds.preferred}</span>
                    </div>
                    <div className="threshold approved">
                      <span className="threshold-label">Genehmigt:</span>
                      <span className="threshold-value">≥ {response.scoringSystem.thresholds.approved}</span>
                    </div>
                    <div className="threshold watchlist">
                      <span className="threshold-label">Beobachtet:</span>
                      <span className="threshold-value">≥ {response.scoringSystem.thresholds.watchlist}</span>
                    </div>
                    <div className="threshold disqualified">
                      <span className="threshold-label">Disqualifiziert:</span>
                      <span className="threshold-value">&lt; {response.scoringSystem.thresholds.disqualified}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )

    default:
      return <p>{JSON.stringify(response)}</p>
  }
}

export default AIAssistant
