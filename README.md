# Paulaner Supplier Portal

Ein internes Lieferantenmanagement-Portal für die Paulaner Brauerei Gruppe.

## Übersicht

Dieses Portal ermöglicht es Mitarbeitern der Paulaner Brauerei Gruppe:
- Lieferanten zu suchen und zu evaluieren
- Bewertungen mit gewichteten Kriterien abzugeben
- Analysen und Berichte zu erstellen
- Compliance-Status zu überwachen
- KI-gestützte Lieferantenauswahl zu nutzen

## Funktionen

### 1. Dashboard
- Übersicht über wichtige Kennzahlen
- Visualisierung von Trends und Bewertungshistorie
- Activity Feed mit neuesten Bewertungen und Warnungen

### 2. Lieferanten finden
- Erweiterte Suchfunktion mit Autocomplete
- Filteroptionen (Kategorie, Standort, Zertifizierungen, Bewertung)
- KI-Integration für intelligente Suchergebnisse (Platzhalter)

### 3. Lieferantenprofile
- Detaillierte Unternehmensinformationen
- Leistungskennzahlen und Qualitätsberichte
- ESG-Dokumentation
- Compliance-Indikatoren

### 4. Bewertungssystem
- Mehrdimensionale Bewertung (Qualität, Lieferleistung, Kosten, etc.)
- Anpassbare Gewichtung der Kriterien
- Live-Berechnung des Gesamtscores

### 5. Berichte & Analytik
- Interaktive Dashboards und Diagramme
- Vergleichsberichte für mehrere Lieferanten
- Export-Funktionen (CSV, PDF - Platzhalter)

### 6. Memory-Integration
- Speicherung von Benutzerpräferenzen
- Personalisierte Vorschläge basierend auf Nutzungsverhalten
- Automatisches Ausfüllen von Filtereinstellungen

### 7. Einstellungen
- Benutzerprofilverwaltung
- Rollen- und Rechteverwaltung
- Benachrichtigungseinstellungen

## Technologie-Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Visualisierung**: Chart.js
- **Datenspeicherung**: localStorage (client-seitig)
- **Styling**: Vanilla CSS mit Paulaner Corporate Identity

## Installation

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Produktions-Build erstellen
npm run build

# Build-Vorschau
npm run preview
```

## Projektstruktur

```
paulaner-supplier-portal/
├── public/
│   └── index.html
├── src/
│   ├── components/        # React-Komponenten
│   │   ├── layout/       # Layout-Komponenten (Header, Footer, Navigation)
│   │   ├── dashboard/    # Dashboard-Komponenten
│   │   ├── suppliers/    # Lieferanten-bezogene Komponenten
│   │   ├── rating/       # Bewertungs-Komponenten
│   │   ├── reports/      # Berichts-Komponenten
│   │   └── common/       # Wiederverwendbare Komponenten
│   ├── pages/            # Seiten-Komponenten
│   ├── services/         # Business-Logik und API-Platzhalter
│   │   ├── aiService.js      # KI-Integration (Platzhalter)
│   │   ├── memoryService.js  # Memory-Management
│   │   ├── dataService.js    # Daten-Management
│   │   └── authService.js    # Authentifizierung (Platzhalter)
│   ├── styles/           # CSS-Dateien
│   ├── data/             # Mock-Daten und Datenstrukturen
│   ├── utils/            # Hilfsfunktionen
│   ├── App.jsx           # Haupt-App-Komponente
│   └── main.jsx          # Einstiegspunkt
├── package.json
├── vite.config.js
└── README.md
```

## API-Integration (Platzhalter)

Das Portal enthält mehrere Platzhalter für zukünftige Backend-Integrationen:

### 1. KI-Service (aiService.js)
```javascript
// Funktion: analyseQuery(query, memory)
// Zweck: Suchanfragen intelligent analysieren
// Integration: Claude API oder alternatives LLM
```

### 2. Datenbank-API
```javascript
// Zweck: CRUD-Operationen für Lieferantendaten
// Empfohlen: REST API mit MongoDB/PostgreSQL
```

### 3. Authentifizierung
```javascript
// Zweck: Benutzer-Login und Rollenverwaltung
// Empfohlen: OAuth 2.0 / JWT-basiert
```

### 4. Memory-Service
```javascript
// Aktuell: localStorage (client-seitig)
// Zukünftig: Server-seitiges Memory-Management mit Vector-Search
```

## Compliance & Datenschutz

Das Portal berücksichtigt:
- DSGVO-Anforderungen
- Paulaner Code of Conduct
- Menschenrechts- und Umweltstandards
- Sichere Datenverarbeitung

**Wichtig**: Alle sensiblen Daten müssen vor Produktivbetrieb durch sichere Backend-Systeme geschützt werden.

## Barrierefreiheit

- ARIA-Labels für Screen-Reader
- Tastaturnavigation
- Ausreichende Farbkontraste (WCAG 2.1 Level AA)
- Responsive Design (Mobile-First)

## Weiterentwicklung

### Nächste Schritte für Produktivbetrieb:

1. **Backend-Integration**
   - REST API für Lieferantendaten
   - Authentifizierungs-Service
   - Datenbank-Setup (MongoDB/PostgreSQL)

2. **KI-Integration**
   - Claude API oder alternatives LLM anbinden
   - Prompt-Engineering für Lieferantenanalyse
   - Vector-Datenbank für semantische Suche

3. **Security**
   - HTTPS erzwingen
   - Input-Validierung
   - XSS- und CSRF-Schutz
   - Rate-Limiting

4. **Testing**
   - Unit-Tests (Jest, React Testing Library)
   - Integration-Tests
   - E2E-Tests (Playwright, Cypress)

5. **Monitoring & Logging**
   - Error-Tracking (Sentry)
   - Analytics (Matomo für DSGVO-Konformität)
   - Performance-Monitoring

## Lizenz

Proprietary - Alle Rechte vorbehalten, Paulaner Brauerei Gruppe

## Support

Bei Fragen oder Problemen wenden Sie sich bitte an das IT-Team der Paulaner Brauerei Gruppe.
