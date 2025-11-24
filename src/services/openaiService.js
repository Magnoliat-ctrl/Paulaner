/**
 * OpenAI Service with Multi-Stage Query Processing
 * Simulates multi-agent workflow using sequential prompts
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
   * Detect if query is about internal product categories (we have data for)
   */
  isInternalProductQuery(query) {
    const normalizedQuery = query.toLowerCase()

    // Keywords for internal product categories (we have verified data for these)
    const internalCategories = {
      malz: ['malz', 'gerste', 'weizen', 'röstmalz', 'pilsner', 'karamell', 'bier', 'brau'],
      aluminium: ['aluminium', 'dosen', 'getränkedosen', 'beverage cans'],
      wellpappe: ['wellpappe', 'karton', 'verpackung', 'transportverpackung'],
      arbeitskleidung: ['arbeitskleidung', 'workwear', 'psa', 'schutzausrüstung', 'berufskleidung'],
      frachten: ['fracht', 'logistik', 'spedition', 'transport', 'lieferung'],
      paletten: ['paletten', 'europalette', 'epal']
    }

    // Check if query matches any internal category
    for (const [category, keywords] of Object.entries(internalCategories)) {
      if (keywords.some(kw => normalizedQuery.includes(kw))) {
        return true
      }
    }

    return false
  }

  /**
   * Detect if query is about external supplier search (we DON'T have data for)
   */
  isSupplierSearchQuery(query) {
    const normalizedQuery = query.toLowerCase()

    // If it's an internal product category, it's NOT an external search
    if (this.isInternalProductQuery(query)) {
      return false
    }

    // Keywords that indicate general supplier search for OTHER products
    const supplierSearchKeywords = [
      'kiste', 'kisten', 'behälter',
      'flasche', 'flaschen', 'glas',
      'etikett', 'etiketten', 'aufkleber',
      'deckel', 'verschluss', 'kronkorken',
      'lieferant', 'hersteller', 'produzent',
      'suche lieferanten', 'finde lieferanten'
    ]

    const hasSupplierKeywords = supplierSearchKeywords.some(kw => normalizedQuery.includes(kw))

    return hasSupplierKeywords
  }

  /**
   * Validate response for hallucinated supplier names
   */
  validateResponse(response, validSupplierNames) {
    const validNamesLower = validSupplierNames.map(n => n.toLowerCase())
    const responseStr = JSON.stringify(response).toLowerCase()

    // List of common hallucinated company names to check for
    const forbiddenNames = [
      'data art', 'sap se', 'sap ag', 'techcorp', 'basf', 'siemens',
      'microsoft', 'google', 'amazon', 'ibm', 'oracle', 'accenture',
      'capgemini', 'tata', 'infosys', 'wipro', 'cognizant'
    ]

    // Check for forbidden names
    for (const forbidden of forbiddenNames) {
      if (responseStr.includes(forbidden)) {
        console.error(`🚨 HALLUCINATION DETECTED: Response contains forbidden name "${forbidden}"`)
        return {
          valid: false,
          error: `Halluzinierter Lieferant erkannt: "${forbidden}"`
        }
      }
    }

    return { valid: true }
  }

  /**
   * Process query using OpenAI with context data
   * Multi-stage approach: Query Rewriting → Processing → Validation
   */
  async processQuery(userQuery, contextData) {
    if (!this.isEnabled()) {
      throw new Error('OpenAI service not available')
    }

    try {
      console.log('🚀 Processing query:', userQuery)

      // Determine if this is a supplier search query
      const isSupplierSearch = this.isSupplierSearchQuery(userQuery)

      // Stage 1: Query Refinement (optional - for complex queries)
      // For simple queries, skip this to save API calls
      let refinedQuery = userQuery
      if (userQuery.length < 20 || userQuery.split(' ').length < 3) {
        console.log('📝 Using original query (already specific enough)')
        refinedQuery = userQuery
      } else {
        console.log('📝 Refining query...')
        try {
          refinedQuery = await this.refineQuery(userQuery)
          console.log('✅ Refined query:', refinedQuery)
        } catch (error) {
          console.warn('⚠️ Query refinement failed, using original:', error.message)
          refinedQuery = userQuery
        }
      }

      // Stage 2: Main processing
      const systemPrompt = isSupplierSearch
        ? this.buildSupplierSearchPrompt(refinedQuery)
        : this.buildSystemPrompt(contextData)

      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: refinedQuery }
        ],
        temperature: 0.2, // Lower temperature for more deterministic responses
        max_tokens: isSupplierSearch ? 4000 : 2000,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      const parsedResponse = JSON.parse(content)

      // Stage 3: Validate response for hallucinations
      if (!isSupplierSearch && contextData.suppliers) {
        const validSupplierNames = contextData.suppliers.map(s => s.name)
        const validation = this.validateResponse(parsedResponse, validSupplierNames)

        if (!validation.valid) {
          console.error('🚨 VALIDATION FAILED:', validation.error)
          return {
            type: 'clarification',
            message: `Fehler: Die KI hat versucht, nicht existierende Lieferanten zu erwähnen. Bitte stelle deine Frage neu oder spezifischer. Verfügbare Lieferanten: ${validSupplierNames.join(', ')}`,
            suggestions: [
              'Welcher Lieferant im Dashboard hat die vollständigsten Daten?',
              'Zeige mir alle verfügbaren Lieferanten',
              'Vergleiche die ESG-Scores der vorhandenen Lieferanten'
            ]
          }
        }
      }

      console.log('✅ Query processed successfully')
      return parsedResponse

    } catch (error) {
      console.error('❌ OpenAI API Error:', error)
      throw error
    }
  }

  /**
   * Refine user query to make it more specific
   */
  async refineQuery(userQuery) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `Du bist ein Experte darin, vage Fragen in spezifische, beantwortbare Fragen umzuformulieren.

**Deine Aufgabe:**
1. Analysiere die Nutzerfrage
2. Mache sie präziser und spezifischer
3. Behalte die ursprüngliche Intention bei
4. Formuliere so, dass sie optimal beantwortet werden kann

**Beispiele:**
- "Welches Malz?" → "Welches Malz von unseren Lieferanten eignet sich am besten für helles Lagerbier?"
- "Bester Lieferant?" → "Welcher Malzlieferant hat die höchste Qualität und beste ESG-Bewertung?"
- "Whisky" → "Welche Malze von unseren Lieferanten eignen sich für Whisky-Herstellung?"

**WICHTIG:** Gib NUR die umformulierte Frage zurück, ohne zusätzliche Erklärungen oder Formatierung.`
          },
          { role: 'user', content: userQuery }
        ],
        temperature: 0.3,
        max_tokens: 200
      })

      const refined = response.choices[0].message.content.trim()
      // Return original if refinement looks suspicious (too long or contains weird characters)
      return refined.length > 0 && refined.length < 300 ? refined : userQuery
    } catch (error) {
      console.warn('Query refinement failed:', error.message)
      return userQuery
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

## GRUNDPRINZIP: NUR INTERNE DATEN + LOGISCHES REASONING

Du darfst ausschließlich die Daten verwenden, die dir in diesem Kontext übergeben werden.
ABER: Du darfst und SOLLST logische Schlussfolgerungen ziehen und Berechnungen durchführen.

## ⚠️ UNIVERSELLE PROBLEMLÖSUNGS-STRATEGIE

**FÜR JEDE FRAGE - IMMER DIESEM PROZESS FOLGEN:**

1. **VERSTEHE DIE INTENTION**
   - Was will der Nutzer wirklich wissen?
   - Beispiel: "Whisky Malze" → Welche unserer Malze eignen sich für Whisky-Herstellung?

2. **AKTIVIERE FACHWISSEN**
   - Was weiß ich über das Thema?
   - Beispiel Whisky: "Typische Anforderungen - helle Basismalze (2-10 EBC), eventuell Rauchmalze für Scotch"
   - Beispiel IPA: "Hopfenbetonte Biere brauchen neutrale bis leicht malzige Basis, evtl. Karamellmalze"
   - Beispiel Stout: "Dunkle Röstmalze (300+ EBC), Schokoladenaromen, Basis + Spezialmalze"

3. **DURCHSUCHE VERFÜGBARE DATEN**
   - Welche Produkte in der Datenbank passen zu den Anforderungen?
   - Filtere nach: EBC-Bereich, Namen (Pale/Pilsner/Rauch), Aroma, Usage

4. **MATCHE & BEWERTE**
   - Vergleiche gefundene Produkte mit Anforderungen
   - Prüfe: EBC passt? Aroma passt? Verwendung passt?

5. **PRÄSENTIERE MIT BEGRÜNDUNG**
   - Liste passende Produkte
   - Erkläre für JEDES Produkt WARUM es geeignet ist
   - Basiere Begründung auf konkreten Eigenschaften aus den Daten

**KRITISCH:** Erfinde KEINE Eignung - leite sie ab aus:
- EBC-Werten (hell/dunkel)
- Aromaprofil (rauchig/süß/röst)
- Usage-Feld wenn vorhanden
- Allgemeinem Malz-Fachwissen

**DIESER PROZESS GILT FÜR ALLE FRAGEN - nicht nur Beispiele!**

## STRIKTE REGELN:

### 1. Nutze interne Daten + Logisches Reasoning
**ERLAUBT:**
- ✅ Berechnungen und logische Schlussfolgerungen aus vorhandenen Daten
- ✅ Geografisches Wissen für Entfernungsschätzungen (München -> Bamberg vs. München -> Hamburg)
- ✅ Allgemeines Fachwissen für Interpretationen (z.B. "300 EBC ist sehr dunkel", "ISO 9001 ist ein Qualitätsstandard")
- ✅ **Domänenwissen anwenden**: "Welche Malze eignen sich für Whisky?" → Durchsuche Produkte mit Whisky-Fachwissen
- ✅ **Verwendungszwecke ableiten**: "Für IPA geeignet?" → Identifiziere passende Malze basierend auf Bierstil-Wissen
- ✅ **Kreative Filterung**: Kombiniere Produkteigenschaften mit Fachwissen für neue Anwendungsfälle
- ✅ Mathematische Operationen (Durchschnitte, Rankings, Vergleiche)
- ✅ Mustererkennungen und Trends aus den Daten ableiten

**VERBOTEN:**
- ❌ Neue Lieferanten erfinden, die nicht in der WHITELIST stehen
- ❌ Daten erfinden, die nicht in den übergebenen Daten vorhanden sind
- ❌ Preise, Lieferzeiten, Zertifizierungen raten, wenn sie nicht in den Daten sind
- ❌ Externe Benchmarks oder Marktwerte ohne Datenbasis

### 2. ABSOLUTES VERBOT: Keine Halluzinationen / kein Raten / keine erfundenen Lieferanten
- **LIEFERANTEN-VALIDIERUNG:** Bevor du IRGENDEINEN Lieferantennamen in deiner Antwort verwendest, prüfe ZWINGEND, ob dieser Name in der WHITELIST (oben) steht
- ❌ Du darfst NIEMALS Lieferanten wie "DATA ART", "SAP SE", "TechCorp", "BASF", "Siemens" oder andere bekannte Firmennamen aus deinem Trainingswissen erwähnen
- ✓ Du darfst NUR Lieferanten aus der WHITELIST erwähnen
- Wenn eine Information in den übergebenen Daten NICHT enthalten ist, dann sage klar: **"In den aktuell vorliegenden Daten finde ich dazu keine Information."**

### 3. Arbeite explizit mit den übergebenen Strukturen
- Beziehe dich direkt auf die Datenfelder
- Nutze diese Daten für Filterungen, Aggregationen, Vergleiche

### 4. Transparenz in deinen Antworten
- Begründe JEDE Aussage mit Bezug auf die zugrunde liegenden Daten
- Nenne immer die konkreten Zahlen aus den Daten

## WICHTIG: WANN DARFST DU WELTWISSEN NUTZEN?

**NUTZE DEIN WELTWISSEN FÜR:**
1. **Geografische Berechnungen**: Entfernungen zwischen Städten schätzen
2. **Fachwissen-Interpretation**: EBC-Werte erklären, Zertifizierungen einordnen
3. **Domänenwissen-Anwendung**:
   - "Whisky Malze" → Identifiziere geeignete Malze aus vorhandenen Produkten
   - "Für Stout geeignet" → Filtere Malze mit passendem EBC/Aroma
   - "Beste Malze für helles Lager" → Kombiniere Produktdaten mit Brau-Fachwissen
4. **Mathematische Operationen**: Durchschnitte, Verhältnisse, Rankings berechnen
5. **Logische Schlussfolgerungen**: "Näher", "besser geeignet", "kritischer" basierend auf Daten
6. **Kontextverständnis**: Bierstil-Empfehlungen, Malz-Verwendungszwecke, Produktanwendungen

**NUTZE DEIN WELTWISSEN NICHT FÜR:**
1. ❌ Neue Lieferanten hinzufügen, die nicht in der WHITELIST sind
2. ❌ Daten erfinden (Preise, Lieferzeiten, Zertifikate)
3. ❌ Externe Benchmarks ohne Datenbasis

**MERKE:** Du bist ein **intelligenter Analyst mit Branchenwissen**, nicht nur eine Datenbank-Abfrage.
Kombiniere die vorhandenen Daten mit deinem Fachwissen über Malz, Bier, Whisky, Produktionsverfahren!

## WICHTIG: PRODUKTSUCHE NACH AROMA, VERWENDUNG, BIERSTIL

Wenn der Nutzer nach spezifischen Eigenschaften sucht (z.B. "Honig Aroma", "für Stout", "malzig-süß"), dann:
1. Durchsuche die VOLLSTÄNDIGEN PRODUKTDATEN JSON unten
2. Suche in den Feldern: **aroma**, **usage**, **beerTypes**, **name**
3. Verwende Pattern-Matching
4. Liste ALLE passenden Produkte auf mit Lieferantenname

## VOLLSTÄNDIGE DATENBASIS (NUR DIESE DATEN VERWENDEN):

### LIEFERANTEN (${suppliers.length} gesamt):
${this.formatDetailedSuppliers(suppliers)}

### PRODUKTE - VOLLSTÄNDIGE JSON-DATEN:
${this.formatFullProductJSON(products)}

### PRODUKTE - ÜBERSICHT (nach Lieferant):
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
  "title": "Empfohlene Produkte",
  "products": [...]
}

