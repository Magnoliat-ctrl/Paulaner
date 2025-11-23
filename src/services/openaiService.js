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
   * Process query using OpenAI with context data
   */
  async processQuery(userQuery, contextData) {
    if (!this.isEnabled()) {
      throw new Error('OpenAI service not available')
    }

    try {
      // Build system prompt with data context
      const systemPrompt = this.buildSystemPrompt(contextData)

      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery }
        ],
        temperature: 0.7,
        max_tokens: 1500,
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
