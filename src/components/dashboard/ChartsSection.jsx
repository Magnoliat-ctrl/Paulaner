/**
 * Charts Section Component
 * Displays various charts for data visualization
 * Uses Chart.js for rendering charts
 */

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'
import '../../styles/ChartsSection.css'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

function ChartsSection({ analytics }) {
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
   * Certifications Distribution Chart Data
   */
  const certificationsData = {
    labels: analytics.certifications?.map(c => c.name) || ['ISO 9001', 'HACCP', 'BRC', 'IFS', 'Organic'],
    datasets: [
      {
        label: 'Anzahl Zertifikate',
        data: analytics.certifications?.map(c => c.count) || [15, 12, 8, 6, 5],
        backgroundColor: [
          '#28A745', // Green
          '#17A2B8', // Blue
          '#D4AF37', // Gold
          '#FFC107', // Yellow
          '#6F42C1'  // Purple
        ],
        borderColor: '#FFFFFF',
        borderWidth: 2
      }
    ]
  }

  const certificationsOptions = {
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
      {/* Category Distribution and Certifications */}
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
              <h2 className="card-title">Zertifikate-Verteilung</h2>
            </div>
            <div className="card-body">
              <div className="chart-wrapper" style={{ height: '300px' }}>
                <Pie data={certificationsData} options={certificationsOptions} />
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
