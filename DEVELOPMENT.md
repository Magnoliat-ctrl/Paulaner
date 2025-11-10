# Paulaner Supplier Portal - Entwicklerdokumentation

## Übersicht

Dies ist ein internes Lieferantenmanagement-Portal für die Paulaner Brauerei Gruppe, entwickelt mit React, Vite und Chart.js.

## Projektstruktur

```
paulaner-supplier-portal/
├── public/
│   └── index.html                    # HTML-Einstiegspunkt
├── src/
│   ├── components/                   # React-Komponenten
│   │   ├── dashboard/               # Dashboard-spezifische Komponenten
│   │   │   ├── ActivityFeed.jsx
│   │   │   ├── ChartsSection.jsx
│   │   │   └── MetricsCards.jsx
│   │   ├── layout/                  # Layout-Komponenten
│   │   │   ├── Footer.jsx
│   │   │   └── Header.jsx
│   │   └── suppliers/               # Lieferanten-bezogene Komponenten
│   │       ├── FilterPanel.jsx
│   │       ├── SearchBar.jsx
│   │       ├── SupplierCard.jsx
│   │       └── SupplierGrid.jsx
│   ├── data/                        # Datenstrukturen und Mock-Daten
│   │   └── supplierData.js
│   ├── pages/                       # Seiten-Komponenten
│   │   ├── Dashboard.jsx
│   │   ├── Rating.jsx
│   │   ├── Reports.jsx
│   │   ├── Settings.jsx
│   │   ├── SupplierDiscovery.jsx
│   │   └── SupplierProfile.jsx
│   ├── services/                    # Business-Logik und Services
│   │   ├── aiService.js            # KI-Integration (Platzhalter)
│   │   ├── dataService.js          # Daten-Management
│   │   └── memoryService.js        # Memory/Präferenzen-Management
│   ├── styles/                      # CSS-Dateien
│   │   ├── index.css               # Globale Styles
│   │   ├── App.css                 # App-Komponenten-Styles
│   │   ├── Header.css
│   │   ├── Footer.css
│   │   ├── Dashboard.css
│   │   ├── MetricsCards.css
│   │   ├── ChartsSection.css
│   │   ├── ActivityFeed.css
│   │   ├── SupplierDiscovery.css
│   │   ├── SearchBar.css
│   │   ├── FilterPanel.css
│   │   ├── SupplierGrid.css
│   │   ├── SupplierCard.css
│   │   ├── SupplierProfile.css
│   │   ├── Rating.css
│   │   ├── Reports.css
│   │   └── Settings.css
│   ├── App.jsx                      # Haupt-App-Komponente
│   └── main.jsx                     # React-Einstiegspunkt
├── .gitignore
├── package.json
├── vite.config.js
├── README.md
└── DEVELOPMENT.md                    # Diese Datei
```

## Installation und Setup

### Voraussetzungen

- Node.js (Version 16 oder höher)
- npm oder yarn

### Installation

```bash
# Repository klonen
git clone <repository-url>
cd paulaner-supplier-portal

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Produktions-Build erstellen
npm run build

# Build-Vorschau
npm run preview
```

## Technologie-Stack

- **React 18**: UI-Framework
- **Vite**: Build-Tool und Dev-Server
- **Chart.js**: Datenvisualisierung
- **React-Chartjs-2**: React-Wrapper für Chart.js
- **localStorage**: Client-seitige Datenspeicherung

## Hauptfunktionen

### 1. Dashboard

**Komponenten:**
- `Dashboard.jsx`: Haupt-Dashboard-Seite
- `MetricsCards.jsx`: KPI-Karten (Lieferanten, Bewertungen, etc.)
- `ChartsSection.jsx`: Diagramme (Trends, Kategorien, Top-Performer)
- `ActivityFeed.jsx`: Neueste Aktivitäten und Warnungen

**Features:**
- Echtzeit-Metriken
- Interaktive Diagramme
- Activity-Feed mit Benachrichtigungen
- Responsive Design

### 2. Lieferantensuche (Supplier Discovery)

**Komponenten:**
- `SupplierDiscovery.jsx`: Such- und Filter-Seite
- `SearchBar.jsx`: Suchleiste mit Debouncing
- `FilterPanel.jsx`: Erweiterte Filteroptionen
- `SupplierGrid.jsx`: Raster-Layout für Lieferanten
- `SupplierCard.jsx`: Einzelne Lieferantenkarte

