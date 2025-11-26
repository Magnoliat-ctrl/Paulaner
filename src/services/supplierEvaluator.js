/**
 * Supplier Evaluator Service
 * Handles LLM-based supplier assessment using OpenAI GPT-4o
 */

import { openaiService } from './openaiService'
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
- Produkte: ${supplier.products?.slice(0, 5).join(', ')}...
- Zertifizierungen: ${supplier.certifications?.join(', ')}
- Performance: Liefertreue ${supplier.performance?.onTimeDeliveryRate}%, Qualität ${supplier.performance?.qualityRating || 'k.A.'}/10
- Compliance-Status: ${supplier.compliance?.status}
- ESG: Erneuerbare Energie ${supplier.esg?.environmental?.renewableEnergy}%
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

  return `Du bist ein Assistent zur standardisierten Bewertung von Lieferanten in der Lebensmittel- und Getränkeindustrie (z. B. für eine Brauerei wie Paulaner).

Aufgabe:
Analysiere den Lieferanten **${supplierName}** und erstelle ein kompaktes, vergleichbares Profil.

${contextSection}

KRITISCHE REGELN GEGEN HALLUZINATIONEN:
1. Nutze AUSSCHLIESSLICH die oben bereitgestellten verifizierten Daten
2. Erfinde KEINE Informationen, die nicht in den Daten stehen
3. Wenn Daten fehlen: Bewerte vorsichtig und erwähne die Unsicherheit
4. KEINE erfundenen Finanzdaten, Mitarbeiterzahlen oder Details
5. Sei ehrlich über Datenlücken

WICHTIG:
- Antworte AUSSCHLIESSLICH im folgenden JSON-Format
- Schreibe kurz und prägnant, keine Fließtexte außerhalb der JSON-Struktur
- Bei fehlenden Informationen: Gib 5-7/10 und erwähne "Begrenzte Daten verfügbar"

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
 * Evaluate a supplier using OpenAI GPT-4o
 * @param {string} supplierName - Name of the supplier to evaluate
 * @returns {Promise<Object>} Supplier evaluation profile
 */
export async function evaluateSupplier(supplierName) {
  if (!supplierName || supplierName.trim() === '') {
    throw new Error('Supplier name is required')
  }

  try {
    // Check if OpenAI service is available
    if (!openaiService.isEnabled()) {
      console.warn('⚠️ OpenAI API not configured, using mock data')
      return await generateMockEvaluation(supplierName)
    }

    console.log('🤖 Evaluating supplier with GPT-4o:', supplierName)

    // Check if we have verified data for this supplier
    const knownData = getKnownSupplierData(supplierName)
    if (knownData) {
      console.log('✅ Found verified data for:', knownData.name)
    } else {
      console.warn('⚠️ No verified data found for:', supplierName)
    }

    // Build prompt with context
    const prompt = buildSupplierPrompt(supplierName, knownData)

    // Call OpenAI API with GPT-4o (highest quality model available)
    const response = await openaiService.client.chat.completions.create({
      model: 'gpt-4o', // Latest GPT-4o model (note: gpt-5.1 doesn't exist)
      messages: [
        {
          role: 'system',
          content: 'Du bist ein präziser Analyst. Antworte NUR mit validem JSON. Erfinde KEINE Daten.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Ultra-low temperature for maximum factual accuracy
      top_p: 0.2, // Focused sampling for most likely tokens only
      max_tokens: 4000, // Increased for detailed evaluations
      response_format: { type: 'json_object' } // Enforce JSON output
    })

    const evaluationText = response.choices[0].message.content
    console.log('📊 Received evaluation:', evaluationText.substring(0, 100) + '...')

    const evaluation = JSON.parse(evaluationText)

    // Validate the response structure
    if (!evaluation.lieferant || !evaluation.scores || !evaluation.gesamt_score) {
      throw new Error('Invalid evaluation format received from GPT-4o')
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
    if (error.message.includes('API key')) {
      throw new Error('OpenAI API Key nicht konfiguriert. Bitte .env Datei prüfen.')
    } else if (error.message.includes('rate limit')) {
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
