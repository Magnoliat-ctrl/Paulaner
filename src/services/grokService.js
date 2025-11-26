/**
 * Grok Service (xAI)
 * For supplier evaluation using Grok's LLM
 */

import OpenAI from 'openai'

class GrokService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GROK_API_KEY
    this.model = import.meta.env.VITE_GROK_MODEL || 'grok-beta'
    this.client = null
    this.isAvailable = false

    // Initialize client if API key is available
    if (this.apiKey && this.apiKey !== 'your_grok_api_key_here') {
      try {
        // Grok API is OpenAI-compatible, use same SDK with different base URL
        this.client = new OpenAI({
          apiKey: this.apiKey,
          baseURL: 'https://api.x.ai/v1',
          dangerouslyAllowBrowser: true // For frontend usage
        })
        this.isAvailable = true
        console.log('✅ Grok Service initialized with model:', this.model)
      } catch (error) {
        console.warn('⚠️ Grok initialization failed:', error.message)
        this.isAvailable = false
      }
    } else {
      console.warn('⚠️ Grok API key not configured.')
    }
  }

  /**
   * Check if Grok service is available
   */
  isEnabled() {
    return this.isAvailable && this.client !== null
  }

  /**
   * Get the underlying client for direct API calls
   * Used by supplierEvaluator for chat completions
   */
  getClient() {
    return this.client
  }

  /**
   * Get the configured model name
   */
  getModel() {
    return this.model
  }
}

// Export singleton instance
export const grokService = new GrokService()