**Features:**
- Echtzeitsuche mit Debouncing
- Mehrere Filterkriterien (Kategorie, Standort, Bewertung, Zertifizierungen)
- KI-basierte Suchvorschläge (Platzhalter)
- Persistente Filterpräferenzen

**AI Integration Point:**
```javascript
// src/pages/SupplierDiscovery.jsx
const suggestions = await aiService.analyzeQuery(searchQuery, userMemory)
```

### 3. Lieferantenprofil

**Komponenten:**
- `SupplierProfile.jsx`: Detaillierte Lieferantenansicht

**Features:**
- Vollständige Unternehmensinformationen
- Leistungskennzahlen (KPIs)
- ESG-Daten (Environmental, Social, Governance)
- Compliance-Status und Verstöße
- Zertifizierungen
- Bewertungsverlauf
- Dokumenten-Download

### 4. Bewertungssystem

**Komponenten:**
- `Rating.jsx`: Bewertungsformular

**Features:**
- 7 Bewertungskategorien:
  - Qualität
  - Lieferleistung
  - Kosten
  - Zuverlässigkeit
  - Innovation
  - Kommunikation
  - ESG-Compliance
- Individuelle Gewichtung (0-50% pro Kategorie)
- Live-Berechnung des Gesamtscores
- Kommentarfeld
- Gewichtungsnormalisierung
- Speicherung der Präferenzen

**Bewertungsalgorithmus:**
```javascript
Gesamtscore = Σ(Bewertung_i × Gewichtung_i) / Σ(Gewichtung_i)
```

### 5. Berichte & Analytik

**Komponenten:**
- `Reports.jsx`: Berichts- und Vergleichsseite

**Features:**
- Top-Performer-Liste
- Kategorie-Statistiken
- Lieferantenvergleich (2-5 Lieferanten gleichzeitig)
- Export-Funktionen (CSV, PDF - Platzhalter)

### 6. Einstellungen

**Komponenten:**
- `Settings.jsx`: Benutzereinstellungen

**Features:**
- Rollenverwaltung (Sachbearbeiter, Teamleiter, Administrator)
- Spracheinstellungen
- Theme-Auswahl
- Benachrichtigungseinstellungen
- Datenexport/Import
- Memory-Reset

## Services-Dokumentation

### Data Service (`dataService.js`)

Verwaltet alle Daten-bezogenen Operationen.

**Wichtige Methoden:**

```javascript
// Alle Lieferanten abrufen
await dataService.getSuppliers()

// Lieferant nach ID
await dataService.getSupplier(supplierId)

// Suche mit Filtern
await dataService.searchSuppliers({
  query: 'hopfen',
  category: 'Rohstoffe - Hopfen',
  minRating: 8,
  complianceStatus: 'compliant'
})

// Bewertung hinzufügen
await dataService.addRating(supplierId, {
  overallScore: 9.2,
  categories: { quality: 9, delivery: 9, ... },
  weights: { quality: 20, delivery: 15, ... },
  comment: 'Ausgezeichnet'
})

// Dashboard-Metriken
await dataService.getDashboardMetrics()

// Analytik-Daten
await dataService.getAnalytics()
```

**API-Integration (Zukunft):**

```javascript
// In Produktion ersetzen durch:
const API_BASE = 'https://api.paulaner.com/v1'

// GET /api/suppliers
// GET /api/suppliers/:id
// POST /api/suppliers/:id/ratings
// GET /api/analytics
// GET /api/dashboard/metrics
```

### Memory Service (`memoryService.js`)

Verwaltet Benutzerpräferenzen und Verlauf.

**Wichtige Methoden:**

```javascript
// User Memory laden
const memory = memoryService.loadUserMemory()

// Suchanfrage speichern
memoryService.addSearchQuery(query, results)

// Besuchten Lieferanten speichern
memoryService.addVisitedSupplier(supplierId)

// Filterpräferenzen aktualisieren
memoryService.updateFilterPreferences(filters)

// Bewertungsgewichte speichern
memoryService.updateRatingWeights(weights)

// Benachrichtigungseinstellungen
memoryService.updateNotificationSettings(settings)

// Präferenzen aktualisieren
memoryService.updatePreferences(preferences)

// Memory exportieren/importieren
const json = memoryService.exportMemory()
memoryService.importMemory(jsonString)

// Alles zurücksetzen
memoryService.clearMemory()
```

