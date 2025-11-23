# OpenAI Integration Setup

Der Paulaner AI Assistant unterstützt jetzt **echte KI** durch OpenAI Integration! 🤖

## 🚀 Quick Start

### 1. OpenAI API Key erhalten

1. Gehe zu [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Melde dich an oder erstelle einen Account
3. Klicke auf "Create new secret key"
4. Kopiere den Key (du siehst ihn nur einmal!)

### 2. .env Datei erstellen

Erstelle eine `.env` Datei im Projekt-Root:

```bash
# Im Projektverzeichnis:
cp .env.example .env
```

### 3. API Key eintragen

Öffne `.env` und füge deinen Key ein:

```env
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
VITE_OPENAI_MODEL=gpt-4o-mini
```

### 4. Development Server neu starten

```bash
npm run dev
```

## ✅ Fertig!

Der AI Assistant nutzt jetzt automatisch OpenAI für **deutlich bessere Antworten**!

---

## 📊 Verfügbare Modelle

| Modell | Kosten | Geschwindigkeit | Qualität |
|--------|--------|-----------------|----------|
| **gpt-4o-mini** ⭐ | Günstig | Schnell | Sehr gut |
| gpt-4o | Mittel | Mittel | Exzellent |
| gpt-4-turbo | Teuer | Langsam | Hervorragend |

**Empfehlung:** `gpt-4o-mini` bietet das beste Preis-Leistungs-Verhältnis!

---

## 🔄 Fallback-System

Falls OpenAI nicht verfügbar ist, nutzt das System automatisch:
- ✅ Lokales Pattern Matching
- ✅ Conversation Memory
- ✅ Entity Tracking

**Du bekommst also immer eine Antwort**, auch ohne API Key!

---

## 💰 Kosten

Typische Nutzung mit `gpt-4o-mini`:
- **Pro Query:** ~$0.001-0.003 (ca. 0,1-0,3 Cent)
- **100 Queries:** ~$0.10-0.30
- **1000 Queries:** ~$1-3

---

## 🐛 Troubleshooting

### "OpenAI service not available"
- Prüfe, ob `.env` Datei existiert
- Stelle sicher, dass der API Key korrekt ist
- Server neu starten: `npm run dev`

### "API key nicht gefunden"
- Stelle sicher, dass der Key mit `VITE_` beginnt
- Keine Leerzeichen im Key
- Keine Anführungszeichen um den Key

### Console zeigt: "Using local pattern matching"
- Normal, wenn kein API Key konfiguriert ist
- Lokales System funktioniert als Fallback

---

## 🎯 Beispiel-Queries die jetzt **viel besser** funktionieren:

```
✅ "Welches Malz empfiehlst du für Weizenbier?"
✅ "Was ist der Unterschied zwischen diesen beiden?"
✅ "Vergleiche die ESG-Bewertungen"
✅ "Zeig mir alle hellen Malze mit niedrigem EBC"
✅ "Welcher Lieferant ist am nachhaltigsten?"
```

Die KI versteht jetzt den **Kontext** und gibt **intelligente, personalisierte Antworten**!

---

## 🔒 Sicherheit

- **API Key nie committen!** (`.env` ist in `.gitignore`)
- Nur für **Development/Internal Use**
- Für Production: Backend-Service verwenden

---

## 📝 Was wurde implementiert?

1. **OpenAI Integration**
   - `src/services/openaiService.js` - OpenAI API Service
   - Automatische Fallback-Logik

2. **Smart Context Management**
   - Conversation History wird an KI übergeben
   - Produkt- und Lieferanten-Daten im Prompt
   - ESG-Bewertungen verfügbar

3. **Response Format Handling**
   - KI gibt strukturierte JSON-Responses zurück
   - Kompatibel mit allen existierenden UI-Komponenten

4. **Error Handling**
   - Graceful Fallback bei API-Fehlern
   - User-friendly Error Messages

---

Viel Erfolg! 🎉
