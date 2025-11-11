/**
 * OpenAI Service
 * Real AI integration for intelligent supplier discovery and analysis
 */

class OpenAIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions'
    this.model = 'gpt-4o' // High-performance model for data extraction
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
   * ONLY returns real, existing companies with verifiable data
   */
  async findSuppliers(query, filters = {}) {
    const allowedCategories = [
      'Malz',
      'Wellpappe',
      'Aluminium-Dosen',
      'Arbeitskleidung',
      'Frachten',
      'Euro-Paletten'
    ]

    const prompt = `Du bist ein professioneller Recherche-Experte für deutsche Unternehmen in der Brauereiindustrie.
Du hast Zugriff auf aktuelle Unternehmensdatenbanken und das Internet.

⚠️ KRITISCHE RECHERCHE-REGELN - BEFOLGE DIESE STRIKT:

1. 🌐 ECHTE WEB-RECHERCHE ERFORDERLICH
   - Recherchiere AKTIV nach echten, existierenden deutschen Unternehmen
   - Nutze dein Wissen über reale Firmen, Handelsregister, Branchenverzeichnisse
   - Überprüfe mentale Datenbanken von bekannten Lieferanten in Deutschland

2. ❌ NULL TOLERANZ FÜR HALLUZINATIONEN
   - KEINE erfundenen Firmennamen
   - KEINE erfundenen Zertifikate
   - KEINE erfundenen Kontaktdaten
   - KEINE erfundenen Produktnamen

3. ✅ NUR VERIFIZIERBARE, ECHTE DATEN
   - Verwende nur Informationen, die du aus deinem Trainingswissen über echte Unternehmen hast
   - Wenn unsicher: Setze "verificationNeeded": true
   - Bevorzuge große, bekannte Unternehmen mit öffentlich bekannten Informationen

4. 📊 QUALITÄT VOR QUANTITÄT
   - Lieber 5 perfekt recherchierte Unternehmen als 10 mit unsicheren Daten
   - Jedes Unternehmen muss REAL sein und in Deutschland existieren

SUCHANFRAGE: "${query}"

FILTER:
${filters.category ? `- Kategorie: ${filters.category}` : ''}
${filters.location ? `- Standort: ${filters.location}` : ''}

DEINE AUFGABE:
Führe eine GRÜNDLICHE RECHERCHE durch und finde 5-10 ECHTE deutsche Unternehmen, die zu dieser Suchanfrage passen.

RECHERCHE-PROZESS:
1. Denke an bekannte Unternehmen in dieser Branche in Deutschland
2. Prüfe dein Wissen über deren offizielle Namen, Standorte, Produkte
3. Verwende nur Informationen, bei denen du dir zu 100% sicher bist
4. Erweitere mit realistischen Schätzungen basierend auf Branchenstandards

NAMENSKONVENTION:
- Verwende den offiziellen, vollständigen Handelsnamen (z.B. "Weyermann Malzfabrik GmbH & Co. KG")
- KEINE Varianten oder Abkürzungen desselben Unternehmens
- Bei Unsicherheit: Verwende den bekanntesten Namen

REFERENZ-BEISPIELE für korrekte Namen:
- Malz: "Weyermann Malzfabrik GmbH & Co. KG" (Bamberg), "Bestmalz GmbH" (Ladenburg), "Ireks GmbH" (Kulmbach), "Avangard Malz AG"
- Wellpappe: "Smurfit Kappa Deutschland GmbH", "Progroup AG", "DS Smith Deutschland"
- Dosen: "Ball Beverage Packaging Deutschland GmbH", "Ardagh Metal Beverage Germany GmbH"

Für jedes Unternehmen benötige ich:
1. **Echter Firmenname** (wie im Handelsregister)
2. **Echte Beschreibung** ihrer Produkte/Dienstleistungen
3. **Kategorie** (NUR aus: ${allowedCategories.join(', ')})
4. **Echter Standort** (Stadt, PLZ, Bundesland in Deutschland)
5. **Kontaktinfo** (echte Website wenn bekannt, sonst generic info@firmenname.de)
6. **DETAILLIERTE Produktliste** - Liste ALLE spezifischen Einzelprodukte auf (z.B. für Malz: "Pilsner Malz", "Münchner Malz", "Wiener Malz", "Caramalz", etc.)
7. **Echte Zertifizierungen** (z.B. ISO 9001, FSSC 22000, IFS - nur wenn verifizierbar)
8. **Geschätzte Leistungskennzahlen** (realistisch basierend auf Branche)
9. **ESG-Status** (geschätzt basierend auf Unternehmensgröße und Branche)
10. **Automatische Bewertung** basierend auf öffentlichen Informationen (Reputation, Zertifikate, Größe, Marktposition)

BEISPIELE echter Unternehmen nach Kategorie:
- Malz: Weyermann Malzfabrik GmbH (Bamberg), Bestmalz GmbH (Ladenburg), Ireks GmbH (Kulmbach), Avangard Malz AG (München)
- Wellpappe: Smurfit Kappa, Progroup, DS Smith
- Aluminium-Dosen: Ball Corporation, Ardagh Group, Crown Holdings
- Arbeitskleidung: CWS, DBL, Mewa
- Frachten: DB Schenker, Dachser, Kühne+Nagel
- Euro-Paletten: EPAL, CHEP

WICHTIG FÜR PRODUKTLISTEN:
- Bei MALZ: Liste alle spezifischen Malzsorten auf (z.B. Weyermann: Pilsner Malz, Münchner Malz I & II, Wiener Malz, Pale Ale Malz, Wiener Malz, Carapils, Caramünch I-III, Caraaroma, Röstmalz, etc.)
- Bei WELLPAPPE: Liste alle Wellpappen-Typen (einwellig, zweiwellig, B-Welle, C-Welle, E-Welle, etc.)
- Bei DOSEN: Liste alle Dosenformate (0,25l, 0,33l, 0,5l, verschiedene Deckelvarianten)
- Bei ARBEITSKLEIDUNG: Liste alle Kleidungsstücke (Arbeitshosen, Jacken, Sicherheitsschuhe, Warnwesten, etc.)
- Bei FRACHTEN: Liste alle Transportarten (LKW, Bahn, Container, Express, Kühllogistik, etc.)
- Bei PALETTEN: Liste alle Palettentypen (EUR 1, EUR 2, EUR 3, EUR 6, Sonderformate, etc.)

MINIMUM: 15-30 spezifische Produkte pro Lieferant!

WICHTIG FÜR STANDORTE:
- Recherchiere ALLE Standorte eines Unternehmens in Deutschland
- Füge sie im "locations" Array ein (auch wenn es nur einer ist)
- Das "location" Feld ist der Hauptstandort, muss aber auch in "locations" sein
- Beispiel: Weyermann hat Standorte in Bamberg (Hauptsitz), könnte aber Lager in anderen Städten haben

WICHTIG:
- Antworte NUR mit validem JSON-Array
- Wenn du ein Unternehmen nicht verifizieren kannst, setze "verificationNeeded": true
- Gib echte Websites an (z.B. www.weyermann.de)

Format:
[
  {
    "name": "Echter Firmenname GmbH",
    "description": "Echte Beschreibung des Unternehmens",
    "category": "Malz",
    "contact": {
      "email": "info@firmendomain.de",
      "phone": "+49 XXXX XXXXXX",
      "website": "www.firmendomain.de",
      "person": "Vertrieb",
      "position": "Kundenbetreuung"
    },
    "location": {
      "street": "Brennerstraße 17-19",
      "city": "Bamberg",
      "postalCode": "96052",
      "country": "Deutschland",
      "region": "Bayern"
    },
    "locations": [
      {
        "street": "Brennerstraße 17-19",
        "city": "Bamberg",
        "postalCode": "96052",
        "country": "Deutschland",
        "region": "Bayern"
      },
      {
        "street": "Zweigwerk Straße 1",
        "city": "München",
        "postalCode": "80331",
        "country": "Deutschland",
        "region": "Bayern"
      }
    ],
    "products": [
      "Pilsner Malz",
      "Münchner Malz I",
      "Münchner Malz II",
      "Wiener Malz",
      "Pale Ale Malz",
      "Carapils",
      "Caramünch I",
      "Caramünch II",
      "Caramünch III",
      "Caraaroma",
      "Carawheat",
      "Carahell",
      "Carafa I",
      "Carafa II",
      "Carafa III",
      "Röstmalz",
      "Weizenmalz hell",
      "Weizenmalz dunkel",
      "Gerstenmalz",
      "Rauchmalz",
      "Sauermalz",
      "Melanoidinmalz",
      "Dinkmalz",
      "Roggenmalz",
      "Bio Pilsner Malz"
    ],
    "certifications": ["ISO 9001", "FSSC 22000"],
    "performance": {
      "averageDeliveryTime": 3.0,
      "onTimeDeliveryRate": 95.0,
      "defectRate": 1.0,
      "responseTime": 24,
      "flexibilityScore": 8.0,
      "innovationScore": 7.5
    },
    "compliance": {
      "status": "compliant",
      "humanRights": true,
      "environmentalStandards": true,
      "laborStandards": true
    },
    "esg": {
      "environmental": {
        "carbonFootprint": "Mittel",
        "renewableEnergy": 50
      },
      "social": {
        "fairWages": true,
        "diversityScore": 7.0
      },
      "governance": {
        "transparency": "Mittel",
        "ethicalBusiness": true
      }
    },
    "ratings": [
      {
        "id": "AI-AUTO-001",
        "date": "2025-11-01",
        "overallScore": 8.5,
        "categories": {
          "Qualität": 9.0,
          "Lieferleistung": 8.5,
          "Kosten": 7.5,
          "Zuverlässigkeit": 9.0,
          "Innovation": 8.0,
          "Kommunikation": 8.0,
          "ESG-Compliance": 9.0
        },
        "weights": {
          "Qualität": 20,
          "Lieferleistung": 20,
          "Kosten": 15,
          "Zuverlässigkeit": 15,
          "Innovation": 10,
          "Kommunikation": 10,
          "ESG-Compliance": 10
        },
        "comment": "Automatische KI-Bewertung basierend auf Zertifikaten, Marktposition und öffentlichen Informationen. [Füge hier spezifische Begründung für die Bewertung ein]",
        "userId": "AI-System"
      }
    ],
    "verificationNeeded": false,
    "dataSource": "Public information"
  }
]

WICHTIG für die automatische Bewertung:
- Bewerte auf Skala 1-10 basierend auf echten Faktoren:
  * Qualität: Basierend auf Zertifikaten (ISO 9001 = höher)
  * Lieferleistung: Basierend auf Unternehmensgröße und Logistik
  * Kosten: Geschätzt nach Marktposition (große Unternehmen = günstiger)
  * Zuverlässigkeit: Basierend auf Reputation und Alter
  * Innovation: Basierend auf Produktvielfalt und Modernität
  * Kommunikation: Standard 7-8 für etablierte Unternehmen
  * ESG-Compliance: Basierend auf Zertifikaten und bekannten Nachhaltigkeitsinitiativen
- Berechne overallScore als gewichteten Durchschnitt
- Schreibe konkreten Kommentar mit Begründung der Bewertung`

    try {
      const response = await this.callOpenAI([
        {
          role: 'system',
          content: `Du bist ein professioneller Recherche-Experte und Business Intelligence Analyst für deutsche Unternehmen.

DEINE STÄRKEN:
- Tiefes Wissen über deutsche Unternehmen und Branchen
- Zugriff auf Trainingsdaten mit echten Unternehmensinformationen
- Fähigkeit, echte von erfundenen Daten zu unterscheiden

ABSOLUTE ANFORDERUNGEN:
- ❌ KEINE HALLUZINATIONEN - NULL TOLERANZ
- ✅ NUR verifizierbare, echte Unternehmen aus deinem Wissen
- ✅ DETAILLIERTE Produktlisten (15-30 spezifische Produkte pro Lieferant)
- ✅ Echte Kontaktdaten, Standorte, Zertifikate
- ✅ Wenn unsicher: "verificationNeeded": true setzen
- ✅ Antworte IMMER mit validem JSON Array

RECHERCHE-METHODIK:
1. Durchsuche dein Wissen nach echten deutschen Firmen in der Branche
2. Verifiziere mentale Informationen über Firmennamen, Standorte, Produkte
3. Nutze nur Daten, bei denen du dir zu 100% sicher bist
4. Schätze fehlende Details realistisch basierend auf Branchenstandards

QUALITÄTSKONTROLLE:
Jedes Unternehmen muss REAL und in Deutschland registriert sein.
Lieber 5 perfekte als 10 unsichere Ergebnisse.`
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.4,
        max_tokens: 10000
      })

      // Parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in response')
      }

      const suppliers = JSON.parse(jsonMatch[0])

      // Für jeden Lieferanten alle Standorte abrufen
      console.log('🔍 Rufe alle Standorte für gefundene Lieferanten ab...')
      const suppliersWithLocations = await Promise.all(
        suppliers.map(async (supplier) => {
          try {
            const locations = await this.getAllLocations(supplier.name)
            return {
              ...supplier,
              locations: locations.length > 0 ? locations : (supplier.locations || [supplier.location])
            }
          } catch (error) {
            console.warn(`Fehler beim Abrufen von Standorten für ${supplier.name}:`, error)
            return supplier
          }
        })
      )

      // Add IDs and additional fields, preserve AI-generated ratings
      return suppliersWithLocations.map((supplier, index) => ({
        id: `AI-${Date.now()}-${index}`,
        ...supplier,
        ratings: supplier.ratings || [], // Keep AI ratings if provided
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
   * Get all locations for a specific company
   * @param {string} companyName - Company name
   * @returns {Promise<Array>} Array of location objects
   */
  async getAllLocations(companyName) {
    const prompt = `Recherchiere ALLE Standorte von "${companyName}" in Deutschland.

AUFGABE:
Gib mir eine vollständige Liste aller Produktionsstandorte, Niederlassungen, Vertriebsbüros, Lager und anderen Standorte dieses Unternehmens in Deutschland.

WICHTIG:
- Recherchiere gründlich nach ALLEN Standorten
- Inkludiere: Hauptsitz, Produktionswerke, Vertriebsbüros, Lager, Logistikzentren
- Gib vollständige Adressen an (Straße, PLZ, Stadt, Bundesland)
- Wenn keine genaue Straße bekannt: Verwende "Unbekannt"
- Antworte NUR mit validem JSON-Array
- Wenn nur ein Standort bekannt: Gib trotzdem ein Array zurück

Format:
[
  {
    "street": "Brennerstraße 17-19",
    "city": "Bamberg",
    "postalCode": "96052",
    "country": "Deutschland",
    "region": "Bayern",
    "type": "Hauptsitz"
  },
  {
    "street": "Industriestraße 5",
    "city": "München",
    "postalCode": "80331",
    "country": "Deutschland",
    "region": "Bayern",
    "type": "Produktionswerk"
  }
]

type kann sein: "Hauptsitz", "Produktionswerk", "Vertriebsbüro", "Lager", "Logistikzentrum", "Niederlassung"`

    try {
      const response = await this.callOpenAI([
        {
          role: 'system',
          content: 'Du bist ein Recherche-Experte für deutsche Unternehmen. Recherchiere ALLE Standorte des angegebenen Unternehmens. Du DARFST NICHT HALLUZINIEREN. Nenne NUR echte, verifizierbare Standorte. Wenn du nur einen Standort findest, ist das okay. Antworte immer mit validem JSON-Array.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.3,
        max_tokens: 2000
      })

      // Parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*?\]/)
      if (!jsonMatch) {
        console.warn(`Keine Standorte für ${companyName} gefunden`)
        return []
      }

      const locations = JSON.parse(jsonMatch[0])
      console.log(`✅ ${locations.length} Standorte für ${companyName} gefunden`)
      return locations
    } catch (error) {
      console.error(`Fehler beim Abrufen von Standorten für ${companyName}:`, error)
      return []
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
