/**
 * Settings Page
 * User preferences and configuration
 */

import React, { useState, useEffect } from 'react'
import { memoryService } from '../services/memoryService'
import '../styles/Settings.css'

function Settings({ userMemory, onSettingsUpdate }) {
  const [preferences, setPreferences] = useState({
    language: 'de',
    theme: 'light',
    dashboardLayout: 'default'
  })

  const [notifications, setNotifications] = useState({
    enabled: true,
    emailAlerts: true,
    complianceAlerts: true,
    ratingReminders: true
  })

  const [userRole, setUserRole] = useState('Sachbearbeiter')

  useEffect(() => {
    if (userMemory) {
      setPreferences(userMemory.preferences || preferences)
      setNotifications(userMemory.notifications || notifications)
    }
  }, [userMemory])

  const handlePreferenceChange = (key, value) => {
    const newPrefs = { ...preferences, [key]: value }
    setPreferences(newPrefs)
    memoryService.updatePreferences(newPrefs)
    if (onSettingsUpdate) {
      onSettingsUpdate({ ...userMemory, preferences: newPrefs })
    }
  }

  const handleNotificationChange = (key, value) => {
    const newNotifs = { ...notifications, [key]: value }
    setNotifications(newNotifs)
    memoryService.updateNotificationSettings(newNotifs)
    if (onSettingsUpdate) {
      onSettingsUpdate({ ...userMemory, notifications: newNotifs })
    }
  }

  const handleClearMemory = () => {
    if (window.confirm('Möchten Sie wirklich alle gespeicherten Einstellungen zurücksetzen?')) {
      memoryService.clearMemory()
      window.location.reload()
    }
  }

  const handleExportData = () => {
    const data = memoryService.exportMemory()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'paulaner-settings-export.json'
    a.click()
  }

  return (
    <div className="page settings-page">
      <header className="page-header">
        <h1 className="page-title">Einstellungen</h1>
        <p className="page-description">Personalisieren Sie Ihr Portal-Erlebnis</p>
      </header>

      {/* User Profile */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Benutzerprofil</h2>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Rolle</label>
            <select
              className="form-select"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
            >
              <option value="Sachbearbeiter">Sachbearbeiter</option>
              <option value="Teamleiter">Teamleiter</option>
              <option value="Administrator">Administrator</option>
            </select>
            <p className="form-help">
              <strong>Sachbearbeiter:</strong> Suchen und bewerten von Lieferanten<br />
              <strong>Teamleiter:</strong> + Berichte erstellen<br />
              <strong>Administrator:</strong> + Lieferanten verwalten, Compliance-Warnungen
            </p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Präferenzen</h2>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Sprache</label>
            <select
              className="form-select"
              value={preferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value)}
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Theme</label>
            <select
              className="form-select"
              value={preferences.theme}
              onChange={(e) => handlePreferenceChange('theme', e.target.value)}
            >
              <option value="light">Hell</option>
              <option value="dark">Dunkel (noch nicht verfügbar)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Dashboard-Layout</label>
            <select
              className="form-select"
              value={preferences.dashboardLayout}
              onChange={(e) => handlePreferenceChange('dashboardLayout', e.target.value)}
            >
              <option value="default">Standard</option>
              <option value="compact">Kompakt</option>
              <option value="detailed">Detailliert</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Benachrichtigungen</h2>
        </div>
        <div className="card-body">
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={notifications.enabled}
                onChange={(e) => handleNotificationChange('enabled', e.target.checked)}
              />
              <span>Benachrichtigungen aktivieren</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={notifications.emailAlerts}
                onChange={(e) => handleNotificationChange('emailAlerts', e.target.checked)}
                disabled={!notifications.enabled}
              />
              <span>E-Mail-Benachrichtigungen</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={notifications.complianceAlerts}
                onChange={(e) => handleNotificationChange('complianceAlerts', e.target.checked)}
                disabled={!notifications.enabled}
              />
              <span>Compliance-Warnungen</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={notifications.ratingReminders}
                onChange={(e) => handleNotificationChange('ratingReminders', e.target.checked)}
                disabled={!notifications.enabled}
              />
              <span>Bewertungserinnerungen</span>
            </label>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Datenverwaltung</h2>
        </div>
        <div className="card-body">
          <div className="data-actions">
            <button className="btn btn-outline" onClick={handleExportData}>
              📥 Einstellungen exportieren
            </button>
            <button className="btn btn-danger" onClick={handleClearMemory}>
              🗑️ Alle Daten zurücksetzen
            </button>
          </div>
          <p className="form-help">
            <strong>Hinweis:</strong> Alle Daten werden aktuell client-seitig gespeichert (localStorage).
            In der Produktivversion erfolgt die Speicherung auf dem Server.
          </p>
        </div>
      </div>

      {/* Compliance Info */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Datenschutz & Compliance</h2>
        </div>
        <div className="card-body">
          <div className="compliance-info">
            <p>
              <strong>🛡️ Paulaner Code of Conduct</strong><br />
              Dieses Portal folgt den Menschenrechts- und Umweltstandards der Paulaner Brauerei Gruppe.
            </p>
            <p>
              <strong>🔒 Datenschutz (DSGVO)</strong><br />
              Alle personenbezogenen Daten werden gemäß DSGVO-Anforderungen verarbeitet.
            </p>
            <p>
              <strong>⚖️ Rechtliche Hinweise</strong><br />
              Nur für interne Verwendung durch autorisierte Mitarbeiter.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