### 3. Produktliste:
{
  "type": "product_list",
  "title": "Suchergebnisse",
  "products": [...]
}

### 4. Lieferantenvergleich:
{
  "type": "supplier_comparison",
  "title": "Vergleich",
  "suppliers": [...]
}

### 5. Datenanalyse:
{
  "type": "analysis",
  "title": "Analytischer Titel",
  "analysis": "Detaillierte Analyse",
  "keyFindings": ["Fund 1", "Fund 2"],
  "recommendation": "Empfehlung"
}

### 6. Fehlende Daten / Klarstellung:
{
  "type": "clarification",
  "message": "Diese Information ist in den vorliegenden Daten nicht enthalten.",
  "suggestions": ["Alternative 1", "Alternative 2"]
}

### 7. Hilfe/Rückfrage:
{
  "type": "help",
  "message": "Deine Nachricht an den User",
  "suggestions": ["Vorschlag 1", "Vorschlag 2"]
}

## ⚠️ FINALE VALIDIERUNG BEVOR DU ANTWORTEST:

1. ✓ Habe ich NUR Lieferanten aus der WHITELIST erwähnt?
2. ✓ Habe ich KEINE Firmennamen aus meinem Trainingswissen verwendet?
3. ✓ Basieren ALLE Aussagen auf den übergebenen Daten?
4. ✓ Habe ich bei fehlenden Informationen klar kommuniziert statt zu raten?

