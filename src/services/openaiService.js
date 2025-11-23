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

    return `Du bist ein KI-Assistent für das Paulaner Supplier Portal. Du hilfst Brauereien bei der Auswahl von Malzprodukten und Lieferanten.

## WICHTIGE REGELN:
1. Antworte IMMER auf Deutsch
2. Sei präzise und professionell
3. Nutze die bereitgestellten Daten für deine Antworten
4. Antworte im JSON-Format mit der passenden Response-Struktur
5. Wenn du unsicher bist, frage nach

## VERFÜGBARE DATEN:

### LIEFERANTEN:
${suppliers.map(s => `- ${s.name} (Standort: ${s.location.city}, ${s.location.country})`).join('\n')}

### PRODUKTE:
${this.summarizeProducts(products)}

### ESG-BEWERTUNGEN:
${this.summarizeESG(esgData)}

### KONVERSATIONSHISTORIE:
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

### 6. Fehler/Clarification:
{
  "type": "clarification",
  "message": "Was genau möchtest du wissen?",
  "suggestions": ["Option 1", "Option 2"]
}

Analysiere die Anfrage des Users und wähle das passende Format. Nutze die verfügbaren Daten, um akkurate Antworten zu geben.`
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
