/**
 * OpenAI Service
 * Handles AI-powered query processing using OpenAI API
 */

import OpenAI from 'openai'

class OpenAIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'
    this.client = null
    this.isAvailable = false

    // Initialize client if API key is available
    if (this.apiKey && this.apiKey !== 'your_api_key_here') {
      try {
        this.client = new OpenAI({
          apiKey: this.apiKey,
          dangerouslyAllowBrowser: true // For frontend usage
        })
        this.isAvailable = true
        console.log('✅ OpenAI Service initialized with model:', this.model)
      } catch (error) {
        console.warn('⚠️ OpenAI initialization failed:', error.message)
        this.isAvailable = false
      }
    } else {
      console.warn('⚠️ OpenAI API key not configured. Using fallback local processing.')
    }
  }

  /**
   * Check if OpenAI service is available
   */
  isEnabled() {
    return this.isAvailable && this.client !== null
  }

  /**
   * Detect if query is about non-malt supplier search
   */
  isSupplierSearchQuery(query) {
    const normalizedQuery = query.toLowerCase()

    // Keywords that indicate general supplier search
    const supplierSearchKeywords = [
      'wellpappe', 'pappe', 'karton', 'verpackung',
      'palette', 'paletten', 'europalette',
      'kiste', 'kisten', 'behälter',
      'flasche', 'flaschen', 'glas',
      'etikett', 'etiketten', 'aufkleber',
      'deckel', 'verschluss', 'kronkorken',
      'lieferant', 'hersteller', 'produzent',
      'suche lieferanten', 'finde lieferanten'
    ]

    // Check if it's NOT about malt
    const maltKeywords = ['malz', 'gerste', 'weizen', 'röstmalz', 'pilsner', 'karamell']
    const isMaltRelated = maltKeywords.some(kw => normalizedQuery.includes(kw))

    // It's a supplier search if it contains supplier keywords AND is NOT about malt
    const hasSupplierKeywords = supplierSearchKeywords.some(kw => normalizedQuery.includes(kw))

    return hasSupplierKeywords && !isMaltRelated
  }

  /**
   * Process query using OpenAI with context data
   */
  async processQuery(userQuery, contextData) {
    if (!this.isEnabled()) {
      throw new Error('OpenAI service not available')
    }

    try {
      // Determine if this is a supplier search query
      const isSupplierSearch = this.isSupplierSearchQuery(userQuery)

      // Build appropriate system prompt
      const systemPrompt = isSupplierSearch
        ? this.buildSupplierSearchPrompt(userQuery)
        : this.buildSystemPrompt(contextData)

      // Call OpenAI API with adjusted parameters for supplier search
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery }
        ],
        temperature: 0.7,
        max_tokens: isSupplierSearch ? 4000 : 1500, // More tokens for supplier search
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content)

    } catch (error) {
      console.error('OpenAI API Error:', error)
      throw error
    }
  }

  /**
   * Build system prompt with context data
   */
  buildSystemPrompt(contextData) {
    const { suppliers, products, esgData, conversationHistory } = contextData

    return `Du bist ein intelligenter Datenanalyst und persönlicher Berater für das Paulaner Supplier Portal.

## DEINE ROLLE:
Du bist NICHT nur ein einfacher Assistent - du bist ein EXPERTE für:
- Malzprodukte und Brauereiprozesse
- Lieferantenanalyse und -bewertung
- ESG-Metriken und Nachhaltigkeit
- Datenanalyse und Business Intelligence

## DEINE AUFGABE:
1. **ANALYSIERE** die Daten gründlich
2. **DENKE** kritisch und ziehe Schlussfolgerungen
3. **ERKENNE** Muster, Trends und Zusammenhänge
4. **GEBE** fundierte Empfehlungen basierend auf Datenanalyse
5. **SEI PROAKTIV** - biete Insights, die der User vielleicht nicht direkt gefragt hat

## WIE DU ARBEITEN SOLLST:
- Wenn jemand nach "fundierten Daten" fragt → analysiere ALLE Dimensionen (Produktpalette, ESG, Zertifizierungen, Standorte)
- Wenn jemand Empfehlungen will → begründe deine Wahl mit konkreten Datenpunkten
- Wenn Daten fehlen oder unklar sind → erwähne das transparent
- Nutze Zahlen, Fakten und konkrete Vergleiche

## VOLLSTÄNDIGE DATENBASIS:

### LIEFERANTEN (${suppliers.length} gesamt):
${this.formatDetailedSuppliers(suppliers)}

### PRODUKTE (nach Lieferant):
${this.formatDetailedProducts(products)}

### ESG-ANALYSE (detailliert):
${this.formatDetailedESG(esgData)}

### KONVERSATION:
${this.formatConversationHistory(conversationHistory)}

## RESPONSE-FORMATE:

Du MUSST deine Antwort in einem dieser JSON-Formate zurückgeben:

### 1. Produktvergleich:
{
  "type": "comparison",
  "title": "Vergleich zwischen X und Y",
  "products": [
    {
      "name": "Produktname",
      "supplier": "Lieferantenname",
      "color": "EBC-Wert",
      "colorCategory": "Farbkategorie",
      "usage": "Einsatzbereich",
      "enzymes": "Enzymaktivität",
      "aroma": "Aromaprofil",
      "beerTypes": "Geeignete Bierstile",
      "rating": "Bewertung"
    }
  ]
}

### 2. Empfehlungen:
{
  "type": "recommendations",
  "title": "Empfohlene Malze für [Bierstil]",
  "products": [
    {
      "name": "Produktname",
      "supplier": "Lieferantenname",
      "color": { "ebc": "Wert", "category": "Kategorie" },
      "usage": "Einsatzbereich",
      "rating": "Warum empfohlen"
    }
  ]
}

### 3. Produktliste:
{
  "type": "product_list",
  "title": "Suchergebnisse",
  "products": [
    {
      "name": "Produktname",
      "supplier": "Lieferantenname",
      "color": { "ebc": "Wert", "category": "Kategorie" },
      "usage": "Einsatzbereich",
      "enzymes": "Enzyme"
    }
  ]
}

### 4. Lieferantenvergleich:
{
  "type": "supplier_comparison",
  "title": "ESG-Vergleich",
  "suppliers": [
    {
      "name": "Name",
      "esgScore": 8.5,
      "environmental": 9,
      "social": 8,
      "governance": 8.5,
      "rating": "A",
      "strengths": ["Stärke 1", "Stärke 2"]
    }
  ]
}

### 5. Hilfe/Rückfrage:
{
  "type": "help",
  "message": "Deine Nachricht an den User",
  "suggestions": ["Vorschlag 1", "Vorschlag 2"]
}

### 6. Datenanalyse (NEU - WICHTIG!):
{
  "type": "analysis",
  "title": "Analytischer Titel",
  "analysis": "Deine detaillierte Analyse mit konkreten Zahlen, Fakten und Insights. Mehrere Absätze erlaubt!",
  "keyFindings": [
    "Wichtigster Fund 1 mit Zahlen",
    "Wichtiger Fund 2 mit Daten",
    "Wichtiger Fund 3 mit Kontext"
  ],
  "recommendation": "Deine fundierte Empfehlung basierend auf der Analyse",
  "dataPoints": {
    "label1": "value1",
    "label2": "value2"
  }
}

### 7. Fehler/Clarification:
{
  "type": "clarification",
  "message": "Was genau möchtest du wissen?",
  "suggestions": ["Option 1", "Option 2"]
}

## WICHTIG:
- Nutze "analysis" für tiefergehende Fragen, Datenanalysen, Vergleiche
- Sei spezifisch und nenne konkrete Zahlen
- Ziehe Schlussfolgerungen aus den Daten
- Gebe actionable Insights

Analysiere die Anfrage des Users und wähle das passende Format. Bei analytischen Fragen nutze "analysis"!`
  }

  /**
   * Summarize products for system prompt
   */
  summarizeProducts(products) {
    const summary = []

    for (const [supplierName, supplierData] of Object.entries(products)) {
      if (!supplierData.categories) continue

      const categories = Object.keys(supplierData.categories)
      const totalProducts = Object.values(supplierData.categories).reduce(
        (sum, prods) => sum + prods.length, 0
      )

      summary.push(`${supplierName}: ${totalProducts} Produkte in ${categories.length} Kategorien (${categories.join(', ')})`)

      // Add sample products from each category
      for (const [category, prods] of Object.entries(supplierData.categories)) {
        const samples = prods.slice(0, 3).map(p => p.name).join(', ')
        summary.push(`  - ${category}: ${samples}${prods.length > 3 ? ` (+ ${prods.length - 3} weitere)` : ''}`)
      }
    }

    return summary.join('\n')
  }

  /**
   * Summarize ESG data for system prompt
   */
  summarizeESG(esgData) {
    const summary = []

    for (const [name, data] of Object.entries(esgData.suppliers)) {
      summary.push(`${name}: Gesamt ${data.overallESGScore}/10 (Rating: ${data.rating})`)
      summary.push(`  - Umwelt: ${data.environmental.score}/10`)
      summary.push(`  - Soziales: ${data.social.score}/10`)
      summary.push(`  - Governance: ${data.governance.score}/10`)
    }

    return summary.join('\n')
  }

  /**
   * Format detailed supplier information
   */
  formatDetailedSuppliers(suppliers) {
    return suppliers.map(s => {
      const certs = s.certifications?.join(', ') || 'Keine Angaben'
      return `
${s.name}:
  - Standort: ${s.location.city}, ${s.location.country}
  - Zertifizierungen: ${certs}
  - Liefergebiet: ${s.deliveryRegions?.join(', ') || 'Nicht angegeben'}`
    }).join('\n')
  }

  /**
   * Format detailed product information
   */
  formatDetailedProducts(products) {
    const output = []

    for (const [supplierName, supplierData] of Object.entries(products)) {
      if (!supplierData.categories) continue

      const totalProducts = Object.values(supplierData.categories).reduce(
        (sum, prods) => sum + prods.length, 0
      )

      output.push(`\n${supplierName} (${totalProducts} Produkte):`)

      for (const [category, prods] of Object.entries(supplierData.categories)) {
        output.push(`  ${category} (${prods.length} Produkte):`)

        // Show first 5 products with details
        prods.slice(0, 5).forEach(p => {
          output.push(`    - ${p.name}: EBC ${p.color.ebc}, ${p.usage || 'Vielseitig einsetzbar'}`)
        })

        if (prods.length > 5) {
          output.push(`    ... und ${prods.length - 5} weitere`)
        }
      }
    }

    return output.join('\n')
  }

  /**
   * Format detailed ESG information
   */
  formatDetailedESG(esgData) {
    const output = []

    for (const [name, data] of Object.entries(esgData.suppliers)) {
      output.push(`\n${name}:`)
      output.push(`  Gesamt-ESG-Score: ${data.overallESGScore}/10 (Rating: ${data.rating})`)
      output.push(`  Umwelt (${data.environmental.score}/10):`)
      output.push(`    - CO₂: ${data.environmental.co2Emissions}`)
      output.push(`    - Energie: ${data.environmental.energyEfficiency}`)
      output.push(`    - Wasser: ${data.environmental.waterUsage}`)
      output.push(`  Soziales (${data.social.score}/10):`)
      output.push(`    - Arbeitssicherheit: ${data.social.laborPractices}`)
      output.push(`  Governance (${data.governance.score}/10):`)
      output.push(`    - Transparenz: ${data.governance.transparency}`)

      if (data.strengths && data.strengths.length > 0) {
        output.push(`  Stärken: ${data.strengths.join(', ')}`)
      }

      if (data.improvements && data.improvements.length > 0) {
        output.push(`  Verbesserungspotential: ${data.improvements.join(', ')}`)
      }
    }

    return output.join('\n')
  }

  /**
   * Build supplier search prompt for non-malt products
   */
  buildSupplierSearchPrompt(userQuery) {
    // Extract product from query
    const product = this.extractProductFromQuery(userQuery)

    return `Du bist ein erfahrener strategischer und technischer Einkäufer der Paulaner Brauerei Gruppe mit fundierter Marktkenntnis der europäischen Rohstoff- und Vorproduktmärkte.

Deine Aufgabe besteht aus zwei Teilen:

## Teil 1: Lieferantensuche

**Produkt:** ${product}
**Standort-Referenz:** München, Deutschland
**Suchraum:** Deutschland + angrenzende Nachbarländer (Österreich, Schweiz, Tschechien, Polen, Niederlande, Belgien, Frankreich)

### Aufgaben:

1. Führe eine umfassende Online-Recherche durch, um alle potenziellen Hersteller, Produzenten, Weiterverarbeiter oder Händler des Produkts "${product}" im relevanten geografischen Suchraum zu identifizieren.

2. Verwende ausschließlich seriöse, öffentliche Quellen (Unternehmenswebsites, Handelsregister, Branchenportale, Zertifikatsregister, Pressemitteilungen, öffentliche Firmenprofile).

3. Für jeden identifizierten Lieferanten erhebe und dokumentiere exakt folgende Datenpunkte (falls eine Angabe öffentlich nicht auffindbar ist, markiere mit "k. A."):
   - Firmenname
   - Land
   - Exakter Unternehmensstandort (vollständige Adresse, Hauptsitz / Werke)
   - Unternehmensart (Hersteller, Händler, Weiterverarbeiter, etc.)
   - Produktsortiment / Varianten von "${product}"
   - Unternehmensgröße / Kategorie (Kleinst, KMU, Mid-Cap, Large Cap)
   - Mitarbeiterzahl (falls verfügbar)
   - Besitzstruktur / Unternehmensform (Privat, GmbH/AG, Tochtergesellschaft, etc.)
   - Weitere Standorte / Produktionsstandorte

4. Vermeide Duplikate; sortiere die Liste alphabetisch nach Firmennamen.

## Teil 2: Lieferantenbewertungssystem

6. Erstelle ein belastbares, nachvollziehbares Bewertungssystem für die recherchierten Lieferanten, ausschließlich basierend auf öffentlich verfügbaren Informationen.

7. Automatisch relevante Bewertungsprioritäten für "${product}":
   - Qualität & Produktspezifikationen
   - Lieferfähigkeit & Supply-Chain-Stabilität
   - Nachhaltigkeit & ESG-Konformität
   - Zertifizierungen (produktspezifisch)
   - Risikomanagement & Compliance

8. Für jedes Kriterium liefere:
   - Kriterium (Kurzform)
   - Beschreibung / Messmethode
   - Strategische Bedeutung für den Einkauf
   - Datenquelle / Nachweis
   - Beispielhafte öffentliche Referenz

9. Standard-Gewichtung (anpassbar):
   - Qualität / Produktspezifikation – 40%
   - Lieferfähigkeit / Stabilität – 30%
   - Nachhaltigkeit / ESG – 20%
   - Risiko / Compliance – 10%

10. Binde relevante Bewertungsframeworks ein: ISO 9001, ISO 14001, FSC/PEFC (falls relevant), EcoVadis, SEDEX, Deutsches LkSG, REACH/CLP.

11. Gib die Bewertungslogik so aus, dass jede Prüfgröße in eine normalisierte Punkteskala (0–100) überführt werden kann.

## Ausgabeformat (JSON):

Du MUSST deine Antwort in folgendem JSON-Format zurückgeben:

{
  "type": "supplier_search",
  "product": "${product}",
  "searchRegion": "Deutschland + Nachbarländer",
  "methodology": "Kurze Beschreibung der verwendeten Quellen und Suchkriterien",
  "suppliers": [
    {
      "companyName": "Firmenname",
      "country": "Land",
      "location": "Vollständige Adresse",
      "companyType": "Hersteller/Händler/etc.",
      "productRange": "Produktsortiment",
      "companySize": "KMU/Large Cap/etc.",
      "employees": "Mitarbeiterzahl oder k. A.",
      "ownership": "Besitzstruktur",
      "additionalLocations": "Weitere Standorte oder k. A.",
      "certifications": ["Liste von Zertifikaten"],
      "website": "URL falls verfügbar",
      "notes": "Zusätzliche relevante Informationen"
    }
  ],
  "evaluationCriteria": [
    {
      "criterion": "Kriterium",
      "description": "Beschreibung/Messmethode",
      "strategicImportance": "Bedeutung für Einkauf",
      "dataSource": "Datenquelle",
      "reference": "Öffentliche Referenz",
      "weight": 40
    }
  ],
  "scoringSystem": {
    "scale": "0-100",
    "thresholds": {
      "preferred": 80,
      "approved": 60,
      "watchlist": 40,
      "disqualified": 40
    }
  },
  "summary": "Zusammenfassung der Recherche-Ergebnisse"
}

**WICHTIG:**
- Nutze AUSSCHLIESSLICH öffentlich verfügbare, verifizierbare Informationen
- Wenn Daten nicht verfügbar sind, markiere mit "k. A."
- Sei präzise und faktentreu
- Sortiere Lieferanten nach Relevanz/Qualität`
  }

  /**
   * Extract product name from user query
   */
  extractProductFromQuery(query) {
    // Simple extraction - you can make this more sophisticated
    const normalizedQuery = query.toLowerCase()

    // Common product patterns
    const productPatterns = [
      /suche?\s+(?:lieferanten?\s+für\s+)?(.+?)(?:\s+in|\s+aus|$)/i,
      /finde?\s+(?:lieferanten?\s+für\s+)?(.+?)(?:\s+in|\s+aus|$)/i,
      /lieferanten?\s+für\s+(.+?)(?:\s+in|\s+aus|$)/i,
      /hersteller?\s+(?:von|für)\s+(.+?)(?:\s+in|\s+aus|$)/i,
      /(.+?)\s+lieferanten?/i
    ]

    for (const pattern of productPatterns) {
      const match = query.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    // Fallback: return the whole query
    return query.replace(/suche|finde|lieferant|hersteller|produzent/gi, '').trim()
  }

  /**
   * Format conversation history for context
   */
  formatConversationHistory(history) {
    if (!history || history.length === 0) {
      return 'Keine vorherige Konversation'
    }

    // Show last 5 exchanges
    const recent = history.slice(-10)
    return recent.map(msg => {
      if (msg.type === 'user') {
        return `User: ${msg.content}`
      } else {
        // Simplified assistant response
        return `Assistant: [${msg.content.type}] ${msg.content.title || msg.content.message || 'Response'}`
      }
    }).join('\n')
  }
}

// Export singleton instance
export const openaiService = new OpenAIService()