**Datenstruktur:**

```javascript
{
  userId: 'guest',
  lastPage: 'dashboard',
  searchHistory: [
    {
      query: 'bio hopfen',
      timestamp: '2024-11-10T10:00:00Z',
      resultCount: 3,
      topResults: ['SUP-001', 'SUP-002']
    }
  ],
  visitedSuppliers: [
    { id: 'SUP-001', timestamp: '2024-11-10T10:05:00Z' }
  ],
  filterPreferences: {
    category: '',
    location: '',
    minRating: 0,
    certifications: [],
    complianceStatus: 'all'
  },
  ratingWeights: {
    quality: 20,
    delivery: 15,
    cost: 15,
    reliability: 20,
    innovation: 10,
    communication: 10,
    esg: 10
  },
  notifications: {
    enabled: true,
    emailAlerts: true,
    complianceAlerts: true,
    ratingReminders: true
  },
  preferences: {
    language: 'de',
    theme: 'light',
    dashboardLayout: 'default'
  }
}
```

**Migration zu Server-seitigem Memory:**

```javascript
// Zukünftige Implementierung:
// POST /api/users/:userId/memory
// GET /api/users/:userId/memory
// PUT /api/users/:userId/memory
// DELETE /api/users/:userId/memory

// Vector-Datenbank für semantische Suche:
// - Pinecone
// - Weaviate
// - Qdrant
```

### AI Service (`aiService.js`)

KI-gestützte Features (aktuell Platzhalter mit Fallback-Logik).

**Wichtige Methoden:**

```javascript
// Suchanfrage analysieren
const analysis = await aiService.analyzeQuery(query, memory)
// Returns: { enhancedQuery, suggestedFilters, reasoning }

// Empfehlungen erhalten
const recommendations = await aiService.getRecommendations(context)

// Lieferanten analysieren
const insights = await aiService.analyzeSupplier(supplier)
// Returns: { insights, strengths, weaknesses, recommendations }

// Lieferanten vergleichen
const comparison = await aiService.compareSuppliers([supplier1, supplier2])
```

**Claude API Integration:**

```javascript
// In aiService.js:

// 1. Konfiguration
aiService.initialize({
  apiKey: process.env.REACT_APP_CLAUDE_API_KEY,
  apiEndpoint: 'https://api.anthropic.com/v1/messages',
  model: 'claude-3-sonnet-20240229'
})

// 2. API-Call-Beispiel
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Analysiere diese Lieferanten-Suchanfrage: "${query}"`
    }]
  })
})

// 3. Prompt-Beispiel für Lieferantenanalyse
const prompt = `
Du bist ein KI-Assistent für das Lieferantenmanagement der Paulaner Brauerei Gruppe.
Analysiere diesen Lieferanten und gib Empfehlungen:

Lieferant: ${supplier.name}
Kategorie: ${supplier.category}
Bewertung: ${avgRating}/10
Compliance-Status: ${supplier.compliance.status}
Leistungskennzahlen:
- Liefertreue: ${supplier.performance.onTimeDeliveryRate}%
- Fehlerrate: ${supplier.performance.defectRate}%
- Innovation: ${supplier.performance.innovationScore}/10

Bitte analysiere:
1. Stärken des Lieferanten
2. Schwächen und Risiken
3. Konkrete Empfehlungen zur Zusammenarbeit
4. Compliance-relevante Aspekte

Antwort in JSON-Format:
{
  "strengths": [...],
  "weaknesses": [...],
  "recommendations": [...],
  "complianceNotes": "..."
}
`
```

**Alternative LLM-Provider:**

- **OpenAI GPT-4**: `https://api.openai.com/v1/chat/completions`
- **Azure OpenAI**: Über Azure Portal konfigurieren
- **Self-hosted**: Ollama, LM Studio

## Datenstrukturen

### Supplier Object

