# OpenAI Vector Store Setup Guide

## Overview

The new OpenAI Agent Builder service uses Vector Stores to enable file search capabilities for the Internal Q&A Agent. This guide explains how to set up Vector Stores in the OpenAI platform.

## Prerequisites

- OpenAI API account with access to the Assistants API
- OpenAI API key (already configured in your `.env` file as `VITE_OPENAI_API_KEY`)
- Access to the OpenAI platform: https://platform.openai.com/

## Step 1: Create Vector Stores

### Option A: Using OpenAI Platform UI

1. **Login to OpenAI Platform**
   - Go to https://platform.openai.com/
   - Navigate to "Storage" → "Vector Stores"

2. **Create Malt Suppliers Vector Store**
   - Click "Create Vector Store"
   - Name: `Paulaner Malt Suppliers`
   - Description: `Complete database of malt suppliers with products, ESG data, and certifications`
   - Click "Create"
   - **Copy the Vector Store ID** (format: `vs_xxxxx...`)

3. **Create Documentation Vector Store** (Optional)
   - Click "Create Vector Store"
   - Name: `Paulaner Documentation`
   - Description: `Additional supplier documentation and guides`
   - Click "Create"
   - **Copy the Vector Store ID**

### Option B: Using OpenAI API

```bash
# Create Malt Suppliers Vector Store
curl https://api.openai.com/v1/vector_stores \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Paulaner Malt Suppliers",
    "metadata": {
      "project": "paulaner-supplier-portal",
      "type": "malt_suppliers"
    }
  }'

# Save the returned "id" field (e.g., vs_abc123...)
```

## Step 2: Upload Files to Vector Stores

### Upload Malt Suppliers Data

**Using OpenAI Platform UI:**
1. Open the "Paulaner Malt Suppliers" Vector Store
2. Click "Upload Files"
3. Upload: `/home/user/Paulaner/src/data/maltSuppliers.json`
4. Wait for processing to complete (this may take a few minutes)
5. Verify status shows "Completed"

**Using OpenAI API:**
```bash
# First, upload the file
curl https://api.openai.com/v1/files \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F purpose="assistants" \
  -F file="@/home/user/Paulaner/src/data/maltSuppliers.json"

# Save the returned file "id" (e.g., file_abc123...)

# Then, attach the file to the Vector Store
curl https://api.openai.com/v1/vector_stores/{VECTOR_STORE_ID}/files \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "file_abc123..."
  }'
```

## Step 3: Update Service Configuration

Once you have your Vector Store IDs, update them in the service file:

**File:** `/home/user/Paulaner/src/services/openaiService.js`

**Current (lines 19-23):**
```javascript
const VECTOR_STORE_CONFIG = {
  // TODO: Replace with actual Vector Store IDs after creating them in OpenAI platform
  maltSuppliers: 'vs_PLACEHOLDER_MALT_SUPPLIERS',
  documentation: 'vs_PLACEHOLDER_DOCUMENTATION'
}
```

**Update to:**
```javascript
const VECTOR_STORE_CONFIG = {
  maltSuppliers: 'vs_YOUR_ACTUAL_VECTOR_STORE_ID_HERE',
  documentation: 'vs_YOUR_ACTUAL_VECTOR_STORE_ID_HERE'  // Optional
}
```

## Step 4: Verify Setup

After configuring the Vector Store IDs, rebuild and test the application:

```bash
# Rebuild the application
npm run build

# Start the dev server
npm run dev

# Test with a query like:
# "Welche Malze haben wir im Dashboard?"
# "Zeige mir alle Weyermann Produkte"
```

## Multi-Agent Workflow Architecture

The new system uses 5 specialized agents:

### 1. **Query Rewriter Agent**
- Makes vague questions more specific
- Optimizes queries for better results

### 2. **Classification Agent**
- Routes queries to appropriate workflow:
  - **Q&A**: Internal supplier/product questions
  - **FACT**: External supplier search

### 3. **Internal Q&A Agent**
- Uses file search on Vector Stores
- Answers questions about existing suppliers/products
- Applies domain knowledge with data validation

### 4. **External Fact-Finding Agent**
- Uses web search for external information
- Finds new suppliers
- Researches market information

### 5. **Fallback Agent**
- Handles unclear or problematic queries
- Provides helpful suggestions

## Expected Agent Flow

### Example 1: Internal Query
```
User: "Welche Malze eignen sich für Whisky?"
  ↓
Query Rewriter: "Welche Malze von unseren Lieferanten eignen sich für Whisky-Herstellung?"
  ↓
Classifier: "QA" (Internal)
  ↓
Internal Q&A Agent: Uses file_search on Vector Store
  ↓
Response: List of suitable malts with reasoning
```

### Example 2: External Query
```
User: "Suche Lieferanten für Glasflaschen"
  ↓
Query Rewriter: "Suche Glasflaschen-Lieferanten in Deutschland und Nachbarländern"
  ↓
Classifier: "FACT" (External)
  ↓
External Fact-Finding Agent: Uses web_search
  ↓
Response: List of potential suppliers with evaluation criteria
```

## Troubleshooting

### Issue: "Vector Store not found" error

**Solution:**
- Verify Vector Store IDs are correct
- Check that files were successfully uploaded and processed
- Ensure API key has access to the Vector Stores

### Issue: File search returns no results

**Solution:**
- Check Vector Store status in OpenAI platform (should be "Completed")
- Verify file was uploaded correctly
- Try re-uploading the file

### Issue: Hallucination validation fails

**Solution:**
- The service has built-in validation to prevent hallucinations
- Check console logs for specific validation errors
- Verify supplier whitelist in agent instructions matches your data

## Additional Files to Upload (Optional)

Consider uploading these additional files to enhance the Vector Store:

1. **Product Catalogs** (PDF/JSON)
   - Detailed product specifications
   - Technical datasheets

2. **ESG Reports**
   - Sustainability reports
   - Certification documents

3. **Supplier Documentation**
   - Contracts
   - Quality agreements
   - Delivery terms

## Cost Considerations

Vector Store pricing (as of 2024):
- Storage: $0.10/GB/day
- Search usage: Included in API calls

For this application with maltSuppliers.json (~200KB):
- Estimated storage cost: ~$0.003/month

## Next Steps

After completing Vector Store setup:

1. ✅ Create Vector Stores in OpenAI platform
2. ✅ Upload maltSuppliers.json
3. ✅ Update VECTOR_STORE_CONFIG in openaiService.js
4. ✅ Rebuild application: `npm run build`
5. ✅ Test queries in the application
6. ✅ Monitor console logs for agent workflow
7. ✅ Verify hallucination validation is working

## Support

For issues with:
- **OpenAI Vector Stores**: Check OpenAI documentation at https://platform.openai.com/docs/assistants/tools/file-search
- **Agent workflow**: Check browser console for detailed agent logs
- **Application errors**: Check terminal output and build logs

---

**Note:** The placeholder Vector Store IDs will cause errors until replaced with actual IDs. The service will still initialize, but file search functionality will not work.