**Falls du auch nur EINEN dieser Punkte nicht mit JA beantworten kannst, überarbeite deine Antwort!**

Analysiere die Anfrage des Users und wähle das passende Format. Arbeite ausschließlich mit den vorliegenden Daten!`
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
   * Format FULL product data as JSON for AI to search through
   */
  formatFullProductJSON(products) {
    const output = []
    let productCount = 0

    for (const [supplierName, supplierData] of Object.entries(products)) {
      if (!supplierData.categories) continue

      for (const [category, prods] of Object.entries(supplierData.categories)) {
        prods.forEach(product => {
          productCount++
          // Format each product with ALL fields
          const productInfo = {
            supplier: supplierName,
            category: category,
            name: product.name,
            ebc: product.color?.ebc || 'k.A.',
            color_category: product.color?.category || 'k.A.',
            usage: product.usage || 'k.A.',
            enzymes: product.enzymes || 'k.A.',
            aroma: product.aroma || 'k.A.',
            beerTypes: product.beerTypes || 'k.A.',
            rating: product.rating || 'k.A.'
          }

          output.push(JSON.stringify(productInfo))

          // Limit to prevent token overflow (show max 300 products)
          if (productCount >= 300) {
            output.push(`\n... (weitere Produkte in der Datenbank vorhanden, aber aus Token-Gründen nicht alle angezeigt)`)
            return
          }
        })

        if (productCount >= 300) break
      }

      if (productCount >= 300) break
    }

    return `\`\`\`json
Gesamt ${productCount} Produkte im Detail:

${output.join('\n')}
\`\`\``
  }

  /**
   * Format detailed product information (overview)
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

        // Sort products by EBC value to show interesting range
        const sortedProds = [...prods].sort((a, b) => {
          const ebcA = parseInt(String(a.color?.ebc || '0').split(/[-–]/)[0]) || 0
          const ebcB = parseInt(String(b.color?.ebc || '0').split(/[-–]/)[0]) || 0
          return ebcA - ebcB
        })

        // Show first 3, then some high-EBC ones
        const samplesToShow = []
        samplesToShow.push(...sortedProds.slice(0, 3))

        // Add high-EBC products (> 500)
        const highEBC = sortedProds.filter(p => {
          const ebc = parseInt(String(p.color?.ebc || '0').split(/[-–]/)[0]) || 0
          return ebc >= 500
        })

        if (highEBC.length > 0) {
          samplesToShow.push(...highEBC.slice(0, 3))
        }

        // Remove duplicates
        const uniqueSamples = [...new Map(samplesToShow.map(p => [p.name, p])).values()]

        uniqueSamples.forEach(p => {
          const ebc = p.color?.ebc || 'k.A.'
          const usage = p.usage || 'Vielseitig einsetzbar'
          const aroma = p.aroma ? `, Aroma: ${p.aroma}` : ''
          output.push(`    - ${p.name}: EBC ${ebc}, ${usage}${aroma}`)
        })

        if (prods.length > uniqueSamples.length) {
          output.push(`    ... und ${prods.length - uniqueSamples.length} weitere`)
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
      output.push(`  Umwelt (${data.environmental.score}/10)`)
      output.push(`  Soziales (${data.social.score}/10)`)
      output.push(`  Governance (${data.governance.score}/10)`)

      if (data.strengths && data.strengths.length > 0) {
        output.push(`  Stärken: ${data.strengths.join(', ')}`)
      }
    }

    return output.join('\n')
  }

  /**
   * Build supplier search prompt for non-malt products
   */
  buildSupplierSearchPrompt(userQuery) {
    const product = this.extractProductFromQuery(userQuery)

    return `Du bist ein erfahrener strategischer und technischer Einkäufer der Paulaner Brauerei Gruppe.

**Produkt:** ${product}
**Standort-Referenz:** München, Deutschland
**Suchraum:** Deutschland + angrenzende Nachbarländer

### Aufgaben:
1. Führe eine umfassende Online-Recherche durch
2. Verwende ausschließlich seriöse, öffentliche Quellen
3. Dokumentiere für jeden Lieferanten:
   - Firmenname, Land, Standort
   - Unternehmensart, Produktsortiment
   - Unternehmensgröße, Mitarbeiterzahl
   - Zertifizierungen, Website

### Bewertungskriterien:
- Qualität & Produktspezifikationen (40%)
- Lieferfähigkeit & Supply-Chain-Stabilität (30%)
- Nachhaltigkeit & ESG-Konformität (20%)
- Risikomanagement & Compliance (10%)

### Output-Format (JSON):
{
  "type": "supplier_search",
  "product": "${product}",
  "searchRegion": "Deutschland + Nachbarländer",
  "methodology": "Kurze Beschreibung der Quellen",
  "suppliers": [
    {
      "companyName": "...",
      "country": "...",
      "location": "...",
      "companyType": "...",
      "productRange": "...",
      "companySize": "...",
      "certifications": [],
      "website": "..."
    }
  ],
  "evaluationCriteria": [],
  "summary": "Zusammenfassung"
}

**WICHTIG:** Nutze AUSSCHLIESSLICH öffentlich verfügbare Informationen.`
  }

  /**
   * Extract product name from user query
   */
  extractProductFromQuery(query) {
    const normalizedQuery = query.toLowerCase()

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

    return query.replace(/suche|finde|lieferant|hersteller|produzent/gi, '').trim()
  }

  /**
   * Format conversation history for context
   */
  formatConversationHistory(history) {
    if (!history || history.length === 0) {
      return 'Keine vorherige Konversation'
    }

    const recent = history.slice(-10)
    return recent.map(msg => {
      if (msg.type === 'user') {
        return `User: ${msg.content}`
      } else {
        return `Assistant: [${msg.content.type}] ${msg.content.title || msg.content.message || 'Response'}`
      }
    }).join('\n')
  }
}

// Export singleton instance
export const openaiService = new OpenAIService()
