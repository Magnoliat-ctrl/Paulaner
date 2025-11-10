/**
 * Charts Section Component
 * Displays various charts for data visualization
 * Uses Chart.js for rendering charts
 */

import React, { useRef, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'
import '../../styles/ChartsSection.css'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function ChartsSection({ analytics }) {
  /**
   * Rating Trends Chart Data
   */
  const ratingTrendsData = {
    labels: analytics.ratingTrends.map(t => {
      const [year, month] = t.month.split('-')
      return `${month}/${year.slice(2)}`
    }),
    datasets: [
      {
        label: 'Durchschnittsbewertung',
        data: analytics.ratingTrends.map(t => parseFloat(t.averageRating)),
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  const ratingTrendsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 2
        }
      }
    }
  }

  /**
   * Category Distribution Chart Data
   */
  const categoryData = {
    labels: analytics.categoryDistribution.map(c => c.category),
    datasets: [
      {
        label: 'Anzahl Lieferanten',
        data: analytics.categoryDistribution.map(c => c.count),
        backgroundColor: [
          '#003366',
          '#D4AF37',
          '#17A2B8',
          '#28A745',
          '#FFC107'
        ],
        borderColor: '#FFFFFF',
        borderWidth: 2
      }
    ]
  }

  const categoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right'
      }
    }
  }

  /**
   * Compliance Overview Chart Data
   */
  const complianceLabels = {
    'compliant': 'Konform',
    'minor-violation': 'Geringfügige Verstöße',
    'under-review': 'In Prüfung',
    'major-violation': 'Schwere Verstöße'
  }

  const complianceData = {
    labels: Object.keys(analytics.complianceOverview).map(k => complianceLabels[k] || k),
    datasets: [
      {
        label: 'Compliance-Status',
        data: Object.values(analytics.complianceOverview),
        backgroundColor: [
          '#28A745', // Green for compliant
          '#FFC107', // Yellow for minor
          '#17A2B8', // Blue for under review
          '#DC3545'  // Red for major
        ],
        borderColor: '#FFFFFF',
        borderWidth: 2
      }
    ]
  }

  const complianceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    }
  }

  /**
   * Top Performers Chart Data
   */
  const topPerformersData = {
    labels: analytics.topPerformers.map(s => s.name.split(' ')[0]), // Shortened names
    datasets: [
      {
        label: 'Durchschnittsbewertung',
        data: analytics.topPerformers.map(s => s.avgRating),
        backgroundColor: '#D4AF37',
        borderColor: '#003366',
        borderWidth: 1
      }
    ]
  }

  const topPerformersOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 10
      }
    }
  }

  return (
    <div className="charts-section">
      {/* Rating Trends */}
      <div className="chart-container chart-full-width">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Bewertungstrends</h2>
            <p className="card-subtitle">Entwicklung der Durchschnittsbewertungen über Zeit</p>
          </div>
          <div className="card-body">
            <div className="chart-wrapper" style={{ height: '300px' }}>
              <Line data={ratingTrendsData} options={ratingTrendsOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution and Compliance */}
      <div className="chart-row">
        <div className="chart-container chart-half-width">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Kategorien-Verteilung</h2>
            </div>
            <div className="card-body">
              <div className="chart-wrapper" style={{ height: '300px' }}>
                <Pie data={categoryData} options={categoryOptions} />
              </div>
            </div>
          </div>
        </div>

        <div className="chart-container chart-half-width">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Compliance-Übersicht</h2>
            </div>
            <div className="card-body">
              <div className="chart-wrapper" style={{ height: '300px' }}>
                <Pie data={complianceData} options={complianceOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="chart-container chart-full-width">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Top 5 Lieferanten</h2>
            <p className="card-subtitle">Lieferanten mit den höchsten Durchschnittsbewertungen</p>
          </div>
          <div className="card-body">
            <div className="chart-wrapper" style={{ height: '250px' }}>
              <Bar data={topPerformersData} options={topPerformersOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChartsSection
