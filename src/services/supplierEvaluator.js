/**
 * Supplier Evaluator Service
 * Handles LLM-based supplier assessment using Claude API
 */

import { openaiService } from './openaiService'

/**
 * Build the standardized evaluation prompt
 * @param {string} supplierName - Name of the supplier to evaluate
 * @returns {string} Complete prompt for LLM
 */
export function buildSupplierPrompt(supplierName) {
  return `Du bist ein Assistent zur standardisierten Bewertung von Lieferanten in der Lebensmittel- und Getränkeindustrie (z. B. für eine Brauerei wie Paulaner).

Aufgabe:
Analysiere den Lieferanten **${supplierName}** auf Basis öffentlich verfügbarer Informationen (Unternehmenswebsite, Presse, Register, Bewertungsportale etc.) und erstelle ein kompaktes, vergleichbares Profil.

WICHTIG:
- Antworte AUSSCHLIESSLICH im folgenden JSON-Format.
- Schreibe kurz und prägnant, keine Fließtexte außerhalb der JSON-Struktur.
- Falls Informationen in einem Bereich kaum verfügbar sind, gib trotzdem eine vorsichtige Einschätzung ab und erwähne die Unsicherheit kurz in der Begründung.

Zwingendes Ausgabeformat (EXAKT so, nur mit gefüllten Werten):

{
  "lieferant": "${supplierName}",
  "kurzprofil": "1–2 Sätze, wer der Lieferant ist und wie er grob einzuschätzen ist.",
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
    "finanzielle_stabilitaet": "Max. 1 Satz, warum dieser Score.",
    "produktqualitaet_zertifizierungen": "Max. 1 Satz, warum dieser Score.",
    "mitarbeiterzufriedenheit_struktur": "Max. 1 Satz, warum dieser Score."
  },
  "staerken": [
    "Stärke 1 (max. 1 Satz)",
    "Stärke 2 (max. 1 Satz)",
    "Stärke 3 (max. 1 Satz)"
  ],
  "risiken": [
    "Risiko 1 (max. 1 Satz)",
    "Risiko 2 (max. 1 Satz)",
    "Risiko 3 (max. 1 Satz)"
  ]
}

Regeln zur Bewertung:
- Nutze eine 0–10-Skala je Kategorie (10 = exzellent, 0 = sehr schlecht / starkes Risiko).
- Berechne gesamt_score als Durchschnitt aller 8 Scores × 10 und mathematisch korrekt runden.
- Mapping für "einstufung":
  - 80–100 → "sehr_gut_geeignet"
  - 60–79 → "gut_geeignet"
  - 40–59 → "eingeschraenkt_geeignet"
  - 0–39 → "nicht_geeignet"

Antworte NUR mit dem JSON, ohne zusätzlichen Text davor oder danach.`
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
 * Evaluate a supplier using Claude API
 * @param {string} supplierName - Name of the supplier to evaluate
 * @returns {Promise<Object>} Supplier evaluation profile
 */
export async function evaluateSupplier(supplierName) {
  if (!supplierName || supplierName.trim() === '') {
    throw new Error('Supplier name is required')
  }

  try {
    // TODO: Replace with real Claude API call when ready
    // For now, use mock data for development/testing

    const USE_MOCK = true // Set to false when Claude API is configured

    if (USE_MOCK) {
      console.log('🔧 Using mock evaluation for:', supplierName)
      return await generateMockEvaluation(supplierName)
    }

    // Real implementation (currently disabled):
    /*
    const prompt = buildSupplierPrompt(supplierName)

    const response = await openaiService.client.chat.completions.create({
      model: 'claude-3-5-sonnet-20241022', // or your preferred model
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })

    const evaluationText = response.choices[0].message.content
    const evaluation = JSON.parse(evaluationText)

    // Validate the response structure
    if (!evaluation.lieferant || !evaluation.scores || !evaluation.gesamt_score) {
      throw new Error('Invalid evaluation format received from LLM')
    }

    return evaluation
    */

    // For now, return mock
    return await generateMockEvaluation(supplierName)

  } catch (error) {
    console.error('Error evaluating supplier:', error)
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
