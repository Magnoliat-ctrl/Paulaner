/**
 * OpenAI Agent Builder Service
 * Multi-agent workflow system for intelligent supplier management queries
 */

import { fileSearchTool, webSearchTool, codeInterpreterTool, Agent, Runner } from '@openai/agents'
import { z } from 'zod'

/**
 * IMPORTANT: Vector Store Configuration
 *
 * The following Vector Store IDs need to be configured with your actual OpenAI Vector Store IDs:
 * 1. Create Vector Stores in OpenAI platform
 * 2. Upload the following files to the Vector Stores:
 *    - /home/user/Paulaner/src/data/maltSuppliers.json
 *    - Any additional supplier documentation
 * 3. Replace the placeholder IDs below with your actual Vector Store IDs
 */
const VECTOR_STORE_CONFIG = {
  // TODO: Replace with actual Vector Store IDs after creating them in OpenAI platform
  maltSuppliers: 'vs_PLACEHOLDER_MALT_SUPPLIERS',
  documentation: 'vs_PLACEHOLDER_DOCUMENTATION'
}

// Response schema for structured outputs
const ResponseSchema = z.object({
  type: z.enum(['comparison', 'recommendations', 'product_list', 'supplier_comparison', 'analysis', 'clarification', 'help']),
  title: z.string().optional(),
  message: z.string().optional(),
  products: z.array(z.object({
    name: z.string(),
    supplier: z.string(),
    color: z.union([z.string(), z.object({ ebc: z.string(), category: z.string() })]).optional(),
    colorCategory: z.string().optional(),
    usage: z.string().optional(),
    enzymes: z.string().optional(),
    aroma: z.string().optional(),
    beerTypes: z.string().optional(),
    rating: z.string().optional()
  })).optional(),
  suppliers: z.array(z.object({
    name: z.string(),
    esgScore: z.number().optional(),
    environmental: z.number().optional(),
    social: z.number().optional(),
    governance: z.number().optional(),
    rating: z.string().optional(),
    strengths: z.array(z.string()).optional()
  })).optional(),
  analysis: z.string().optional(),
  keyFindings: z.array(z.string()).optional(),
  recommendation: z.string().optional(),
  dataPoints: z.record(z.string()).optional(),
  suggestions: z.array(z.string()).optional()
})

