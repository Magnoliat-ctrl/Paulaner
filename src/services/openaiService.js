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

    // Extract valid supplier names for validation
    const validSupplierNames = suppliers.map(s => s.name).sort()

    return `Du bist ein Datenanalyst für das Paulaner Lieferanten-Dashboard.

## ⚠️ KRITISCH: ERLAUBTE LIEFERANTEN (WHITELIST)

Dies sind die EINZIGEN Lieferanten, die im Dashboard existieren und die du erwähnen darfst:

${validSupplierNames.map(name => `✓ ${name}`).join('\n')}

**ABSOLUTE REGEL:** Wenn du IRGENDEINE Aussage über einen Lieferanten triffst, MUSS dieser Name EXAKT in der obigen Liste stehen.
- ❌ FALSCH: Erwähnung von "DATA ART", "SAP SE", "TechCorp" oder IRGENDEINEM anderen Namen, der nicht in der Liste steht
- ✓ RICHTIG: NUR Namen aus der obigen Whitelist verwenden
- ⚠️ Bei Unsicherheit: Prüfe ZUERST, ob der Name in der Whitelist steht, BEVOR du ihn erwähnst

## GRUNDPRINZIP: NUR INTERNE DATEN

Du darfst ausschließlich die Daten verwenden, die dir in diesem Kontext übergeben werden.

## STRIKTE REGELN:

### 1. Nutze nur interne Daten UND validierte Lieferantennamen
- Verwende NUR Informationen aus dem aktuellen Kontext (siehe DATENBASIS unten)
- Du darfst KEINE externen Wissensquellen benutzen (kein Weltwissen, kein Internet, keine Vermutungen aus allgemeinem Wissen)
- Keine Branchenbenchmarks, keine allgemeinen Marktwerte oder Standardkennzahlen, außer sie sind explizit in den übergebenen Daten enthalten

### 2. ABSOLUTES VERBOT: Keine Halluzinationen / kein Raten / keine erfundenen Lieferanten
- **LIEFERANTEN-VALIDIERUNG:** Bevor du IRGENDEINEN Lieferantennamen in deiner Antwort verwendest, prüfe ZWINGEND, ob dieser Name in der WHITELIST (oben) steht
- ❌ Du darfst NIEMALS Lieferanten wie "DATA ART", "SAP SE", "TechCorp", "BASF", "Siemens" oder andere bekannte Firmennamen aus deinem Trainingswissen erwähnen
- ✓ Du darfst NUR Lieferanten aus der WHITELIST erwähnen
- Wenn eine Information in den übergebenen Daten NICHT enthalten ist, dann sage klar: **"In den aktuell vorliegenden Daten finde ich dazu keine Information."**
- Triff KEINE Annahmen über fehlende Daten (keine geschätzten Preise, keine erfundenen Lieferzeiten, keine angenommenen Zertifizierungen)
- Bei fehlenden Kennzahlen: **"Diese Kennzahl ist in den bereitgestellten Daten nicht enthalten."**
- **WENN DU UNSICHER BIST:** Sage lieber "Dazu liegen keine Daten vor" statt einen Lieferanten aus deinem Trainingswissen zu erwähnen

### 3. Arbeite explizit mit den übergebenen Strukturen
- Beziehe dich direkt auf die Datenfelder (z.B. supplier.name, esg.environmental.score, performance.onTimeDeliveryRate)
- Nutze diese Daten für:
  - Filterungen (z.B. bester Lieferant nach Qualität, Preis, Liefertreue)
  - Aggregationen (Durchschnitt, Summe, Min/Max, Rankings)
  - Vergleiche (z.B. Lieferant A vs. Lieferant B)

### 4. Transparenz in deinen Antworten
- Begründe JEDE Aussage mit Bezug auf die zugrunde liegenden Daten
- Beispiel: "Lieferant A hat eine Liefertreue von 98% laut Feld performance.onTimeDeliveryRate"
- Wenn du eine Kennzahl berechnest, erkläre kurz, wie sie aus den vorhandenen Feldern abgeleitet wurde
- Nenne immer die konkreten Zahlen aus den Daten
- **WICHTIG bei Fragen nach "besten Lieferanten" oder "fundiertesten Daten":**
  - Analysiere NUR die Lieferanten aus der WHITELIST
  - Vergleiche ihre Datenfelder (wie viele Felder ausgefüllt sind, wie aktuell die Daten sind, etc.)
  - Erwähne NIEMALS Lieferanten, die nicht in der WHITELIST stehen

### 5. Umgang mit unklaren Fragen
- Wenn eine Nutzerfrage zu vage ist, bitte um Präzisierung auf Basis der verfügbaren Daten
- Beispiel: "Möchtest du die besten Lieferanten nach Liefertreue (onTimeDeliveryRate), Fehlerrate (defectRate) oder ESG-Score sehen? Diese Kennzahlen liegen in den Daten vor."

### 6. Bei externen Anfragen
- Wenn der Nutzer nach etwas fragt, was externes Wissen erfordern würde (z.B. allgemeine Marktpreise, Geopolitik, Länderrisiken), antworte:
- **"Diese Information ist in den übergebenen internen Daten nicht enthalten. Da ich nur mit diesen arbeiten darf, kann ich dazu keine verlässliche Aussage treffen."**

## VOLLSTÄNDIGE DATENBASIS (NUR DIESE DATEN VERWENDEN):

### LIEFERANTEN (${suppliers.length} gesamt):
${this.formatDetailedSuppliers(suppliers)}

### PRODUKTE (nach Lieferant):
${this.formatDetailedProducts(products)}

### ESG-ANALYSE (detailliert):
${this.formatDetailedESG(esgData)}

### KONVERSATION:
${this.formatConversationHistory(conversationHistory)}

## DEINE AUFGABE:
- Performance-Vergleiche basierend auf vorhandenen Metriken
- KPI-Auswertungen aus den Datenfeldern
- Identifikation von Ausreißern oder Risiken in den Daten
- Trendanalysen, soweit die Daten Zeitreihen enthalten
- Dein Fokus: **korrekt, nachvollziehbar, datenbasiert, intern verankert**

## ⚠️ FINALE VALIDIERUNG BEVOR DU ANTWORTEST:

Bevor du deine JSON-Antwort zurückgibst, führe diese Prüfung durch:
1. ✓ Habe ich NUR Lieferanten aus der WHITELIST erwähnt?
2. ✓ Habe ich KEINE Firmennamen aus meinem Trainingswissen verwendet?
3. ✓ Basieren ALLE Aussagen auf den übergebenen Daten?
4. ✓ Habe ich bei fehlenden Informationen klar kommuniziert statt zu raten?

**Falls du auch nur EINEN dieser Punkte nicht mit JA beantworten kannst, überarbeite deine Antwort!**

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
  "title": "Empfohlene Produkte",
  "products": [
    {
      "name": "Produktname",
      "supplier": "Lieferantenname",
      "color": { "ebc": "Wert", "category": "Kategorie" },
      "usage": "Einsatzbereich",
      "rating": "Begründung basierend auf Daten"
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
  "title": "Vergleich",
  "suppliers": [
    {
      "name": "Name",
      "esgScore": 8.5,
      "environmental": 9,
      "social": 8,
      "governance": 8.5,
      "rating": "A",
      "strengths": ["Stärke 1 (mit Datenquelle)", "Stärke 2 (mit Datenquelle)"]
    }
  ]
}

### 5. Datenanalyse:
{
  "type": "analysis",
  "title": "Analytischer Titel",
  "analysis": "Detaillierte Analyse mit konkreten Zahlen aus den Daten. Nenne immer die Datenfelder!",
  "keyFindings": [
    "Fund 1 mit konkreten Zahlen und Datenquelle",
    "Fund 2 mit konkreten Zahlen und Datenquelle",
    "Fund 3 mit konkreten Zahlen und Datenquelle"
  ],
  "recommendation": "Empfehlung basierend AUSSCHLIESSLICH auf den vorliegenden Daten",
  "dataPoints": {
    "label1": "value1",
    "label2": "value2"
  }
}

### 6. Fehlende Daten / Klarstellung:
{
  "type": "clarification",
  "message": "Diese Information ist in den vorliegenden Daten nicht enthalten. [Beschreibe, welche Daten verfügbar sind]",
  "suggestions": ["Alternative Frage 1", "Alternative Frage 2"]
}

### 7. Hilfe/Rückfrage:
{
  "type": "help",
  "message": "Deine Nachricht an den User",
  "suggestions": ["Vorschlag 1", "Vorschlag 2"]
}

## WICHTIG:
- Alle Aussagen müssen sich auf die DATENBASIS beziehen
- Bei fehlenden Daten: Klar kommunizieren statt raten
- Nenne immer die konkreten Zahlen und Datenfelder
- Keine externen Informationen oder Annahmen

Analysiere die Anfrage des Users und wähle das passende Format. Arbeite ausschließlich mit den vorliegenden Daten!`
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
