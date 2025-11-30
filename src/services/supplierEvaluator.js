/**
 * Supplier Evaluator Service
 * Handles LLM-based supplier assessment using Grok (xAI)
 */

import { grokService } from './grokService'
import { dataService } from './dataService'
import maltSuppliers from '../data/maltSuppliers.json'
import additionalSuppliers from '../data/additionalSuppliers.json'

/**
 * Get known supplier data if available
 * @param {string} supplierName - Name of the supplier
 * @returns {Object|null} Supplier data or null
 */
function getKnownSupplierData(supplierName) {
  const allSuppliers = [...maltSuppliers, ...additionalSuppliers]
  const normalized = supplierName.toLowerCase().trim()

  return allSuppliers.find(s =>
    s.name.toLowerCase().includes(normalized) ||
    normalized.includes(s.name.toLowerCase())
  )
}

/**
 * Build context from known supplier data
 * @param {Object} supplier - Supplier object
 * @returns {string} Formatted context
 */
function buildSupplierContext(supplier) {
  if (!supplier) return ''

  return `
VERFÜGBARE DATEN FÜR ${supplier.name}:
- Beschreibung: ${supplier.description}
- Kategorie: ${supplier.category}
- Standorte: ${supplier.locations?.map(l => `${l.city}, ${l.country}`).join('; ')}
- Anzahl Standorte: ${supplier.locations?.length || 1}
- Produkte: ${supplier.products?.slice(0, 5).join(', ')}... (${supplier.products?.length || 0} gesamt)
- Zertifizierungen: ${supplier.certifications?.join(', ')}
- ESG-Scores: Environmental ${supplier.esg?.environmental?.score}/10, Social ${supplier.esg?.social?.score}/10, Governance ${supplier.esg?.governance?.score}/10
- Bewertungen: Durchschnitt ${supplier.ratings?.[0]?.overallScore || 'k.A.'}/10

NUTZE NUR DIESE VERIFIZIERTEN DATEN. Erfinde NICHTS hinzu.`
}

/**
 * Build the standardized evaluation prompt
 * @param {string} supplierName - Name of the supplier to evaluate
 * @param {Object|null} knownData - Known supplier data if available
 * @returns {string} Complete prompt for LLM
 */