```javascript
{
  id: 'SUP-001',
  name: 'Hopfen Schmidt GmbH',
  description: 'Führender Lieferant für Premium-Hopfen',
  category: 'Rohstoffe - Hopfen',
  contact: {
    email: 'info@example.de',
    phone: '+49 xxx',
    website: 'www.example.de',
    person: 'Johann Schmidt',
    position: 'Geschäftsführer'
  },
  location: {
    street: 'Hopfenweg 12',
    city: 'Wolnzach',
    postalCode: '85283',
    country: 'Deutschland',
    region: 'Bayern'
  },
  certifications: ['Bio-Zertifizierung', 'ISO 9001'],
  performance: {
    averageDeliveryTime: 2.5,
    onTimeDeliveryRate: 98.5,
    defectRate: 0.5,
    responseTime: 4,
    flexibilityScore: 9.2,
    innovationScore: 8.5
  },
  compliance: {
    status: 'compliant', // 'compliant', 'minor-violation', 'under-review', 'major-violation'
    lastAudit: '2024-09-15',
    violations: [],
    humanRights: true,
    environmentalStandards: true,
    laborStandards: true
  },
  ratings: [
    {
      date: '2024-10-15',
      overallScore: 9.2,
      categories: {
        quality: 9.5,
        delivery: 9.0,
        cost: 8.5,
        reliability: 9.5,
        innovation: 8.8,
        communication: 9.2,
        esg: 9.3
      },
      comment: 'Ausgezeichnete Qualität'
    }
  ],
  products: ['Aromahopfen', 'Bitterhopfen'],
  esg: {
    environmental: {
      carbonFootprint: 'Niedrig',
      waterUsage: 'Effizient',
      wasteManagement: 'Vorbildlich',
      renewableEnergy: 85
    },
    social: {
      fairWages: true,
      workingConditions: 'Gut',
      employeeTraining: true,
      diversityScore: 8.5
    },
    governance: {
      transparency: 'Hoch',
      ethicalBusiness: true,
      antiCorruption: true,
      dataProtection: true
    }
  },
  documents: [
    {
      name: 'Qualitätszertifikat 2024',
      type: 'certificate',
      url: '/documents/cert.pdf',
      date: '2024-01-15'
    }
  ]
}
```

## Styling & Theming

### CSS-Variablen

Alle Farben und Abstände sind als CSS-Variablen in `src/styles/index.css` definiert:

```css
:root {
  /* Paulaner Farben */
  --color-primary: #003366;      /* Deep Blue */
  --color-secondary: #D4AF37;    /* Gold */
  --color-accent: #C8A961;       /* Light Gold */

  /* Semantic Colors */
  --color-success: #28A745;
  --color-warning: #FFC107;
  --color-danger: #DC3545;
  --color-info: #17A2B8;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;

  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;
}
```

### Responsive Design

Mobile-First-Ansatz mit Breakpoints:

```css
/* Tablets */
@media (max-width: 1024px) { }

/* Mobile */
@media (max-width: 768px) { }

/* Small Mobile */
@media (max-width: 480px) { }
```

## Barrierefreiheit (Accessibility)

- **ARIA-Labels**: Alle interaktiven Elemente haben ARIA-Labels
- **Keyboard-Navigation**: Vollständige Tastaturunterstützung
- **Focus-Indikatoren**: Klare Fokus-Styles
- **Semantisches HTML**: Verwendung von `<header>`, `<nav>`, `<main>`, `<article>`, etc.
- **Farbkontraste**: WCAG 2.1 Level AA konform

## Security & Compliance

### Datenschutz (DSGVO)

- Alle sensiblen Daten müssen verschlüsselt werden
- Benutzer müssen Einwilligung für Datenverarbeitung geben
- Recht auf Vergessenwerden implementieren
- Datenminimierung beachten

### Code of Conduct

- Menschenrechtsstandards einhalten
- Umweltstandards beachten
- Transparenz in Lieferketten
- Anti-Korruptions-Richtlinien

### Security Best Practices

```javascript
// 1. Input-Validierung
const validateInput = (input) => {
  // XSS-Prevention
  return input.replace(/[<>]/g, '')
}

// 2. API-Authentifizierung
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}

// 3. HTTPS erzwingen
// In vite.config.js:
server: {
  https: true // Nur in Produktion
}

// 4. Rate-Limiting implementieren
// Auf Backend-Seite erforderlich
```

## Testing-Strategie

### Unit Tests (TODO)

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

