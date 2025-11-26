/**
 * Supplier Evaluation Type Definitions
 * Defines the structure for LLM-based supplier assessments
 */

/**
 * @typedef {Object} SupplierScores
 * @property {number} unternehmensbasis_seriositaet - 0-10 scale
 * @property {number} finanzielle_stabilitaet - 0-10 scale
 * @property {number} zuverlaessigkeit_lieferant - 0-10 scale
 * @property {number} produktqualitaet_zertifizierungen - 0-10 scale
 * @property {number} mitarbeiterzufriedenheit_struktur - 0-10 scale
 * @property {number} nachhaltigkeit_esg_compliance - 0-10 scale
 * @property {number} reputation_medienlage - 0-10 scale
 * @property {number} marktposition_zukunftsfaehigkeit - 0-10 scale
 */

/**
 * @typedef {Object} ShortJustifications
 * @property {string} finanzielle_stabilitaet - Max 1 sentence
 * @property {string} produktqualitaet_zertifizierungen - Max 1 sentence
 * @property {string} mitarbeiterzufriedenheit_struktur - Max 1 sentence
 */

/**
 * @typedef {'nicht_geeignet'|'eingeschraenkt_geeignet'|'gut_geeignet'|'sehr_gut_geeignet'} SupplierClassification
 */

/**
 * @typedef {Object} SupplierProfile
 * @property {string} lieferant - Company name
 * @property {string} kurzprofil - 1-2 sentence overview
 * @property {SupplierScores} scores - All category scores
 * @property {number} gesamt_score - Overall score 0-100
 * @property {SupplierClassification} einstufung - Classification
 * @property {ShortJustifications} kuerze_begruendungen - Brief justifications
 * @property {string[]} staerken - Max 3 strengths, each max 1 sentence
 * @property {string[]} risiken - Max 3 risks, each max 1 sentence
 */

/**
 * Human-readable category names mapping
 */
export const CATEGORY_LABELS = {
  unternehmensbasis_seriositaet: 'Unternehmensbasis & Seriosität',
  finanzielle_stabilitaet: 'Finanzielle Stabilität',
  zuverlaessigkeit_lieferant: 'Zuverlässigkeit als Lieferant',
  produktqualitaet_zertifizierungen: 'Produktqualität & Zertifizierungen',
  mitarbeiterzufriedenheit_struktur: 'Mitarbeiterzufriedenheit & Struktur',
  nachhaltigkeit_esg_compliance: 'Nachhaltigkeit & ESG / Compliance',
  reputation_medienlage: 'Reputation & Medienlage',
  marktposition_zukunftsfaehigkeit: 'Marktposition & Zukunftsfähigkeit'
}

/**
 * Classification badge colors
 */
export const CLASSIFICATION_CONFIG = {
  sehr_gut_geeignet: {
    label: 'Sehr gut geeignet',
    color: '#28A745',
    bgColor: '#D4EDDA',
    icon: '✓'
  },
  gut_geeignet: {
    label: 'Gut geeignet',
    color: '#17A2B8',
    bgColor: '#D1ECF1',
    icon: '✓'
  },
  eingeschraenkt_geeignet: {
    label: 'Eingeschränkt geeignet',
    color: '#FFC107',
    bgColor: '#FFF3CD',
    icon: '⚠'
  },
  nicht_geeignet: {
    label: 'Nicht geeignet',
    color: '#DC3545',
    bgColor: '#F8D7DA',
    icon: '✗'
  }
}

// Export for use in other modules
export default {
  CATEGORY_LABELS,
  CLASSIFICATION_CONFIG
}
