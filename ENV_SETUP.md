# Environment Variables Setup für Vercel

## Erforderliche Environment-Variablen

Fügen Sie diese Variablen im Vercel Dashboard hinzu:

**Vercel Dashboard → Projekt auswählen → Settings → Environment Variables**

### OpenAI API (Primary - GPT-4o)

```
Name: VITE_OPENAI_API_KEY
Value: [Ihr OpenAI API Key - siehe lokale .env Datei]
Environments: Production, Preview, Development (alle auswählen ✓)
```

**Aktueller Key:** Verwenden Sie den Key aus Ihrer lokalen `.env` Datei (beginnt mit `sk-proj-`)

### Diffbot API (Alternative)

```
Name: VITE_DIFFBOT_API_KEY
Value: [Ihr Diffbot API Key - siehe lokale .env Datei]
Environments: Production, Preview, Development (alle auswählen ✓)
```

### Feature Flags

```
Name: VITE_ENABLE_AI
Value: true
Environments: Production, Preview, Development (alle auswählen ✓)
```

```
Name: VITE_AI_PROVIDER
Value: openai
Environments: Production, Preview, Development (alle auswählen ✓)
```

## Nach dem Hinzufügen

1. Gehen Sie zu **Deployments**
2. Klicken Sie auf **"..."** beim neuesten Deployment
3. Wählen Sie **"Redeploy"**

## Überprüfung

Nach dem Deployment öffnen Sie die Browser-Konsole (F12) und suchen Sie nach:

```
🤖 Searching with OpenAI: [Ihre Suche]
```

Dies bestätigt, dass GPT-4o für die Datenextraktion verwendet wird.

## Lokale Entwicklung

Die `.env` Datei im Root-Verzeichnis enthält bereits alle Variablen für lokale Entwicklung.