```javascript
// Beispiel: MetricsCards.test.jsx
import { render, screen } from '@testing-library/react'
import MetricsCards from './MetricsCards'

test('renders metrics correctly', () => {
  const metrics = {
    totalSuppliers: 5,
    averageRating: 8.8,
    pendingRatings: 2,
    complianceViolations: 0
  }

  render(<MetricsCards metrics={metrics} navigateTo={jest.fn()} />)

  expect(screen.getByText('5')).toBeInTheDocument()
  expect(screen.getByText('8.8')).toBeInTheDocument()
})
```

### Integration Tests (TODO)

- Testen von Benutzerflows (Suche → Profil → Bewertung)
- API-Mock-Implementierung
- Persistenz-Tests

### E2E Tests (TODO)

```bash
npm install --save-dev playwright
```

```javascript
// Beispiel: supplier-search.spec.js
import { test, expect } from '@playwright/test'

test('search for supplier', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.click('text=Lieferanten finden')
  await page.fill('input[type="search"]', 'hopfen')
  await expect(page.locator('.supplier-card')).toHaveCount(1)
})
```

## Deployment

### Produktions-Build

```bash
npm run build
```

Erstellt optimierte Dateien in `dist/`:

```
dist/
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── index.html
```

### Deployment-Optionen

1. **Static Hosting:**
   - Vercel
   - Netlify
   - GitHub Pages
   - AWS S3 + CloudFront

2. **Docker:**

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

3. **Kubernetes:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: paulaner-portal
spec:
  replicas: 3
  selector:
    matchLabels:
      app: paulaner-portal
  template:
    metadata:
      labels:
        app: paulaner-portal
    spec:
      containers:
      - name: paulaner-portal
        image: paulaner-portal:latest
        ports:
        - containerPort: 80
```

## Umgebungsvariablen

Erstellen Sie eine `.env` Datei:

```env
# API-Konfiguration
REACT_APP_API_BASE_URL=https://api.paulaner.com/v1
REACT_APP_API_TIMEOUT=30000

# Claude AI
REACT_APP_CLAUDE_API_KEY=your_api_key_here
REACT_APP_CLAUDE_MODEL=claude-3-sonnet-20240229

# Feature-Flags
REACT_APP_ENABLE_AI_FEATURES=false
REACT_APP_ENABLE_EXPORTS=false

# Analytics
REACT_APP_MATOMO_URL=https://analytics.paulaner.com
REACT_APP_MATOMO_SITE_ID=1
```

## Nächste Schritte für Produktivbetrieb

### Phase 1: Backend-Integration (Woche 1-2)

- [ ] REST API entwickeln (Node.js/Express oder Python/FastAPI)
- [ ] Datenbank-Schema definieren (MongoDB oder PostgreSQL)
- [ ] Authentifizierung implementieren (OAuth 2.0/JWT)
- [ ] API-Endpunkte testen

### Phase 2: AI-Integration (Woche 3-4)

- [ ] Claude API-Key beschaffen
- [ ] Prompt-Engineering durchführen
- [ ] AI-Service vollständig implementieren
- [ ] Vector-Datenbank für semantische Suche (Pinecone/Weaviate)

### Phase 3: Security & Compliance (Woche 5)

- [ ] HTTPS erzwingen
- [ ] Input-Validierung implementieren
- [ ] DSGVO-Anforderungen erfüllen
- [ ] Security-Audit durchführen

### Phase 4: Testing & QA (Woche 6)

- [ ] Unit-Tests schreiben (80%+ Coverage)
- [ ] Integration-Tests implementieren
- [ ] E2E-Tests mit Playwright
- [ ] Performance-Tests

### Phase 5: Deployment & Monitoring (Woche 7-8)

- [ ] CI/CD-Pipeline einrichten
- [ ] Produktiv-Umgebung vorbereiten
- [ ] Monitoring implementieren (Sentry, Datadog)
- [ ] Dokumentation finalisieren
- [ ] Mitarbeiter schulen

## Support & Kontakt

Bei Fragen oder Problemen wenden Sie sich bitte an:

- **IT-Team**: it@paulaner.de
- **Projektleitung**: projekt-lieferantenportal@paulaner.de

## Lizenz

Proprietary - Alle Rechte vorbehalten, Paulaner Brauerei Gruppe

---

**Entwickelt mit ❤️ für die Paulaner Brauerei Gruppe**