export function buildSupplierPrompt(supplierName, knownData = null) {
  const contextSection = knownData ? buildSupplierContext(knownData) : ''

  return `Du bist ein erfahrener strategischer und technischer Einkäufer der Paulaner Brauerei Gruppe München mit fundierter Marktkenntnis der europäischen Rohstoff- und Vorproduktmärkte.

Deine Aufgabe: Umfassende Lieferantenbewertung für den Tender-Prozess

Zu bewertender Lieferant: **${supplierName}**

${contextSection}

BEWERTUNGSSYSTEM - 8 Kernkriterien (Gewichtung nach Tender-Relevanz):

1. **Unternehmensbasis & Seriosität** (15%)
   - Rechtsform, Handelsregistereintrag, Firmenhistorie
   - Unternehmensstruktur, Besitzverhältnisse
   - Öffentliche Reputation, Geschäftsführung
   Messung: Verfügbarkeit öffentlicher Firmendaten, Transparenz, Historie

2. **Finanzielle Stabilität** (15%)
   - Unternehmensgröße (Mitarbeiterzahl, geschätzter Umsatz)
   - Kapitalstruktur (wenn öffentlich verfügbar)
   - Finanzielle Risikoindikatoren
   Messung: Größenklasse (Kleinst/KMU/Mid-Cap/Large), öffentliche Bonitätsinformationen

3. **Zuverlässigkeit als Lieferant** (20%)
   - Geografische Nähe zu München (Deutschland + Nachbarländer bevorzugt)
   - Anzahl und Verteilung der Produktionsstandorte
   - Lieferkettenstruktur, Logistiknetz
   Messung: Standortanalyse, Lieferfähigkeit, Supply-Chain-Stabilität

4. **Produktqualität & Zertifizierungen** (20%)
   - Relevante Qualitätszertifikate (ISO 9001, branchenspezifisch)
   - Produktsortiment, Produktvarianten
   - Qualitätsnachweise, Normenkonformität
   Messung: Anzahl/Art der Zertifikate, Produktportfolio-Breite

5. **Mitarbeiterzufriedenheit & Struktur** (10%)
   - Mitarbeiterzahl, Personalstruktur
   - Öffentliche Arbeitgeberbewertungen (Kununu, Glassdoor)
   - Unternehmenskultur-Indikatoren
   Messung: Mitarbeiteranzahl, Bewertungsplattformen, Sozialstandards

6. **Nachhaltigkeit & ESG / Compliance** (10%)
   - Umweltzertifikate (ISO 14001, FSC/PEFC, etc.)
   - CO₂-Reporting, Nachhaltigkeitsberichte
   - LkSG-Konformität, Compliance-Vorfälle
   Messung: ESG-Zertifikate, öffentliche Nachhaltigkeitsdaten

7. **Reputation & Medienlage** (5%)
   - Pressemitteilungen, Medienberichte
   - Branchenrankings, Auszeichnungen
   - Negative Vorfälle (Skandale, Rechtsstreitigkeiten)
   Messung: Medienanalyse, öffentliche Wahrnehmung

8. **Marktposition & Zukunftsfähigkeit** (5%)
   - Marktstellung im Segment
   - Innovationskraft, Produktentwicklung
   - Wachstumstrends, Expansionspläne
   Messung: Marktanteil (geschätzt), Innovationsindikatoren

KRITISCHE REGELN GEGEN HALLUZINATIONEN:
1. Nutze AUSSCHLIESSLICH öffentlich verfügbare, verifizierbare Informationen
2. Bei verifizierten Daten (siehe oben): Nutze EXAKT diese Werte
3. Bei fehlenden Informationen: Gib realistische Mittelwerte (5-7/10) und kennzeichne Unsicherheit
4. KEINE erfundenen Finanzdaten, Mitarbeiterzahlen oder Zertifikate
5. Sei transparent über Datenlücken - erwähne diese in den Begründungen

DATENQUELLEN (nur verwenden, wenn öffentlich):
- Unternehmenswebsite, Impressum
- Handelsregister, Firmendatenbanken
- Zertifikatsregister (ISO, FSC, EPAL, etc.)
- Bewertungsplattformen (Kununu, Glassdoor)
- Pressemitteilungen, Nachrichtenportale
- Branchenportale, Lieferantenverzeichnisse

Ausgabeformat (EXAKT einhalten):

{
  "lieferant": "${supplierName}",
  "kurzprofil": "2-3 Sätze: Unternehmensart, Standort, Kerngeschäft, Größenordnung, Gesamteinschätzung für Tender",
  "scores": {
    "unternehmensbasis_seriositaet": ZAHL_0_BIS_10,
    "finanzielle_stabilitaet": ZAHL_0_BIS_10,
    "zuverlaessigkeit_lieferant": ZAHL_0_BIS_10,
    "produktqualitaet_zertifizierungen": ZAHL_0_BIS_10,
    "mitarbeiterzufriedenheit_struktur": ZAHL_0_BIS_10,
    "nachhaltigkeit_esg_compliance": ZAHL_0_BIS_10,
    "reputation_medienlage": ZAHL_0_BIS_10,
    "marktposition_zukunftsfaehigkeit": ZAHL_0_BIS_10
  },
  "gesamt_score": ZAHL_0_BIS_100,
  "einstufung": "nicht_geeignet | eingeschraenkt_geeignet | gut_geeignet | sehr_gut_geeignet",
  "kuerze_begruendungen": {
    "finanzielle_stabilitaet": "1 Satz: Begründung mit konkreten Fakten oder Hinweis auf fehlende Daten",
    "produktqualitaet_zertifizierungen": "1 Satz: Zertifikate/Normen oder Datenlage",
    "mitarbeiterzufriedenheit_struktur": "1 Satz: Mitarbeiterzahl/Bewertungen oder k.A."
  },
  "staerken": [
    "Stärke 1 mit konkretem Bezug",
    "Stärke 2 mit konkretem Bezug",
    "Stärke 3 mit konkretem Bezug"
  ],
  "risiken": [
    "Risiko 1 (faktisch oder 'Begrenzte Datenlage zu X')",
    "Risiko 2 (faktisch oder 'Keine öffentlichen Infos zu Y')",
    "Risiko 3 (faktisch oder potenzielle Schwachstelle)"
  ]
}

Bewertungslogik:
- Skala: 0-10 pro Kategorie (10 = exzellent, 0 = disqualifizierend)
- Gesamt-Score: Durchschnitt aller 8 Scores × 10, mathematisch gerundet
- Einstufung: 80-100 = sehr_gut_geeignet, 60-79 = gut_geeignet, 40-59 = eingeschraenkt_geeignet, 0-39 = nicht_geeignet

Antworte NUR mit dem JSON-Objekt, ohne Markdown-Codeblocks oder zusätzlichen Text.`
}

