/**
 * Supplier Data Structures and Mock Data
 * Defines the data model for suppliers and provides sample data
 */

/**
 * Supplier Data Structure
 * @typedef {Object} Supplier
 * @property {string} id - Unique identifier
 * @property {string} name - Company name
 * @property {string} description - Brief description
 * @property {string} category - Business category
 * @property {Object} contact - Contact information
 * @property {Object} location - Location details
 * @property {Array<string>} certifications - List of certifications
 * @property {Object} performance - Performance metrics
 * @property {Object} compliance - Compliance status
 * @property {Array<Object>} ratings - Historical ratings
 * @property {Array<string>} products - Products/services offered
 * @property {Object} esg - ESG (Environmental, Social, Governance) data
 * @property {Array<Object>} documents - Related documents
 */

/**
 * Mock Supplier Data
 * Realistic sample data for testing and development
 */
export const mockSuppliers = [
  {
    id: 'SUP-001',
    name: 'Hopfen Schmidt GmbH',
    description: 'Führender Lieferant für Premium-Hopfen aus der Hallertau',
    category: 'Rohstoffe - Hopfen',
    contact: {
      email: 'info@hopfen-schmidt.de',
      phone: '+49 8442 123456',
      website: 'www.hopfen-schmidt.de',
      person: 'Johann Schmidt',
      position: 'Geschäftsführer'
    },
    location: {
      street: 'Hopfenweg 12',
      city: 'Wolnzach',
      postalCode: '85283',
      country: 'Deutschland',
      region: 'Bayern'
    },
    certifications: [
      'Bio-Zertifizierung',
      'ISO 9001',
      'GlobalG.A.P.',
      'QS-Zertifikat'
    ],
    performance: {
      averageDeliveryTime: 2.5, // days
      onTimeDeliveryRate: 98.5, // percentage
      defectRate: 0.5, // percentage
      responseTime: 4, // hours
      flexibilityScore: 9.2, // out of 10
      innovationScore: 8.5 // out of 10
    },
    compliance: {
      status: 'compliant',
      lastAudit: '2024-09-15',
      violations: [],
      humanRights: true,
      environmentalStandards: true,
      laborStandards: true
    },
    ratings: [
      {
        date: '2024-10-15',
        overallScore: 9.2,
        categories: {
          quality: 9.5,
          delivery: 9.0,
          cost: 8.5,
          reliability: 9.5,
          innovation: 8.8,
          communication: 9.2,
          esg: 9.3
        },
        comment: 'Ausgezeichnete Qualität und Zuverlässigkeit'
      },
      {
        date: '2024-07-20',
        overallScore: 9.0,
        categories: {
          quality: 9.3,
          delivery: 8.8,
          cost: 8.7,
          reliability: 9.2,
          innovation: 8.5,
          communication: 9.0,
          esg: 9.1
        },
        comment: 'Sehr zufrieden mit der Zusammenarbeit'
      }
    ],
    products: [
      'Aromahopfen',
      'Bitterhopfen',
      'Bio-Hopfen',
      'Hopfenpellets',
      'Hopfenextrakt'
    ],
    esg: {
      environmental: {
        carbonFootprint: 'Niedrig',
        waterUsage: 'Effizient',
        wasteManagement: 'Vorbildlich',
        renewableEnergy: 85 // percentage
      },
      social: {
        fairWages: true,
        workingConditions: 'Gut',
        employeeTraining: true,
        diversityScore: 8.5
      },
      governance: {
        transparency: 'Hoch',
        ethicalBusiness: true,
        antiCorruption: true,
        dataProtection: true
      }
    },
    documents: [
      {
        name: 'Qualitätszertifikat 2024',
        type: 'certificate',
        url: '/documents/hopfen-schmidt-quality-2024.pdf',
        date: '2024-01-15'
      },
      {
        name: 'ESG-Bericht 2023',
        type: 'esg-report',
        url: '/documents/hopfen-schmidt-esg-2023.pdf',
        date: '2024-02-01'
      }
    ],
    addedDate: '2020-03-15',
    lastUpdated: '2024-10-20'
  },
  {
    id: 'SUP-002',
    name: 'Malz Weber AG',
    description: 'Traditionsreiche Mälzerei mit internationaler Reichweite',
    category: 'Rohstoffe - Malz',
    contact: {
      email: 'kontakt@malz-weber.de',
      phone: '+49 911 234567',
      website: 'www.malz-weber.de',
      person: 'Dr. Maria Weber',
      position: 'Vertriebsleiterin'
    },
    location: {
      street: 'Industriestraße 45',
      city: 'Nürnberg',
      postalCode: '90451',
      country: 'Deutschland',
      region: 'Bayern'
    },
    certifications: [
      'ISO 9001',
      'FSSC 22000',
      'Bio-Zertifizierung',
      'Kosher'
    ],
    performance: {
      averageDeliveryTime: 3.0,
      onTimeDeliveryRate: 96.0,
      defectRate: 0.8,
      responseTime: 6,
      flexibilityScore: 8.5,
      innovationScore: 9.0
    },
    compliance: {
      status: 'compliant',
      lastAudit: '2024-08-10',
      violations: [],
      humanRights: true,
      environmentalStandards: true,
      laborStandards: true
    },
    ratings: [
      {
        date: '2024-09-30',
        overallScore: 8.8,
        categories: {
          quality: 9.0,
          delivery: 8.5,
          cost: 9.0,
          reliability: 9.0,
          innovation: 9.2,
          communication: 8.7,
          esg: 8.5
        },
        comment: 'Gute Produktqualität, innovative Ansätze'
      }
    ],
    products: [
      'Pilsner Malz',
      'Münchner Malz',
      'Weizenmalz',
      'Karamellmalz',
      'Röstmalz'
    ],
    esg: {
      environmental: {
        carbonFootprint: 'Mittel',
        waterUsage: 'Gut',
        wasteManagement: 'Gut',
        renewableEnergy: 65
      },
      social: {
        fairWages: true,
        workingConditions: 'Sehr gut',
        employeeTraining: true,
        diversityScore: 7.8
      },
      governance: {
        transparency: 'Hoch',
        ethicalBusiness: true,
        antiCorruption: true,
        dataProtection: true
      }
    },
    documents: [
      {
        name: 'Analysenzertifikat Q3 2024',
        type: 'certificate',
        url: '/documents/malz-weber-analysis-q3-2024.pdf',
        date: '2024-09-15'
      }
    ],
    addedDate: '2018-06-20',
    lastUpdated: '2024-10-15'
  },
  {
    id: 'SUP-003',
    name: 'Verpackungen Müller KG',
    description: 'Spezialist für nachhaltige Getränkeverpackungen',
    category: 'Verpackung',
    contact: {
      email: 'service@verpackungen-mueller.de',
      phone: '+49 89 345678',
      website: 'www.verpackungen-mueller.de',
      person: 'Thomas Müller',
      position: 'Kundenbetreuung'
    },
    location: {
      street: 'Gewerbepark 7',
      city: 'München',
      postalCode: '81249',
      country: 'Deutschland',
      region: 'Bayern'
    },
    certifications: [
      'FSC',
      'ISO 14001',
      'Blauer Engel'
    ],
    performance: {
      averageDeliveryTime: 5.0,
      onTimeDeliveryRate: 92.0,
      defectRate: 1.2,
      responseTime: 8,
      flexibilityScore: 7.5,
      innovationScore: 8.0
    },
    compliance: {
      status: 'minor-violation',
      lastAudit: '2024-06-20',
      violations: [
        {
          type: 'Lieferverzug',
          date: '2024-08-15',
          severity: 'niedrig',
          resolved: true,
          description: 'Einmalige Verzögerung aufgrund von Lieferengpass'
        }
      ],
      humanRights: true,
      environmentalStandards: true,
      laborStandards: true
    },
    ratings: [
      {
        date: '2024-08-25',
        overallScore: 7.8,
        categories: {
          quality: 8.0,
          delivery: 7.0,
          cost: 8.5,
          reliability: 7.5,
          innovation: 8.2,
          communication: 7.8,
          esg: 8.8
        },
        comment: 'Nachhaltige Lösungen, aber Liefertreue verbesserungswürdig'
      }
    ],
    products: [
      'Glasflaschen',
      'Etiketten',
      'Kartonverpackungen',
      'Mehrwegkästen',
      'Verschlüsse'
    ],
    esg: {
      environmental: {
        carbonFootprint: 'Niedrig',
        waterUsage: 'Effizient',
        wasteManagement: 'Vorbildlich',
        renewableEnergy: 90
      },
      social: {
        fairWages: true,
        workingConditions: 'Gut',
        employeeTraining: true,
        diversityScore: 8.0
      },
      governance: {
        transparency: 'Mittel',
        ethicalBusiness: true,
        antiCorruption: true,
        dataProtection: true
      }
    },
    documents: [
      {
        name: 'FSC-Zertifikat',
        type: 'certificate',
        url: '/documents/verpackungen-mueller-fsc.pdf',
        date: '2024-01-10'
      },
      {
        name: 'Nachhaltigkeitsbericht 2023',
        type: 'esg-report',
        url: '/documents/verpackungen-mueller-sustainability-2023.pdf',
        date: '2024-03-01'
      }
    ],
    addedDate: '2019-11-05',
    lastUpdated: '2024-09-30'
  },
  {
    id: 'SUP-004',
    name: 'Logistik Express GmbH',
    description: 'Zuverlässiger Logistikpartner für temperaturgeführte Transporte',
    category: 'Logistik',
    contact: {
      email: 'info@logistik-express.de',
      phone: '+49 89 456789',
      website: 'www.logistik-express.de',
      person: 'Stefan Meyer',
      position: 'Account Manager'
    },
    location: {
      street: 'Logistikzentrum 1',
      city: 'München',
      postalCode: '85356',
      country: 'Deutschland',
      region: 'Bayern'
    },
    certifications: [
      'ISO 9001',
      'GDP (Good Distribution Practice)',
      'AEO (Authorized Economic Operator)'
    ],
    performance: {
      averageDeliveryTime: 1.5,
      onTimeDeliveryRate: 99.2,
      defectRate: 0.2,
      responseTime: 2,
      flexibilityScore: 9.5,
      innovationScore: 8.8
    },
    compliance: {
      status: 'compliant',
      lastAudit: '2024-10-01',
      violations: [],
      humanRights: true,
      environmentalStandards: true,
      laborStandards: true
    },
    ratings: [
      {
        date: '2024-10-10',
        overallScore: 9.5,
        categories: {
          quality: 9.5,
          delivery: 9.8,
          cost: 8.8,
          reliability: 9.7,
          innovation: 9.0,
          communication: 9.5,
          esg: 8.9
        },
        comment: 'Hervorragende Zuverlässigkeit und Service'
      }
    ],
    products: [
      'Kühllogistik',
      'Standardtransport',
      'Expresslieferung',
      'Lagerung',
      'Tracking-System'
    ],
    esg: {
      environmental: {
        carbonFootprint: 'Mittel',
        waterUsage: 'Gut',
        wasteManagement: 'Gut',
        renewableEnergy: 45
      },
      social: {
        fairWages: true,
        workingConditions: 'Sehr gut',
        employeeTraining: true,
        diversityScore: 8.3
      },
      governance: {
        transparency: 'Sehr hoch',
        ethicalBusiness: true,
        antiCorruption: true,
        dataProtection: true
      }
    },
    documents: [
      {
        name: 'GDP-Zertifikat',
        type: 'certificate',
        url: '/documents/logistik-express-gdp.pdf',
        date: '2024-05-01'
      }
    ],
    addedDate: '2021-02-10',
    lastUpdated: '2024-10-25'
  },
  {
    id: 'SUP-005',
    name: 'Tech Solutions International',
    description: 'IT-Dienstleister für Brauereiautomation und digitale Lösungen',
    category: 'IT & Technologie',
    contact: {
      email: 'contact@techsolutions-int.com',
      phone: '+49 89 567890',
      website: 'www.techsolutions-int.com',
      person: 'Dr. Anna Schneider',
      position: 'Sales Director DACH'
    },
    location: {
      street: 'Innovation Campus 23',
      city: 'München',
      postalCode: '80807',
      country: 'Deutschland',
      region: 'Bayern'
    },
    certifications: [
      'ISO 27001',
      'ISO 9001',
      'TISAX'
    ],
    performance: {
      averageDeliveryTime: 15.0, // project days
      onTimeDeliveryRate: 88.0,
      defectRate: 2.5,
      responseTime: 12,
      flexibilityScore: 7.8,
      innovationScore: 9.5
    },
    compliance: {
      status: 'under-review',
      lastAudit: '2024-07-15',
      violations: [
        {
          type: 'Datenschutz-Vorfall',
          date: '2024-06-10',
          severity: 'mittel',
          resolved: false,
          description: 'Unzureichende Verschlüsselung bei Datenübertragung festgestellt, Maßnahmen eingeleitet'
        }
      ],
      humanRights: true,
      environmentalStandards: true,
      laborStandards: true
    },
    ratings: [
      {
        date: '2024-07-30',
        overallScore: 8.2,
        categories: {
          quality: 8.5,
          delivery: 7.5,
          cost: 7.8,
          reliability: 8.0,
          innovation: 9.5,
          communication: 8.5,
          esg: 7.8
        },
        comment: 'Sehr innovativ, aber Projektmanagement könnte besser sein'
      }
    ],
    products: [
      'Brauereiautomation',
      'ERP-Integration',
      'IoT-Sensoren',
      'Datenanalyse',
      'Cloud-Lösungen'
    ],
    esg: {
      environmental: {
        carbonFootprint: 'Niedrig',
        waterUsage: 'Nicht relevant',
        wasteManagement: 'Gut',
        renewableEnergy: 100
      },
      social: {
        fairWages: true,
        workingConditions: 'Sehr gut',
        employeeTraining: true,
        diversityScore: 9.0
      },
      governance: {
        transparency: 'Hoch',
        ethicalBusiness: true,
        antiCorruption: true,
        dataProtection: false // Currently under review
      }
    },
    documents: [
      {
        name: 'ISO 27001 Zertifikat',
        type: 'certificate',
        url: '/documents/tech-solutions-iso27001.pdf',
        date: '2024-01-20'
      },
      {
        name: 'Datenschutz-Audit Bericht',
        type: 'audit-report',
        url: '/documents/tech-solutions-privacy-audit.pdf',
        date: '2024-07-15'
      }
    ],
    addedDate: '2022-01-15',
    lastUpdated: '2024-10-18'
  }
]

/**
 * Get all suppliers
 * @returns {Array<Supplier>} Array of all suppliers
 */
export const getAllSuppliers = () => {
  return [...mockSuppliers]
}

/**
 * Get supplier by ID
 * @param {string} id - Supplier ID
 * @returns {Supplier|null} Supplier object or null if not found
 */
export const getSupplierById = (id) => {
  return mockSuppliers.find(supplier => supplier.id === id) || null
}

/**
 * Get suppliers by category
 * @param {string} category - Category name
 * @returns {Array<Supplier>} Array of suppliers in the category
 */
export const getSuppliersByCategory = (category) => {
  return mockSuppliers.filter(supplier => supplier.category === category)
}

/**
 * Get all unique categories
 * @returns {Array<string>} Array of category names
 */
export const getAllCategories = () => {
  return [...new Set(mockSuppliers.map(supplier => supplier.category))]
}

/**
 * Get all unique regions
 * @returns {Array<string>} Array of region names
 */
export const getAllRegions = () => {
  return [...new Set(mockSuppliers.map(supplier => supplier.location.region))]
}
