# Wöchentlicher Marktreport - Anleitung

## 📊 Übersicht

Der wöchentliche Marktreport ist ein interaktives Dashboard-Feature, das aktuelle Marktdaten, Preisentwicklungen, Lieferanten-Updates und strategische Empfehlungen visualisiert.

---

## 🚀 Schnellstart

### 1. Dashboard aufrufen
- Öffnen Sie das Paulaner Supplier Portal
- Im Dashboard finden Sie unter "Schnellzugriff" die Karte "Wöchentlicher Marktreport"
- Klicken Sie auf die Karte, um zur Marktreport-Seite zu gelangen

### 2. Marktreport hochladen
- Klicken Sie auf "Marktreport hochladen (.json)"
- Wählen Sie Ihre JSON-Datei aus
- Der Report wird sofort geladen und visualisiert

### 3. Report ansehen
Der Report zeigt automatisch:
- ✅ Marktübersicht mit Haupttrends
- ✅ Preisentwicklungen im Vergleich zur Vorwoche
- ✅ Lieferanten-Updates und Highlights
- ✅ Nachfrageanalyse nach Produkttypen
- ✅ ESG- und Nachhaltigkeitstrends
- ✅ Ausblick mit Risiken und Chancen
- ✅ Priorisierte Handlungsempfehlungen

---

## 📝 Dateiformat

### Erforderliches Format
Die Marktreport-Datei muss eine **JSON-Datei** sein.

### Beispiel-Struktur
Eine vollständige Beispieldatei finden Sie unter:
```
src/data/marketReport.example.json
```

### Datei-Schema

```json
{
  "reportMetadata": {
    "weekNumber": 47,
    "year": 2024,
    "dateRange": {
      "from": "2024-11-18",
      "to": "2024-11-24"
    },
    "createdAt": "2024-11-24T10:00:00Z",
    "author": "Marktanalyse Team"
  },
  "marketOverview": {
    "summary": "Zusammenfassung der Marktsituation...",
    "keyTrends": [
      "Trend 1",
      "Trend 2"
    ],
    "marketSentiment": "positiv"
  },
  "priceChanges": [
    {
      "productType": "Pilsner Malz",
      "currentPrice": 450,
      "previousPrice": 448,
      "change": 0.4,
      "unit": "EUR/Tonne",
      "trend": "stabil"
    }
  ],
  "supplierHighlights": [
    {
      "supplier": "Weyermann",
      "highlight": "Beschreibung...",
      "impact": "positiv"
    }
  ],
  "demandAnalysis": {
    "topProducts": [
      {
        "name": "Pilsner Malz",
        "demand": "hoch",
        "changePercent": 5.2
      }
    ],
    "seasonalFactors": "Beschreibung..."
  },
  "sustainability": {
    "esgTrends": [
      "ESG Trend 1"
    ],
    "upcomingRegulations": [
      "Regulation 1"
    ]
  },
  "outlook": {
    "nextWeek": "Prognose...",
    "risks": [
      "Risiko 1"
    ],
    "opportunities": [
      "Chance 1"
    ]
  },
  "recommendations": [
    {
      "priority": "hoch",
      "action": "Handlungsempfehlung",
      "deadline": "2024-11-30"
    }
  ]
}
```

---

## 🎨 Visualisierungs-Features

### Marktstimmung
- **positiv** - Grüne Hervorhebung
- **neutral** - Gelbe Hervorhebung
- **negativ** - Rote Hervorhebung

### Preisentwicklung
- 📈 Steigender Trend
- 📉 Fallender Trend
- ➡️ Stabiler Trend

### Prioritäten
- **Hoch** - Rot (dringend)
- **Mittel** - Gelb (wichtig)
- **Niedrig** - Grün (geplant)

---

## 📋 Felderbeschreibung

### reportMetadata (Pflichtfeld)
Metadaten zum Report:
- `weekNumber`: KW-Nummer (Zahl)
- `year`: Jahr (Zahl)
- `dateRange`: Start- und Enddatum
- `createdAt`: Erstellungszeitpunkt (ISO 8601)
- `author`: Ersteller des Reports