/**
 * Generate a mock evaluation for testing
 * @param {string} supplierName - Supplier name
 * @returns {Promise<Object>} Mock supplier profile
 */
async function generateMockEvaluation(supplierName) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Mock data based on supplier name
  const mockData = {
    lieferant: supplierName,
    kurzprofil: `${supplierName} ist ein etablierter Lieferant in der Lebensmittelindustrie mit solider Marktposition. Das Unternehmen zeigt gute Performance in den meisten Bereichen.`,
    scores: {
      unternehmensbasis_seriositaet: 8.5,
      finanzielle_stabilitaet: 7.8,
      zuverlaessigkeit_lieferant: 8.2,
      produktqualitaet_zertifizierungen: 8.9,
      mitarbeiterzufriedenheit_struktur: 7.5,
      nachhaltigkeit_esg_compliance: 7.2,
      reputation_medienlage: 8.0,
      marktposition_zukunftsfaehigkeit: 7.8
    },
    gesamt_score: 80,
    einstufung: 'sehr_gut_geeignet',
    kuerze_begruendungen: {
      finanzielle_stabilitaet: 'Solide Bilanz mit stabilen Umsätzen und moderater Verschuldung.',
      produktqualitaet_zertifizierungen: 'ISO 9001, HACCP und weitere relevante Zertifizierungen vorhanden.',
      mitarbeiterzufriedenheit_struktur: 'Durchschnittliche Bewertungen auf Kununu, aber keine gravierenden Probleme.'
    },
    staerken: [
      'Langjährige Erfahrung und etablierte Marktposition',
      'Umfassende Qualitätszertifizierungen und -kontrollen',
      'Zuverlässige Lieferperformance mit hoher Termintreue'
    ],
    risiken: [
      'Ausbaufähige ESG-Transparenz und Nachhaltigkeitsberichterstattung',
      'Mittlere Abhängigkeit von einzelnen Großkunden',
      'Begrenzte Informationen zur Mitarbeiterzufriedenheit verfügbar'
    ]
  }

  return mockData
}

/**
 * Evaluate a supplier using OpenAI GPT-4o
 * @param {string} supplierName - Name of the supplier to evaluate
 * @returns {Promise<Object>} Supplier evaluation profile
 */
