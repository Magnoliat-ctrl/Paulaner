import { useState, useEffect } from 'react'
import '../styles/MarketReport.css'

function MarketReport({ navigateTo }) {
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)

  useEffect(() => {
    // Load existing reports
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const response = await fetch('/src/data/marketReport.json')
      const data = await response.json()
      setReports(data.reports || [])

      // Select most recent report by default
      if (data.reports && data.reports.length > 0) {
        setSelectedReport(data.reports[0])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Marktreports:', error)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const reportData = JSON.parse(e.target.result)
        setUploadedFile(reportData)
        setSelectedReport(reportData)

        // Add to reports list
        setReports(prev => [reportData, ...prev])

        console.log('✅ Marktreport erfolgreich hochgeladen:', reportData.reportMetadata?.weekNumber)
      } catch (error) {
        alert('Fehler beim Lesen der JSON-Datei. Bitte überprüfen Sie das Format.')
        console.error('JSON Parse Error:', error)
      }
    }
    reader.readAsText(file)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'steigend': return '📈'
      case 'fallend': return '📉'
      case 'stabil': return '➡️'
      default: return '📊'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'hoch': return 'priority-high'
      case 'mittel': return 'priority-medium'
      case 'niedrig': return 'priority-low'
      default: return ''
    }
  }

  if (!selectedReport) {
    return (
      <div className="page market-report-page">
        <div className="market-report-header">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigateTo('dashboard')}
          >
            ← Zurück zum Dashboard
          </button>
          <h1>📊 Wöchentlicher Marktreport</h1>
        </div>

        <div className="market-report-empty">
          <div className="upload-zone">
            <div className="upload-icon">📄</div>
            <h2>Kein Marktreport verfügbar</h2>
            <p>Laden Sie einen wöchentlichen Marktreport hoch, um zu beginnen.</p>

            <label className="upload-button btn btn-primary">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              Marktreport hochladen (.json)
            </label>

            <div className="upload-help">
              <p><strong>Erwartetes Format:</strong> JSON-Datei mit Marktdaten</p>
              <p>Siehe <code>marketReport.example.json</code> für die Struktur</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const report = selectedReport

  return (
    <div className="page market-report-page">
      <div className="market-report-header">
        <button
          className="btn btn-outline btn-sm"
          onClick={() => navigateTo('dashboard')}
        >
          ← Zurück zum Dashboard
        </button>
        <h1>📊 Wöchentlicher Marktreport</h1>
        <label className="btn btn-secondary btn-sm">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          Neuen Report hochladen
        </label>
      </div>

      {/* Report Metadata */}
      <div className="report-meta-card">
        <div className="report-meta-info">
          <h2>KW {report.reportMetadata?.weekNumber} {report.reportMetadata?.year}</h2>
          <p className="report-date-range">
            {formatDate(report.reportMetadata?.dateRange?.from)} - {formatDate(report.reportMetadata?.dateRange?.to)}
          </p>
          <p className="report-author">Erstellt von: {report.reportMetadata?.author}</p>
        </div>
        <div className={`market-sentiment sentiment-${report.marketOverview?.marketSentiment}`}>
          <span className="sentiment-label">Marktstimmung</span>
          <span className="sentiment-value">{report.marketOverview?.marketSentiment}</span>
        </div>
      </div>

      {/* Market Overview */}
      <div className="report-section">
        <h3>🌍 Marktübersicht</h3>
        <div className="overview-card">
          <p className="overview-summary">{report.marketOverview?.summary}</p>

          {report.marketOverview?.keyTrends && report.marketOverview.keyTrends.length > 0 && (
            <div className="key-trends">
              <h4>Haupttrends:</h4>
              <ul>
                {report.marketOverview.keyTrends.map((trend, idx) => (
                  <li key={idx}>{trend}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Price Changes */}
      {report.priceChanges && report.priceChanges.length > 0 && (
        <div className="report-section">
          <h3>💰 Preisentwicklung</h3>
          <div className="price-table">
            <table>
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Aktuell</th>
                  <th>Vorwoche</th>
                  <th>Änderung</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {report.priceChanges.map((price, idx) => (
                  <tr key={idx}>
                    <td><strong>{price.productType}</strong></td>
                    <td>{price.currentPrice} {price.unit}</td>
                    <td>{price.previousPrice} {price.unit}</td>
                    <td className={price.change >= 0 ? 'change-positive' : 'change-negative'}>
                      {price.change >= 0 ? '+' : ''}{price.change.toFixed(1)}%
                    </td>
                    <td>{getTrendIcon(price.trend)} {price.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Highlights */}
      {report.supplierHighlights && report.supplierHighlights.length > 0 && (
        <div className="report-section">
          <h3>🏭 Lieferanten-Updates</h3>
          <div className="supplier-highlights">
            {report.supplierHighlights.map((highlight, idx) => (
              <div key={idx} className={`highlight-card impact-${highlight.impact}`}>
                <h4>{highlight.supplier}</h4>
                <p>{highlight.highlight}</p>
                <span className="impact-badge">{highlight.impact}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demand Analysis */}
      {report.demandAnalysis && (
        <div className="report-section">
          <h3>📈 Nachfrageanalyse</h3>
          <div className="demand-grid">
            {report.demandAnalysis.topProducts?.map((product, idx) => (
              <div key={idx} className="demand-card">
                <h4>{product.name}</h4>
                <div className="demand-level">Nachfrage: <strong>{product.demand}</strong></div>
                <div className={`demand-change ${product.changePercent >= 0 ? 'positive' : 'negative'}`}>
                  {product.changePercent >= 0 ? '+' : ''}{product.changePercent.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          {report.demandAnalysis.seasonalFactors && (
            <p className="seasonal-info"><strong>Saisonale Faktoren:</strong> {report.demandAnalysis.seasonalFactors}</p>
          )}
        </div>
      )}

      {/* Sustainability */}
      {report.sustainability && (
        <div className="report-section">
          <h3>🌱 Nachhaltigkeit & ESG</h3>
          <div className="sustainability-content">
            {report.sustainability.esgTrends && report.sustainability.esgTrends.length > 0 && (
              <div className="esg-trends">
                <h4>ESG-Trends:</h4>
                <ul>
                  {report.sustainability.esgTrends.map((trend, idx) => (
                    <li key={idx}>{trend}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.sustainability.upcomingRegulations && report.sustainability.upcomingRegulations.length > 0 && (
              <div className="regulations">
                <h4>Kommende Regularien:</h4>
                <ul>
                  {report.sustainability.upcomingRegulations.map((reg, idx) => (
                    <li key={idx}>{reg}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Outlook */}
      {report.outlook && (
        <div className="report-section">
          <h3>🔮 Ausblick</h3>
          <div className="outlook-content">
            <p className="outlook-next-week"><strong>Nächste Woche:</strong> {report.outlook.nextWeek}</p>

            <div className="outlook-grid">
              {report.outlook.risks && report.outlook.risks.length > 0 && (
                <div className="outlook-box risks">
                  <h4>⚠️ Risiken:</h4>
                  <ul>
                    {report.outlook.risks.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {report.outlook.opportunities && report.outlook.opportunities.length > 0 && (
                <div className="outlook-box opportunities">
                  <h4>💡 Chancen:</h4>
                  <ul>
                    {report.outlook.opportunities.map((opp, idx) => (
                      <li key={idx}>{opp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div className="report-section">
          <h3>✅ Handlungsempfehlungen</h3>
          <div className="recommendations-list">
            {report.recommendations.map((rec, idx) => (
              <div key={idx} className={`recommendation-card ${getPriorityColor(rec.priority)}`}>
                <div className="rec-header">
                  <span className="rec-priority">{rec.priority}</span>
                  <span className="rec-deadline">bis {formatDate(rec.deadline)}</span>
                </div>
                <p className="rec-action">{rec.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MarketReport