### marketOverview (Pflichtfeld)
Marktübersicht:
- `summary`: Kurze Zusammenfassung der Marktsituation
- `keyTrends`: Array mit Haupttrends
- `marketSentiment`: "positiv", "neutral" oder "negativ"

### priceChanges (Optional)
Array mit Preisentwicklungen:
- `productType`: Produktname
- `currentPrice`: Aktueller Preis
- `previousPrice`: Preis der Vorwoche
- `change`: Prozentuale Änderung
- `unit`: Einheit (z.B. "EUR/Tonne")
- `trend`: "steigend", "fallend" oder "stabil"

### supplierHighlights (Optional)
Lieferanten-Updates:
- `supplier`: Lieferantenname
- `highlight`: Beschreibung des Updates
- `impact`: "positiv", "neutral" oder "negativ"

### demandAnalysis (Optional)
Nachfrageanalyse:
- `topProducts`: Array mit Top-Produkten
  - `name`: Produktname
  - `demand`: "sehr hoch", "hoch", "mittel", "niedrig"
  - `changePercent`: Prozentuale Veränderung
- `seasonalFactors`: Beschreibung saisonaler Einflüsse

### sustainability (Optional)
ESG und Nachhaltigkeit:
- `esgTrends`: Array mit ESG-Trends
- `upcomingRegulations`: Array mit kommenden Regularien

### outlook (Optional)
Ausblick:
- `nextWeek`: Prognose für nächste Woche
- `risks`: Array mit Risiken
- `opportunities`: Array mit Chancen

### recommendations (Optional)
Handlungsempfehlungen:
- `priority`: "hoch", "mittel" oder "niedrig"
- `action`: Beschreibung der Empfehlung
- `deadline`: Frist (ISO 8601 Datum)

---

## 💡 Best Practices

### 1. Regelmäßige Updates
- Laden Sie jeden Montag den aktuellen Wochenreport hoch
- Archivieren Sie alte Reports für historische Analysen

### 2. Vollständigkeit
- Füllen Sie alle verfügbaren Felder aus
- Je mehr Daten, desto aussagekräftiger die Visualisierung

### 3. Konsistenz
- Verwenden Sie konsistente Produktnamen
- Halten Sie Kategorien und Einheiten einheitlich

### 4. Actionable Insights
- Formulieren Sie konkrete, umsetzbare Empfehlungen
- Setzen Sie realistische Deadlines

---

## 🔧 Troubleshooting

### Report lädt nicht
**Problem:** Datei wird nicht akzeptiert
**Lösung:**
- Überprüfen Sie, dass die Datei .json Endung hat
- Validieren Sie die JSON-Syntax (z.B. mit jsonlint.com)
- Stellen Sie sicher, dass alle Pflichtfelder vorhanden sind

### Fehlerhafte Anzeige
**Problem:** Daten werden nicht korrekt dargestellt
**Lösung:**
- Prüfen Sie die Feldtypen (Zahlen ohne Anführungszeichen, Strings mit)
- Überprüfen Sie das Datumsformat (ISO 8601: YYYY-MM-DD)
- Kontrollieren Sie Enum-Werte ("positiv", "negativ", "neutral")

### Leere Sektionen
**Problem:** Teile des Reports sind leer
**Lösung:**
- Das ist normal, wenn optionale Felder fehlen
- Fügen Sie die gewünschten Daten zur JSON-Datei hinzu

---

## 📞 Support

Bei Fragen oder Problemen:
1. Konsultieren Sie die Beispieldatei `marketReport.example.json`
2. Validieren Sie Ihre JSON-Datei
3. Prüfen Sie die Browser-Konsole auf Fehlermeldungen

---

## 🎯 Roadmap

Geplante Features:
- [ ] Historischer Vergleich mehrerer Wochen
- [ ] Export als PDF
- [ ] Automatischer Import via API
- [ ] Trend-Visualisierungen über Zeit
- [ ] Benachrichtigungen bei kritischen Updates

---

**Version:** 1.0.0
**Letzte Aktualisierung:** November 2024