export async function evaluateSupplier(supplierName) {
  if (!supplierName || supplierName.trim() === '') {
    throw new Error('Supplier name is required')
  }

  try {
    // Check if Grok service is available
    if (!grokService.isEnabled()) {
      console.warn('⚠️ Grok API not configured, using mock data')
      return await generateMockEvaluation(supplierName)
    }

    console.log('🤖 Evaluating supplier with Grok:', supplierName)

    // Check if we have verified data for this supplier
    const knownData = getKnownSupplierData(supplierName)
    if (knownData) {
      console.log('✅ Found verified data for:', knownData.name)
    } else {
      console.warn('⚠️ No verified data found for:', supplierName)
    }

    // Build prompt with context
    const prompt = buildSupplierPrompt(supplierName, knownData)

    // Call Grok API (xAI) with optimized parameters for comprehensive tender evaluation
    const response = await grokService.getClient().chat.completions.create({
      model: grokService.getModel(), // grok-beta (Note: gpt-5.1 doesn't exist)
      messages: [
        {
          role: 'system',
          content: 'Du bist ein hochintelligenter, detailorientierter Assistent für strategischen Einkauf. Antworte NUR mit validem JSON. Erfinde KEINE Daten - nutze ausschließlich öffentlich verfügbare Informationen.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Ultra-low for maximum factual accuracy
      max_tokens: 6000, // Increased for comprehensive tender evaluations
      response_format: { type: 'json_object' } // Enforce JSON output
    })

    const evaluationText = response.choices[0].message.content
    console.log('📊 Received evaluation:', evaluationText.substring(0, 100) + '...')

    const evaluation = JSON.parse(evaluationText)

    // Validate the response structure
    if (!evaluation.lieferant || !evaluation.scores || !evaluation.gesamt_score) {
      throw new Error('Invalid evaluation format received from Grok')
    }

    // Ensure all required fields exist
    const requiredScoreFields = [
      'unternehmensbasis_seriositaet',
      'finanzielle_stabilitaet',
      'zuverlaessigkeit_lieferant',
      'produktqualitaet_zertifizierungen',
      'mitarbeiterzufriedenheit_struktur',
      'nachhaltigkeit_esg_compliance',
      'reputation_medienlage',
      'marktposition_zukunftsfaehigkeit'
    ]

    for (const field of requiredScoreFields) {
      if (!(field in evaluation.scores)) {
        throw new Error(`Missing required score field: ${field}`)
      }
    }

    // Validate classification
    const validClassifications = [
      'nicht_geeignet',
      'eingeschraenkt_geeignet',
      'gut_geeignet',
      'sehr_gut_geeignet'
    ]
    if (!validClassifications.includes(evaluation.einstufung)) {
      throw new Error(`Invalid classification: ${evaluation.einstufung}`)
    }

    console.log('✅ Evaluation validated successfully')
    return evaluation

  } catch (error) {
    console.error('❌ Error evaluating supplier:', error)

    // If API fails, try to provide helpful error
    if (error.message.includes('API key') || error.message.includes('401')) {
      throw new Error('Grok API Key nicht konfiguriert oder ungültig. Bitte .env Datei prüfen.')
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      throw new Error('API Rate Limit erreicht. Bitte später erneut versuchen.')
    } else if (error.message.includes('Invalid')) {
      throw new Error('Ungültige Antwort vom LLM. Bitte erneut versuchen.')
    }

    throw new Error(`Fehler bei der Bewertung: ${error.message}`)
  }
}

/**
 * Save evaluation to localStorage
 * @param {Object} evaluation - Supplier evaluation to save
 */
export function saveEvaluation(evaluation) {
  try {
    const STORAGE_KEY = 'paulaner_supplier_evaluations'
    const stored = localStorage.getItem(STORAGE_KEY)
    const evaluations = stored ? JSON.parse(stored) : []

    // Add timestamp
    const evaluationWithMeta = {
      ...evaluation,
      timestamp: new Date().toISOString(),
      id: `EVAL-${Date.now()}`
    }

    // Add to beginning of array (most recent first)
    evaluations.unshift(evaluationWithMeta)

    // Keep only last 50 evaluations
    const trimmed = evaluations.slice(0, 50)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))

    console.log('✅ Evaluation saved:', evaluationWithMeta.id)
    return evaluationWithMeta
  } catch (error) {
    console.error('Error saving evaluation:', error)
  }
}

/**
 * Get all saved evaluations
 * @returns {Array} List of evaluations
 */
export function getSavedEvaluations() {
  try {
    const STORAGE_KEY = 'paulaner_supplier_evaluations'
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading evaluations:', error)
    return []
  }
}

/**
 * Clear all evaluations
 */
export function clearEvaluations() {
  const STORAGE_KEY = 'paulaner_supplier_evaluations'
  localStorage.removeItem(STORAGE_KEY)
  console.log('🗑️ All evaluations cleared')
}

export default {
  buildSupplierPrompt,
  evaluateSupplier,
  saveEvaluation,
  getSavedEvaluations,
  clearEvaluations
}