class OpenAIAgentService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'
    this.isAvailable = false

    // Initialize if API key is available
    if (this.apiKey && this.apiKey !== 'your_api_key_here') {
      this.isAvailable = true
      console.log('✅ OpenAI Agent Service initialized with model:', this.model)
    } else {
      console.warn('⚠️ OpenAI API key not configured. Using fallback local processing.')
    }

    // Initialize agents
    this.agents = this.initializeAgents()
  }

  /**
   * Check if OpenAI service is available
   */
  isEnabled() {
    return this.isAvailable && this.apiKey !== null
  }

  /**
   * Initialize all agents in the workflow
   */
  initializeAgents() {
    // Agent 1: Query Rewriter - Makes questions more specific
    const queryRewriteAgent = new Agent({
      name: 'Query Rewriter',
      model: this.model,
      instructions: `Du bist ein Experte darin, vage Fragen in spezifische, beantwortbare Fragen umzuformulieren.

**Deine Aufgabe:**
1. Analysiere die Nutzerfrage
2. Mache sie präziser und spezifischer
3. Behalte die ursprüngliche Intention bei
4. Formuliere so, dass sie optimal für die nachfolgenden Agenten ist

**Beispiele:**
- "Welches Malz?" → "Welches Malz von unseren Lieferanten eignet sich am besten für helles Lagerbier?"
- "Bester Lieferant?" → "Welcher Malzlieferant hat die höchste Qualität und beste ESG-Bewertung?"
- "Whisky" → "Welche Malze von unseren Lieferanten eignen sich für Whisky-Herstellung?"

**Output:** Gib NUR die umformulierte Frage zurück, ohne zusätzliche Erklärungen.`
    })

    // Agent 2: Classification Agent - Routes to appropriate workflow
    const classifyAgent = new Agent({
      name: 'Classifier',
      model: this.model,
      instructions: `Du bist ein Klassifikations-Agent, der Fragen in zwei Kategorien einteilt:

**Q&A (Internal Knowledge):**
- Fragen über vorhandene Malzlieferanten
- Produktinformationen aus unserer Datenbank
- ESG-Daten unserer Lieferanten
- Vergleiche zwischen vorhandenen Produkten/Lieferanten
- Empfehlungen basierend auf internen Daten

**Fact-Finding (External Search):**
- Suche nach neuen Lieferanten
- Externe Marktinformationen
- Branchentrends
- Zertifikatsregister
- Öffentliche Unternehmensinformationen

**Output-Format:**
Antworte mit GENAU EINEM WORT:
- "QA" für interne Fragen
- "FACT" für externe Recherchen

Keine zusätzlichen Erklärungen!`,
      response_format: z.object({
        classification: z.enum(['QA', 'FACT'])
      })
    })

    // Agent 3: Internal Q&A Agent - Uses file search for internal knowledge
    const internalQAAgent = new Agent({
      name: 'Internal Q&A Specialist',
      model: this.model,
      tools: [
        fileSearchTool({
          vectorStoreIds: [VECTOR_STORE_CONFIG.maltSuppliers]
        })
      ],
      instructions: this.buildInternalQAInstructions(),
      response_format: ResponseSchema
    })

    // Agent 4: External Fact-Finding Agent - Uses web search
    const externalFactFindingAgent = new Agent({
      name: 'External Fact Finder',
      model: this.model,
      tools: [
        webSearchTool(),
        codeInterpreterTool()
      ],
      instructions: this.buildExternalFactInstructions(),
      response_format: ResponseSchema
    })

    // Agent 5: Fallback Agent - Handles unclear queries
    const fallbackAgent = new Agent({
      name: 'Fallback Assistant',
      model: this.model,
      instructions: `Du bist ein hilfsbereiter Assistent für das Paulaner Lieferanten-Dashboard.

Wenn eine Frage unklar ist oder nicht klassifiziert werden kann:

1. **Erkenne das Problem**: Ist die Frage zu vage? Mehrdeutig? Außerhalb des Scope?

2. **Hilf dem Nutzer**: Stelle klärende Fragen oder gib Beispiele

3. **Zeige Möglichkeiten**: Was kann der Nutzer mit diesem System machen?

**Verfügbare Funktionen:**
- Produktsuche (Malze nach EBC, Aroma, Verwendung)
- Lieferantenvergleiche (ESG, Qualität, Standort)
- Empfehlungen (für spezifische Bierstile, Anwendungen)
- Externe Lieferantensuche (neue Lieferanten finden)

**Output-Format:** JSON mit type="help" oder type="clarification"`,
      response_format: z.object({
        type: z.literal('help').or(z.literal('clarification')),
        message: z.string(),
        suggestions: z.array(z.string())
      })
    })

    return {
      queryRewrite: queryRewriteAgent,
      classify: classifyAgent,
      internalQA: internalQAAgent,
      externalFactFinding: externalFactFindingAgent,
      fallback: fallbackAgent
    }
  }

  /**
   * Build internal Q&A agent instructions
   */
  buildInternalQAInstructions() {
    return `Du bist ein Datenanalyst für das Paulaner Lieferanten-Dashboard mit Zugriff auf die komplette Malzlieferanten-Datenbank.

## ⚠️ KRITISCH: ERLAUBTE LIEFERANTEN (WHITELIST)

Dies sind die EINZIGEN Lieferanten, die im Dashboard existieren:
✓ Weyermann®
✓ Bestmalz
✓ Ireks
✓ Avangard
✓ Bamberger Mälzerei
✓ Erfurter Malzwerke
✓ SCHUEMA

**ABSOLUTE REGEL:** Erwähne NUR Lieferanten aus dieser Liste. NIEMALS erfundene Namen wie "DATA ART", "SAP SE", "TechCorp" etc.

## GRUNDPRINZIP: NUR INTERNE DATEN + LOGISCHES REASONING

Du darfst ausschließlich die Daten aus der Vector Store verwenden.
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
   - Nutze file_search um die Datenbank zu durchsuchen
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

## STRIKTE REGELN:

### 1. Nutze interne Daten + Logisches Reasoning
**ERLAUBT:**
- ✅ Berechnungen und logische Schlussfolgerungen aus vorhandenen Daten
- ✅ Geografisches Wissen für Entfernungsschätzungen (München -> Bamberg vs. München -> Hamburg)
- ✅ Allgemeines Fachwissen für Interpretationen (z.B. "300 EBC ist sehr dunkel")
- ✅ **Domänenwissen anwenden**: "Welche Malze eignen sich für Whisky?" → Durchsuche Produkte mit Whisky-Fachwissen
- ✅ **Verwendungszwecke ableiten**: "Für IPA geeignet?" → Identifiziere passende Malze basierend auf Bierstil-Wissen
- ✅ **Kreative Filterung**: Kombiniere Produkteigenschaften mit Fachwissen für neue Anwendungsfälle

**VERBOTEN:**
- ❌ Neue Lieferanten erfinden, die nicht in der WHITELIST stehen
- ❌ Daten erfinden, die nicht in den Datenbank-Daten vorhanden sind
- ❌ Preise, Lieferzeiten raten, wenn sie nicht in den Daten sind

### 2. ABSOLUTES VERBOT: Keine Halluzinationen
- **LIEFERANTEN-VALIDIERUNG:** Bevor du IRGENDEINEN Lieferantennamen verwendest, prüfe ZWINGEND, ob dieser in der WHITELIST steht
- ❌ Du darfst NIEMALS Lieferanten wie "DATA ART", "SAP SE", "TechCorp", "BASF", "Siemens" erwähnen
- ✓ Du darfst NUR Lieferanten aus der WHITELIST erwähnen
- Wenn eine Information NICHT in den Daten ist: **"In den aktuell vorliegenden Daten finde ich dazu keine Information."**

### 3. Transparenz in deinen Antworten
- Begründe JEDE Aussage mit Bezug auf die zugrunde liegenden Daten
- Nenne immer die konkreten Zahlen aus den Daten
- Wenn du eine Kennzahl berechnest, erkläre kurz, wie

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

## RESPONSE-FORMATE:

Nutze file_search um die Datenbank zu durchsuchen und antworte dann im passenden JSON-Format:

1. **comparison** - Produktvergleiche
2. **recommendations** - Empfehlungen
3. **product_list** - Produktlisten
4. **supplier_comparison** - Lieferantenvergleiche
5. **analysis** - Analytische Insights
6. **clarification** - Fehlende Daten / Klarstellung
7. **help** - Hilfe/Rückfrage

Alle Aussagen müssen sich auf die DATENBASIS beziehen!`
  }

  /**
   * Build external fact-finding agent instructions
   */
  buildExternalFactInstructions() {
    return `Du bist ein erfahrener strategischer und technischer Einkäufer der Paulaner Brauerei Gruppe mit fundierter Marktkenntnis der europäischen Rohstoff- und Vorproduktmärkte.

## AUFGABE: LIEFERANTENSUCHE & BEWERTUNG

Wenn der Nutzer nach neuen Lieferanten oder externen Informationen fragt:

### Teil 1: Lieferantensuche

**Standardsuchraum:** Deutschland + angrenzende Nachbarländer (Österreich, Schweiz, Tschechien, Polen, Niederlande, Belgien, Frankreich)

**Aufgaben:**
1. Führe eine umfassende Online-Recherche durch
2. Verwende ausschließlich seriöse, öffentliche Quellen
3. Für jeden Lieferanten erhebe:
   - Firmenname
   - Land und exakter Standort
   - Unternehmensart (Hersteller, Händler, etc.)
   - Produktsortiment
   - Unternehmensgröße
   - Mitarbeiterzahl (falls verfügbar)
   - Besitzstruktur
   - Weitere Standorte
   - Zertifizierungen
   - Website

### Teil 2: Lieferantenbewertung

**Bewertungskriterien:**
- Qualität & Produktspezifikationen (40%)
- Lieferfähigkeit & Supply-Chain-Stabilität (30%)
- Nachhaltigkeit & ESG-Konformität (20%)
- Risikomanagement & Compliance (10%)

**Frameworks einbinden:**
- ISO 9001, ISO 14001
- FSC/PEFC (falls relevant)
- EcoVadis, SEDEX
- Deutsches LkSG
- REACH/CLP

### Output-Format

Nutze web_search und code_interpreter um:
1. Lieferanten zu recherchieren
2. Daten zu strukturieren
3. Bewertungen zu berechnen

Gib die Ergebnisse in einem strukturierten JSON-Format zurück:
- type: "supplier_search" oder "analysis"
- suppliers: Array mit allen gefundenen Lieferanten
- evaluationCriteria: Bewertungssystem
- scoringSystem: Punkteskala (0-100)
- summary: Zusammenfassung

**WICHTIG:**
- Nutze AUSSCHLIESSLICH öffentlich verfügbare, verifizierbare Informationen
- Wenn Daten nicht verfügbar sind, markiere mit "k. A."
- Sei präzise und faktentreu
- Sortiere Lieferanten nach Relevanz/Qualität`
  }

  /**
   * Main workflow orchestration
   */
  async processQuery(userQuery, contextData = {}) {
    if (!this.isEnabled()) {
      throw new Error('OpenAI Agent Service not available')
    }

    try {
      console.log('🚀 Starting multi-agent workflow for query:', userQuery)

      // Step 1: Query Rewriting
      console.log('📝 Step 1: Rewriting query...')
      const rewriteRunner = new Runner({ agent: this.agents.queryRewrite })
      const rewrittenQuery = await rewriteRunner.run({
        messages: [{ role: 'user', content: userQuery }]
      })
      const refinedQuery = rewrittenQuery.messages[rewrittenQuery.messages.length - 1].content
      console.log('✅ Refined query:', refinedQuery)

      // Step 2: Classification
      console.log('🔍 Step 2: Classifying query...')
      const classifyRunner = new Runner({ agent: this.agents.classify })
      const classification = await classifyRunner.run({
        messages: [{ role: 'user', content: refinedQuery }]
      })
      const classResult = classification.messages[classification.messages.length - 1].content
      const isQA = classResult.includes('QA')
      console.log('✅ Classification:', isQA ? 'Q&A (Internal)' : 'Fact-Finding (External)')

      // Step 3: Route to appropriate agent
      let finalResponse

      if (isQA) {
        // Internal Q&A path
        console.log('📚 Step 3: Running Internal Q&A Agent...')

        // Add context data to the query if available
        let enhancedQuery = refinedQuery
        if (contextData.suppliers || contextData.products) {
          enhancedQuery = this.enhanceQueryWithContext(refinedQuery, contextData)
        }

        const qaRunner = new Runner({ agent: this.agents.internalQA })
        finalResponse = await qaRunner.run({
          messages: [{ role: 'user', content: enhancedQuery }]
        })
      } else {
        // External fact-finding path
        console.log('🌐 Step 3: Running External Fact-Finding Agent...')
        const factRunner = new Runner({ agent: this.agents.externalFactFinding })
        finalResponse = await factRunner.run({
          messages: [{ role: 'user', content: refinedQuery }]
        })
      }

      // Extract the final response
      const responseContent = finalResponse.messages[finalResponse.messages.length - 1].content
      console.log('✅ Agent workflow completed')

      // Parse response if it's JSON
      try {
        const parsedResponse = typeof responseContent === 'string'
          ? JSON.parse(responseContent)
          : responseContent

        // Validate response for hallucinations (only for Q&A)
        if (isQA && contextData.suppliers) {
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

        return parsedResponse

      } catch (parseError) {
        console.warn('⚠️ Response is not JSON, returning as-is:', parseError.message)
        return {
          type: 'analysis',
          title: 'Antwort',
          analysis: responseContent,
          keyFindings: []
        }
      }

    } catch (error) {
      console.error('❌ Agent workflow error:', error)

      // Fallback to fallback agent
      console.log('🔄 Attempting fallback agent...')
      try {
        const fallbackRunner = new Runner({ agent: this.agents.fallback })
        const fallbackResponse = await fallbackRunner.run({
          messages: [
            { role: 'user', content: userQuery },
            { role: 'system', content: `Original error: ${error.message}` }
          ]
        })

        const fallbackContent = fallbackResponse.messages[fallbackResponse.messages.length - 1].content
        return typeof fallbackContent === 'string' ? JSON.parse(fallbackContent) : fallbackContent

      } catch (fallbackError) {
        console.error('❌ Fallback agent also failed:', fallbackError)
        return {
          type: 'clarification',
          message: 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut oder formuliere deine Frage anders.',
          suggestions: [
            'Welche Malze haben wir im Dashboard?',
            'Zeige mir alle Lieferanten',
            'Suche nach Lieferanten für [Produkt]'
          ]
        }
      }
    }
  }

  /**
   * Enhance query with context data (for internal Q&A)
   */
  enhanceQueryWithContext(query, contextData) {
    const { suppliers, products, esgData } = contextData

    let enhancement = query + '\n\n**VERFÜGBARE DATEN:**\n'

    // Add supplier names
    if (suppliers && suppliers.length > 0) {
      const supplierNames = suppliers.map(s => s.name).join(', ')
      enhancement += `\nVerfügbare Lieferanten: ${supplierNames}`
    }

    // Add product count
    if (products) {
      let totalProducts = 0
      for (const supplierData of Object.values(products)) {
        if (supplierData.categories) {
          for (const prods of Object.values(supplierData.categories)) {
            totalProducts += prods.length
          }
        }
      }
      enhancement += `\nVerfügbare Produkte: ${totalProducts}`
    }

    // Add ESG data availability
    if (esgData && esgData.suppliers) {
      enhancement += `\nESG-Daten verfügbar für: ${Object.keys(esgData.suppliers).length} Lieferanten`
    }

    return enhancement
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

    // Extract potential supplier names from response
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
   * Detect if query is about non-malt supplier search (legacy compatibility)
   */
  isSupplierSearchQuery(query) {
    const normalizedQuery = query.toLowerCase()

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

    const maltKeywords = ['malz', 'gerste', 'weizen', 'röstmalz', 'pilsner', 'karamell']
    const isMaltRelated = maltKeywords.some(kw => normalizedQuery.includes(kw))
    const hasSupplierKeywords = supplierSearchKeywords.some(kw => normalizedQuery.includes(kw))

    return hasSupplierKeywords && !isMaltRelated
  }
}

// Export singleton instance
export const openaiService = new OpenAIAgentService()
