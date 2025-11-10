/**
 * Header Component
 * Main navigation bar for the Paulaner Supplier Portal
 */

import React from 'react'
import '../../styles/Header.css'

function Header({ currentPage, onNavigate }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'discovery', label: 'Lieferanten finden', icon: '🔍' },
    { id: 'rating', label: 'Bewertung', icon: '⭐' },
    { id: 'reports', label: 'Berichte', icon: '📈' },
    { id: 'settings', label: 'Einstellungen', icon: '⚙️' }
  ]

  return (
    <header className="header" role="banner">
      <div className="header-container">
        {/* Logo and Brand */}
        <div className="header-brand">
          <div className="logo" aria-label="Paulaner Logo">
            {/* Paulaner Logo Placeholder - Replace with actual logo */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#D4AF37"/>
              <text x="20" y="26" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#003366">P</text>
            </svg>
          </div>
          <div className="brand-text">
            <h1 className="brand-title">Paulaner</h1>
            <p className="brand-subtitle">Lieferantenportal</p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="header-nav" role="navigation" aria-label="Hauptnavigation">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.id} className="nav-item">
                <button
                  className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                  aria-current={currentPage === item.id ? 'page' : undefined}
                  aria-label={item.label}
                >
                  <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Menu */}
        <div className="header-user">
          <button
            className="user-button"
            aria-label="Benutzerprofil"
            onClick={() => onNavigate('settings')}
          >
            <span className="user-icon">👤</span>
            <span className="user-name">Benutzer</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
