/**
 * Metrics Cards Component
 * Displays key performance indicators on the dashboard
 */

import React from 'react'
import '../../styles/MetricsCards.css'

function MetricsCards({ metrics, navigateTo }) {
  const cards = [
    {
      id: 'suppliers',
      title: 'Registrierte Lieferanten',
      value: metrics.totalSuppliers,
      icon: '🏢',
      color: 'primary',
      action: () => navigateTo('discovery')
    },
    {
      id: 'rating',
      title: 'Durchschnittsbewertung',
      value: metrics.averageRating,
      suffix: '/10',
      icon: '⭐',
      color: 'secondary',
      action: null
    },
    {
      id: 'categories',
      title: 'Produktkategorien',
      value: metrics.totalCategories || 6,
      icon: '📦',
      color: 'info',
      action: () => navigateTo('discovery')
    },
    {
      id: 'pending',
      title: 'Offene Bewertungen',
      value: metrics.pendingRatings,
      icon: '📝',
      color: 'warning',
      action: () => navigateTo('rating')
    }
  ]

  return (
    <div className="metrics-cards">
      {cards.map(card => (
        <div
          key={card.id}
          className={`metric-card metric-card-${card.color} ${card.action ? 'metric-card-clickable' : ''}`}
          onClick={card.action}
          role={card.action ? 'button' : 'article'}
          tabIndex={card.action ? 0 : undefined}
          onKeyPress={(e) => {
            if (card.action && (e.key === 'Enter' || e.key === ' ')) {
              card.action()
            }
          }}
          aria-label={`${card.title}: ${card.value}${card.suffix || ''}`}
        >
          <div className="metric-icon" aria-hidden="true">
            {card.icon}
          </div>
          <div className="metric-content">
            <h3 className="metric-title">{card.title}</h3>
            <p className="metric-value">
              {card.value}
              {card.suffix && <span className="metric-suffix">{card.suffix}</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MetricsCards
