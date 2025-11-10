/**
 * OpenAI Service
 * Real AI integration for intelligent supplier discovery and analysis
 */

class OpenAIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions'
    this.model = 'gpt-4o-mini' // Cost-effective model
    this.isEnabled = !!this.apiKey

    if (!this.isEnabled) {
      console.warn('OpenAI Service: No API key found. AI features disabled.')
    }
  }

  /**
   * Make API call to OpenAI
   */
  async callOpenAI(messages, options = {}) {
    if (!this.isEnabled) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000,
          ...options
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error('OpenAI API call failed:', error)
      throw error
    }
  }

  /**
   * Find suppliers based on search query
   * AI generates relevant suppliers dynamically
   */
  async findSuppliers(query, filters = {}) {
    const prompt = `Du bist ein Experte für die Brauereiindustrie und das Lieferantenmanagement der Paulaner Brauerei Gruppe.

Basierend auf folgender Suchanfrage, generiere 3-5 realistische deutsche Lieferanten:

Suchanfrage: "${query}"

Filter:
${filters.category ? `- Kategorie: ${filters.category}` : ''}
${filters.location ? `- Standort: ${filters.location}` : ''}
${filters.certifications?.length ? `- Zertifizierungen: ${filters.certifications.join(', ')}` : ''}

Erstelle für jeden Lieferanten ein vollständiges Profil mit:
1. Firmenname (realistische deutsche Namen)
2. Beschreibung (2-3 Sätze)
3. Kategorie (z.B. "Rohstoffe - Hopfen", "Verpackung", "Logistik", "IT & Technologie")
4. Standort (Stadt, PLZ, Region in Deutschland)
5. Kontaktdaten (realistische aber fiktive Daten)
6. Produkte/Dienstleistungen (3-5 Stück)
7. Zertifizierungen (3-5 relevante)
8. Leistungskennzahlen (Liefertreue 85-99%, Fehlerrate 0.1-3%, etc.)
9. ESG-Daten (Umwelt, Soziales, Governance)
10. Compliance-Status ("compliant", "minor-violation", "under-review")

WICHTIG: Antworte NUR mit einem validen JSON-Array, kein zusätzlicher Text!

Format:
[
  {
    "name": "Firmenname GmbH",
    "description": "Beschreibung...",
    "category": "Kategorie",
    "contact": {
      "email": "info@example.de",
      "phone": "+49 xxx",
      "website": "www.example.de",
      "person": "Name",
      "position": "Position"
    },
    "location": {
      "street": "Straße 123",
      "city": "Stadt",
      "postalCode": "12345",
      "country": "Deutschland",
      "region": "Bayern"
    },
    "products": ["Produkt 1", "Produkt 2"],
    "certifications": ["ISO 9001", "Bio"],
    "performance": {
      "averageDeliveryTime": 2.5,
      "onTimeDeliveryRate": 95.5,
      "defectRate": 0.8,
      "responseTime": 6,
      "flexibilityScore": 8.5,
      "innovationScore": 8.0
    },
    "compliance": {
      "status": "compliant",
      "humanRights": true,
      "environmentalStandards": true,
      "laborStandards": true
    },
    "esg": {
      "environmental": {
        "carbonFootprint": "Niedrig",
        "renewableEnergy": 75
      },
      "social": {
        "fairWages": true,
        "diversityScore": 8.0
      },
      "governance": {
        "transparency": "Hoch",
        "ethicalBusiness": true
      }
    }
  }
]`

    try {
      const response = await this.callOpenAI([
        {
          role: 'system',
          content: 'Du bist ein Experte für Lieferantenmanagement in der Brauereiindustrie. Antworte immer mit validem JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.8,
        max_tokens: 3000
      })

      // Parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in response')
      }

      const suppliers = JSON.parse(jsonMatch[0])

      // Add IDs and additional fields
      return suppliers.map((supplier, index) => ({
        id: `AI-${Date.now()}-${index}`,
        ...supplier,
        ratings: [],
        documents: [],
        addedDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString(),
        isAIGenerated: true
      }))
    } catch (error) {
      console.error('Error finding suppliers with AI:', error)
      throw error
    }
  }

  /**
   * Analyze search query and suggest filters
   */
  async analyzeQuery(query, userMemory = {}) {
    const prompt = `Analysiere diese Lieferanten-Suchanfrage und schlage passende Filter vor.

Suchanfrage: "${query}"

Benutzerkontext:
- Letzte Suchen: ${JSON.stringify(userMemory.searchHistory?.slice(0, 3).map(s => s.query) || [])}
- Zuletzt besuchte Kategorien: ${userMemory.filterPreferences?.category || 'keine'}

Antworte mit einem JSON-Objekt:
{
  "enhancedQuery": "Verbesserte Suchanfrage",
  "suggestedFilters": {
    "category": "Passende Kategorie oder leer",
    "location": "Passender Standort oder leer",
    "certifications": ["Relevante Zertifikate"],
    "minRating": 0-10,
    "complianceStatus": "all|compliant"
  },
  "reasoning": "Kurze Erklärung der Vorschläge"
}`

    try {
      const response = await this.callOpenAI([
        {
          role: 'system',
          content: 'Du bist ein Assistent für intelligente Lieferantensuche. Antworte mit validem JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.5,
        max_tokens: 500
      })

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response')
      }

      const analysis = JSON.parse(jsonMatch[0])
      return {
        ...analysis,
        isAIGenerated: true
      }
    } catch (error) {
      console.error('Error analyzing query:', error)
      // Fallback to basic analysis
      return {
        enhancedQuery: query,
        suggestedFilters: {
          category: '',
          location: '',
          certifications: [],
          minRating: 0,
          complianceStatus: 'all'
        },
        reasoning: 'AI-Analyse fehlgeschlagen, nutze Standard-Suche',
        isAIGenerated: false
      }
    }
  }

  /**
   * Analyze supplier and provide insights
   */
  async analyzeSupplier(supplier) {
    const prompt = `Analysiere diesen Lieferanten und gib Empfehlungen:

Lieferant: ${supplier.name}
Kategorie: ${supplier.category}
Beschreibung: ${supplier.description}
Leistung: Liefertreue ${supplier.performance.onTimeDeliveryRate}%, Fehlerrate ${supplier.performance.defectRate}%
Compliance: ${supplier.compliance.status}

Antworte mit JSON:
{
  "strengths": ["Stärke 1", "Stärke 2"],
  "weaknesses": ["Schwäche 1"],
  "recommendations": ["Empfehlung 1"],
  "riskAssessment": "Niedrig|Mittel|Hoch",
  "summary": "Kurze Zusammenfassung (2-3 Sätze)"
}`

    try {
      const response = await this.callOpenAI([
        {
          role: 'system',
          content: 'Du bist ein Experte für Lieferantenbewertung in der Brauereiindustrie.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.6,
        max_tokens: 800
      })

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response')
      }

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Error analyzing supplier:', error)
      return {
        strengths: ['Daten werden analysiert...'],
        weaknesses: [],
        recommendations: [],
        riskAssessment: 'Unbekannt',
        summary: 'Analyse fehlgeschlagen'
      }
    }
  }

  /**
   * Compare multiple suppliers
   */
  async compareSuppliers(suppliers) {
    if (!suppliers || suppliers.length < 2) {
      return { error: 'Mindestens 2 Lieferanten erforderlich' }
    }

    const supplierData = suppliers.map(s => ({
      name: s.name,
      category: s.category,
      performance: s.performance,
      compliance: s.compliance.status
    }))

    const prompt = `Vergleiche diese Lieferanten und gib eine Empfehlung:

${JSON.stringify(supplierData, null, 2)}

Antworte mit JSON:
{
  "recommendation": "Name des empfohlenen Lieferanten",
  "reasoning": "Begründung (3-4 Sätze)",
  "comparisonTable": {
    "bestDelivery": "Name",
    "bestQuality": "Name",
    "bestValue": "Name",
    "lowestRisk": "Name"
  }
}`

    try {
      const response = await this.callOpenAI([
        {
          role: 'system',
          content: 'Du bist ein Experte für Lieferantenvergleiche.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.5,
        max_tokens: 1000
      })

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response')
      }

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Error comparing suppliers:', error)
      return {
        recommendation: suppliers[0].name,
        reasoning: 'Automatischer Vergleich fehlgeschlagen',
        comparisonTable: {}
      }
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService()
export default OpenAIService
