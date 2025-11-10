/**
 * Dashboard Page
 * Main landing page showing key metrics, charts, and activity feed
 */

import React, { useState, useEffect } from 'react'
import { dataService } from '../services/dataService'
import MetricsCards from '../components/dashboard/MetricsCards'
import ChartsSection from '../components/dashboard/ChartsSection'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import '../styles/Dashboard.css'

function Dashboard({ navigateTo, userMemory }) {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(null)
  const [activities, setActivities] = useState([])
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  /**
   * Load all dashboard data
   */
  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [metricsData, activitiesData, analyticsData] = await Promise.all([
        dataService.getDashboardMetrics(),
        dataService.getActivityFeed(10),
        dataService.getAnalytics()
      ])

      setMetrics(metricsData)
      setActivities(activitiesData)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page dashboard-page">
        <div className="loading">
          <div className="spinner" aria-label="Lädt..."></div>
        </div>
      </div>
    )
  }

  return (
    <div className="page dashboard-page">
      {/* Page Header */}
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          Übersicht über Lieferanten, Bewertungen und Compliance-Status
        </p>
      </header>

      {/* Metrics Cards */}
      {metrics && (
        <MetricsCards metrics={metrics} navigateTo={navigateTo} />
      )}

      {/* Charts Section */}
      {analytics && (
        <ChartsSection analytics={analytics} />
      )}

      {/* Activity Feed */}
      <div className="dashboard-section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Neueste Aktivitäten</h2>
          </div>
          <div className="card-body">
            <ActivityFeed activities={activities} navigateTo={navigateTo} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
