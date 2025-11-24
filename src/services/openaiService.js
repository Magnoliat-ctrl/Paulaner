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

    // Extract potential supplier names from response (look for capitalized words)
    const words = JSON.stringify(response).match(/[A-ZÄÖÜ][a-zäöüß]+(?: [A-ZÄÖÜ][a-zäöüß]+)*/g) || []

    for (const word of words) {
      // Skip common words
      if (['Dashboard', 'Lieferant', 'Daten', 'Kennzahl', 'Score', 'Rating'].includes(word)) {
        continue
      }

      // Check if it looks like a company name and is NOT in valid suppliers
      if (word.length > 3 && !validNamesLower.some(valid =>
        word.toLowerCase().includes(valid) || valid.includes(word.toLowerCase())
      )) {
        console.warn(`⚠️ Potential hallucination: "${word}"`)
      }
    }

    return { valid: true }
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
        temperature: 0.2, // Lower temperature for more deterministic responses
        max_tokens: isSupplierSearch ? 4000 : 2000, // Increased for product searches
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      const parsedResponse = JSON.parse(content)

      // Validate response for hallucinations
      if (!isSupplierSearch && contextData.suppliers) {
        const validSupplierNames = contextData.suppliers.map(s => s.name)
        const validation = this.validateResponse(parsedResponse, validSupplierNames)

        if (!validation.valid) {
          console.error('🚨 VALIDATION FAILED:', validation.error)
          // Return error response instead of hallucinated data
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

      return parsedResponse

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

## ⚠️ KONKRETE BEISPIELE:

**BEISPIEL 1 - Frage: "Welcher Lieferant hat die fundiertesten Daten?"**
❌ FALSCH: "DATA ART und SAP SE haben die umfassendsten Daten..."
✓ RICHTIG: "Basierend auf den vorliegenden Daten hat Weyermann® die vollständigsten Informationen mit 10 Datenfeldern, gefolgt von..."

**BEISPIEL 2 - Frage: "Für was verwendet man 1000 EBC Malze?"**
❌ FALSCH: "Dazu liegen keine Daten vor"
✓ RICHTIG: "In den Produktdaten finde ich Farbmalze mit 1000 EBC von SCHUEMA (Fa 1000, Fa verano 1000). Diese werden verwendet für..."

**BEISPIEL 3 - Frage: "Welche Tech-Unternehmen sind gute Lieferanten?"**
❌ FALSCH: "Microsoft, Google und IBM sind führende Tech-Lieferanten..."
✓ RICHTIG: "In den Dashboard-Daten sind keine Tech-Unternehmen enthalten. Die verfügbaren Lieferanten sind Malzproduzenten: ${validSupplierNames.slice(0, 3).join(', ')}, ..."

**BEISPIEL 4 - Frage: "Wir bräuchten ein Malz mit Honig Aroma"**
❌ FALSCH: "In den Daten finde ich keine Informationen über Malze mit Honig Aroma"
✓ RICHTIG: "Ich durchsuche die Aromaprofil-Felder... Ich finde folgende Malze mit Honig-Aroma: [Liste der Produkte mit aroma-Feld = 'honig' oder ähnlich]"

**BEISPIEL 5 - Frage: "Welcher Malzlieferant ist am nächsten in München?"**
❌ FALSCH: "Diese Information ist in den Daten nicht enthalten"
✓ RICHTIG: "Basierend auf den Standorten in den Daten:
- Weyermann® in Bamberg (~60 km von München) - AM NÄCHSTEN
- Bestmalz in Heidelberg (~220 km)
- Avangard Malz in Grossaitingen (~60 km)
Die nächsten Lieferanten sind Weyermann® (Bamberg) und Avangard Malz (Grossaitingen), beide ca. 60 km von München entfernt."

**BEISPIEL 6 - Frage: "Welcher Lieferant hat den besten ESG-Score pro km Entfernung?"**
❌ FALSCH: "Diese Berechnung ist nicht in den Daten"
✓ RICHTIG: "Ich berechne ESG-Score/Entfernung für jeden Lieferanten:
- Weyermann® (ESG: 9.3, ~60km) = 0.155
- Bestmalz (ESG: 8.8, ~220km) = 0.040
Ergebnis: Weyermann® hat das beste Verhältnis."

**BEISPIEL 7 - Frage: "Zeige mir gute Whisky Malze von unseren Lieferanten"**
❌ FALSCH: "Diese Information ist nicht in den Daten enthalten"
✓ RICHTIG (Zeige den Denkprozess):

**SCHRITT 1 - Fachwissen aktivieren:**
"Für Whisky werden typischerweise verwendet: Pale/Pilsner Malze als Basis, Rauchmalze für Scotch, eventuell Münchner für Charakter"

**SCHRITT 2 - Daten durchsuchen:**
"Ich durchsuche alle verfügbaren Produkte nach diesen Kriterien..."

**SCHRITT 3 - Gefundene Malze präsentieren:**
"Basierend auf Whisky-Produktionswissen habe ich folgende geeignete Malze identifiziert:
- [Liste mit Begründung WARUM jedes Malz geeignet ist]
- Erklärung der Eigenschaften (EBC, Enzyme, Verwendung)"

**WICHTIG:** Nenne keine spezifischen Produktnamen in Beispielen - lass den AI selbst suchen!

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
3. Verwende Pattern-Matching (z.B. "honig" passt zu "honigartig", "Honignoten", etc.)
4. Liste ALLE passenden Produkte auf mit Lieferantenname

## VOLLSTÄNDIGE DATENBASIS (NUR DIESE DATEN VERWENDEN):

### LIEFERANTEN (${suppliers.length} gesamt):
${this.formatDetailedSuppliers(suppliers)}

### PRODUKTE - VOLLSTÄNDIGE JSON-DATEN:
**WICHTIG: Dies sind die KOMPLETTEN Produktdaten. Durchsuche diese JSON-Struktur für spezifische Anfragen!**

${this.formatFullProductJSON(products)}

### PRODUKTE - ÜBERSICHT (nach Lieferant):
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
- **KREATIVE DATENANALYSE**: Kombiniere verschiedene Datenfelder für neue Insights
  - Beispiel: "ESG-Score pro Entfernung", "Qualität/Preis-Verhältnis", "Lieferanten mit höchster Innovationskraft in der Nähe"
- **PROAKTIVE EMPFEHLUNGEN**: Wenn eine direkte Antwort fehlt, schlage Alternativen vor
- Dein Fokus: **korrekt, nachvollziehbar, datenbasiert, analytisch, hilfreich**

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

        // Show first 3, then some high-EBC ones (like 1000 EBC)
        const samplesToShow = []
        samplesToShow.push(...sortedProds.slice(0, 3)) // First 3 (lightest)

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
