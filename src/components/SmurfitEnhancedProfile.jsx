/**
 * Smurfit WestRock Enhanced Profile
 * BOLD, Industrial-Brutalist Design with Dramatic Visualizations
 */

import React, { useState, useEffect } from 'react'
import '../styles/SmurfitEnhanced.css'

function SmurfitEnhancedProfile({ supplier, navigateTo }) {
  const [animateMetrics, setAnimateMetrics] = useState(false)
  const [visibleSections, setVisibleSections] = useState(new Set())

  useEffect(() => {
    // Trigger animations on mount
    setTimeout(() => setAnimateMetrics(true), 100)

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]))
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Radial gauge component
  const RadialGauge = ({ value, max, label, color }) => {
    const percentage = (value / max) * 100
    const circumference = 2 * Math.PI * 45
    const offset = circumference - (percentage / 100) * circumference

    return (
      <div className="radial-gauge">
        <svg viewBox="0 0 100 100" className="gauge-svg">
          <circle cx="50" cy="50" r="45" className="gauge-bg" />
          <circle
            cx="50"
            cy="50"
            r="45"
            className="gauge-fill"
            style={{
              stroke: color,
              strokeDasharray: circumference,
              strokeDashoffset: animateMetrics ? offset : circumference
            }}
          />
        </svg>
        <div className="gauge-content">
          <div className="gauge-value">{value}</div>
          <div className="gauge-max">/{max}</div>
        </div>
        <div className="gauge-label">{label}</div>
      </div>
    )
  }

  // Animated counter
  const AnimatedCounter = ({ target, suffix = '', duration = 2000 }) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
      if (!animateMetrics) return

      let start = 0
      const increment = target / (duration / 16)
      const timer = setInterval(() => {
        start += increment
        if (start >= target) {
          setCount(target)
          clearInterval(timer)
        } else {
          setCount(Math.floor(start))
        }
      }, 16)

      return () => clearInterval(timer)
    }, [animateMetrics, target, duration])

    return <span>{typeof count === 'number' ? count.toLocaleString('de-DE') : count}{suffix}</span>
  }

  const ratings = supplier.ratings?.[0]?.categories || {}
  const weights = supplier.ratings?.[0]?.weights || {}

  return (
    <div className="smurfit-enhanced-profile">
      {/* HERO SECTION - Dramatic entrance */}
      <div className="smurfit-hero" data-animate id="hero">
        <button
          className="smurfit-back-btn"
          onClick={() => navigateTo('discovery')}
        >
          ← ZURÜCK
        </button>

        <div className="hero-grid">
          <div className="hero-left">
            <div className="company-badge">
              <span className="badge-text">EST. {supplier.founded}</span>
              <span className="badge-years">{new Date().getFullYear() - supplier.founded} JAHRE</span>
            </div>

            <h1 className="smurfit-title">
              <span className="title-line-1">SMURFIT</span>
              <span className="title-line-2">WESTROCK</span>
              <span className="title-accent">PLC</span>
            </h1>

            <div className="hero-tagline">
              WELTMARKTFÜHRER FÜR<br/>
              WELLPAPPE & VERPACKUNG
            </div>

            <div className="hero-recommendation">
              <div className="rec-icon">✓</div>
              <div className="rec-text">
                <div className="rec-label">EMPFEHLUNG</div>
                <div className="rec-status">{supplier.recommendation?.toUpperCase()}</div>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-logo-placeholder">
              <div className="logo-text">SMURFIT<br/>WESTROCK</div>
              <div className="logo-pattern"></div>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <div className="stat-value">#{supplier.esgRatings?.sustainalytics?.rank?.match(/\d+/)?.[0] || '1'}</div>
                <div className="stat-label">ESG RANKING</div>
              </div>
              <div className="hero-stat">
                <div className="stat-value">{supplier.marketShare}</div>
                <div className="stat-label">MARKTANTEIL</div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-metrics-strip">
          <div className="metric-item">
            <div className="metric-number">
              {animateMetrics && <AnimatedCounter target={100} suffix="k+" />}
            </div>
            <div className="metric-text">MITARBEITER</div>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <div className="metric-number">{supplier.revenue}</div>
            <div className="metric-text">UMSATZ (PRO-FORMA)</div>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <div className="metric-number">
              {animateMetrics && <AnimatedCounter target={500} suffix="+" />}
            </div>
            <div className="metric-text">STANDORTE WELTWEIT</div>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <div className="metric-number">
              {animateMetrics && <AnimatedCounter target={40} suffix="+" />}
            </div>
            <div className="metric-text">LÄNDER</div>
          </div>
        </div>
      </div>

      {/* RATING GAUGES SECTION */}
      <div className="smurfit-section ratings-section" data-animate id="ratings">
        <h2 className="section-title">
          <span className="title-number">01</span>
          LEISTUNGSBEWERTUNG
        </h2>

        <div className="gauges-grid">
          <RadialGauge value={ratings.Qualität || 9} max={10} label="QUALITÄT" color="#ff6b35" />
          <RadialGauge value={ratings.Lieferfähigkeit || 9} max={10} label="LIEFERFÄHIGKEIT" color="#f7931e" />
          <RadialGauge value={ratings.Nachhaltigkeit || 10} max={10} label="NACHHALTIGKEIT" color="#4ecdc4" />
          <RadialGauge value={ratings.Risiko || 8} max={10} label="RISIKO" color="#95e1d3" />
          <RadialGauge value={ratings.Innovation || 9} max={10} label="INNOVATION" color="#aa96da" />
          <RadialGauge value={ratings["Preis-Leistung"] || 7} max={10} label="PREIS-LEISTUNG" color="#fcbf49" />
        </div>

        <div className="overall-score">
          <div className="overall-number">{supplier.ratings?.[0]?.overallScore || 9}</div>
          <div className="overall-label">GESAMTBEWERTUNG</div>
          <div className="overall-max">/10</div>
        </div>
      </div>

      {/* ESG EXCELLENCE */}
      <div className="smurfit-section esg-section" data-animate id="esg">
        <h2 className="section-title">
          <span className="title-number">02</span>
          ESG EXCELLENCE
        </h2>

        <div className="esg-hero-score">
          <div className="esg-giant-score">{supplier.esgRatings?.overall || 5}</div>
          <div className="esg-hero-label">
            <div>ESG</div>
            <div>RATING</div>
          </div>
          <div className="esg-hero-flag">
            <div className="flag-icon green">●</div>
            <div className="flag-text">GREEN FLAG</div>
          </div>
        </div>

        <div className="esg-ratings-grid">
          <div className="esg-card sustainalytics">
            <div className="esg-card-header">SUSTAINALYTICS</div>
            <div className="esg-card-score">{supplier.esgRatings?.sustainalytics?.score}</div>
            <div className="esg-card-label">{supplier.esgRatings?.sustainalytics?.risk}</div>
            <div className="esg-card-rank">{supplier.esgRatings?.sustainalytics?.rank}</div>
          </div>

          <div className="esg-card cdp">
            <div className="esg-card-header">CDP RATINGS</div>
            <div className="cdp-grades">
              <div className="cdp-grade">
                <span className="grade-letter">{supplier.esgRatings?.cdp?.climate}</span>
                <span className="grade-label">Climate</span>
              </div>
              <div className="cdp-grade">
                <span className="grade-letter">{supplier.esgRatings?.cdp?.water}</span>
                <span className="grade-label">Water</span>
              </div>
              <div className="cdp-grade">
                <span className="grade-letter">{supplier.esgRatings?.cdp?.forest}</span>
                <span className="grade-label">Forest</span>
              </div>
            </div>
          </div>

          <div className="esg-card msci">
            <div className="esg-card-header">MSCI ESG</div>
            <div className="esg-card-score large">{supplier.esgRatings?.msci}</div>
            <div className="esg-card-label">Rating</div>
          </div>

          <div className="esg-card ecovadis">
            <div className="esg-card-header">ECOVADIS</div>
            <div className="esg-card-score">{supplier.esgRatings?.ecovadis?.rating}</div>
            <div className="esg-card-label">{supplier.esgRatings?.ecovadis?.percentile}</div>
          </div>
        </div>
      </div>

      {/* PRODUCTS SHOWCASE */}
      <div className="smurfit-section products-section" data-animate id="products">
        <h2 className="section-title">
          <span className="title-number">03</span>
          PRODUKTE FÜR GETRÄNKEINDUSTRIE
        </h2>

        <div className="products-grid">
          {supplier.products?.map((product, idx) => (
            <div key={idx} className="product-card" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="product-number">{String(idx + 1).padStart(2, '0')}</div>
              <div className="product-name">{product.name}</div>
              <div className="product-desc">{product.description}</div>
              <div className="product-tag">{product.category}</div>
            </div>
          ))}
        </div>
      </div>

      {/* STRENGTHS VS WEAKNESSES */}
      <div className="smurfit-section battle-section" data-animate id="battle">
        <h2 className="section-title">
          <span className="title-number">04</span>
          STÄRKEN VS. SCHWÄCHEN
        </h2>

        <div className="battle-grid">
          <div className="battle-column strengths">
            <div className="battle-header">
              <div className="battle-icon">+</div>
              <div className="battle-title">STÄRKEN</div>
            </div>
            <div className="battle-list">
              {supplier.strengths?.map((strength, idx) => (
                <div key={idx} className="battle-item" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="item-bullet">●</div>
                  <div className="item-text">{strength}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="battle-divider">
            <div className="divider-line"></div>
            <div className="divider-text">VS</div>
            <div className="divider-line"></div>
          </div>

          <div className="battle-column weaknesses">
            <div className="battle-header">
              <div className="battle-icon">−</div>
              <div className="battle-title">SCHWÄCHEN</div>
            </div>
            <div className="battle-list">
              {supplier.weaknesses?.map((weakness, idx) => (
                <div key={idx} className="battle-item" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="item-bullet">●</div>
                  <div className="item-text">{weakness}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CERTIFICATIONS */}
      <div className="smurfit-section certs-section" data-animate id="certs">
        <h2 className="section-title">
          <span className="title-number">05</span>
          ZERTIFIZIERUNGEN
        </h2>

        <div className="certs-grid">
          {supplier.certifications?.map((cert, idx) => (
            <div key={idx} className="cert-badge" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="cert-checkmark">✓</div>
              <div className="cert-name">{cert}</div>
            </div>
          ))}
        </div>

        <div className="awards-banner">
          <div className="award-item">
            <div className="award-number">{supplier.awards2024}</div>
            <div className="award-label">AWARDS 2024</div>
          </div>
          <div className="award-divider">●</div>
          <div className="award-item">
            <div className="award-number">{supplier.worldStarAwards}</div>
            <div className="award-label">WORLDSTAR AWARDS</div>
          </div>
        </div>
      </div>

      {/* DELIVERY TIMES */}
      <div className="smurfit-section delivery-section" data-animate id="delivery">
        <h2 className="section-title">
          <span className="title-number">06</span>
          LIEFERZEITEN AB MÜNCHEN
        </h2>

        <div className="delivery-timeline">
          <div className="delivery-item">
            <div className="delivery-icon">📍</div>
            <div className="delivery-location">BAYERN</div>
            <div className="delivery-time">{supplier.deliveryTimes?.bavaria}</div>
            <div className="delivery-bar" style={{ width: '30%' }}></div>
          </div>
          <div className="delivery-item">
            <div className="delivery-icon">🇩🇪</div>
            <div className="delivery-location">DEUTSCHLAND</div>
            <div className="delivery-time">{supplier.deliveryTimes?.germany}</div>
            <div className="delivery-bar" style={{ width: '50%' }}></div>
          </div>
          <div className="delivery-item">
            <div className="delivery-icon">🇪🇺</div>
            <div className="delivery-location">EUROPA</div>
            <div className="delivery-time">{supplier.deliveryTimes?.europe}</div>
            <div className="delivery-bar" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {/* FOOTER CTA */}
      <div className="smurfit-footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-title">KONTAKT AUFNEHMEN?</div>
            <div className="footer-subtitle">Starte den Tender-Prozess mit dem Weltmarktführer</div>
          </div>
          <div className="footer-right">
            <button className="footer-cta" onClick={() => navigateTo('rating', { supplier })}>
              BEWERTUNG ABGEBEN →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmurfitEnhancedProfile
