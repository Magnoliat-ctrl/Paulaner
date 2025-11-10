/**
 * Footer Component
 * Contains copyright notice, legal links, and compliance information
 */

import React from 'react'
import '../../styles/Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        {/* Footer Content */}
        <div className="footer-content">
          {/* Copyright */}
          <div className="footer-section">
            <p className="copyright">
              © {currentYear} Paulaner Brauerei Gruppe. Alle Rechte vorbehalten.
            </p>
          </div>

          {/* Legal Links */}
          <div className="footer-section footer-links">
            <a href="#datenschutz" className="footer-link" aria-label="Datenschutzerklärung">
              Datenschutz
            </a>
            <span className="footer-separator" aria-hidden="true">|</span>
            <a href="#impressum" className="footer-link" aria-label="Impressum">
              Impressum
            </a>
            <span className="footer-separator" aria-hidden="true">|</span>
            <a href="#code-of-conduct" className="footer-link" aria-label="Code of Conduct">
              Code of Conduct
            </a>
            <span className="footer-separator" aria-hidden="true">|</span>
            <a href="#kontakt" className="footer-link" aria-label="Kontakt">
              Kontakt
            </a>
          </div>

          {/* Compliance Notice */}
          <div className="footer-section">
            <p className="compliance-notice">
              <span className="compliance-icon" aria-hidden="true">🛡️</span>
              <span>
                Dieses Portal folgt den Menschenrechts- und Umweltstandards der Paulaner Brauerei Gruppe
              </span>
            </p>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p className="footer-note">
            Nur für interne Verwendung durch autorisierte Mitarbeiter der Paulaner Brauerei Gruppe
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
