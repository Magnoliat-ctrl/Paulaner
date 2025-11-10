/**
 * Activity Feed Component
 * Displays recent activities, ratings, and warnings
 */

import React from 'react'
import '../../styles/ActivityFeed.css'

function ActivityFeed({ activities, navigateTo }) {
  /**
   * Format timestamp for display
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted time
   */
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Gerade eben'
    if (diffMins < 60) return `Vor ${diffMins} Minute${diffMins > 1 ? 'n' : ''}`
    if (diffHours < 24) return `Vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`
    if (diffDays < 7) return `Vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`

    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  /**
   * Get activity icon based on type
   * @param {string} type - Activity type
   * @returns {string} Icon emoji
   */
  const getActivityIcon = (type) => {
    switch (type) {
      case 'rating':
        return '⭐'
      case 'warning':
        return '⚠️'
      case 'compliance':
        return '🛡️'
      case 'update':
        return '🔄'
      default:
        return '📌'
    }
  }

  /**
   * Get activity color class based on type
   * @param {string} type - Activity type
   * @returns {string} CSS class
   */
  const getActivityClass = (type, severity) => {
    if (type === 'warning') {
      if (severity === 'niedrig') return 'activity-warning-low'
      if (severity === 'mittel') return 'activity-warning-medium'
      return 'activity-warning-high'
    }
    if (type === 'rating') return 'activity-rating'
    return 'activity-default'
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="activity-feed-empty">
        <p>Keine aktuellen Aktivitäten</p>
      </div>
    )
  }

  return (
    <div className="activity-feed">
      {activities.map((activity, index) => (
        <div
          key={index}
          className={`activity-item ${getActivityClass(activity.type, activity.severity)}`}
          onClick={() => {
            if (activity.supplierId) {
              navigateTo('profile', { supplierId: activity.supplierId })
            }
          }}
          role={activity.supplierId ? 'button' : 'article'}
          tabIndex={activity.supplierId ? 0 : undefined}
          onKeyPress={(e) => {
            if (activity.supplierId && (e.key === 'Enter' || e.key === ' ')) {
              navigateTo('profile', { supplierId: activity.supplierId })
            }
          }}
        >
          <div className="activity-icon" aria-hidden="true">
            {getActivityIcon(activity.type)}
          </div>

          <div className="activity-content">
            <p className="activity-description">{activity.description}</p>
            <p className="activity-time">{formatTimestamp(activity.timestamp)}</p>
          </div>

          {activity.score && (
            <div className="activity-score">
              <span className="score-value">{activity.score.toFixed(1)}</span>
              <span className="score-label">/10</span>
            </div>
          )}

          {activity.supplierId && (
            <div className="activity-action">
              <span className="action-icon" aria-hidden="true">→</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ActivityFeed
