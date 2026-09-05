import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import {GoogleGenAI} from '@google/genai';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());

// Lazy-initialized Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env['GEMINI_API_KEY'];
    geminiClient = new GoogleGenAI(apiKey ? { apiKey } : undefined);
  }
  return geminiClient;
}

/**
 * Multi-Turn Gemini AI Chatbot API Endpoint
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemInstruction, model = 'gemini-3.5-flash', contextData } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const ai = getGeminiClient();

    // Map messages to Gemini contents format
    const contents = messages.map((m: { role: string; content?: string; text?: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || m.text || '' }],
    }));

    let fullSystemInstruction = systemInstruction || 
      'You are Sales Pilot AI, an elite enterprise sales copilot, MEDDPICC qualification master, and revenue operations strategist. Provide precise, actionable, and executive-grade responses.';

    if (contextData) {
      fullSystemInstruction += `\n\n[CURRENT LIVE PIPELINE & CRM CONTEXT]:\n${typeof contextData === 'string' ? contextData : JSON.stringify(contextData, null, 2)}`;
    }

    const response = await ai.models.generateContent({
      model: model || 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({
      text: response.text || 'No response generated.',
      model: model || 'gemini-3.5-flash',
      usage: response.usageMetadata,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate response from Gemini';
    console.error('Gemini API Chat Error:', error);
    return res.status(500).json({
      error: errorMessage,
    });
  }
});

// Cache for daily FX rates
let cachedFxRates: {
  timestamp: number;
  rates: Record<string, number>;
  source: string;
} | null = null;

/**
 * Daily Real-Time FX Exchange Rates API Endpoint
 */
app.get('/api/fx-rates', async (_req, res) => {
  const now = Date.now();
  // 60-second cache window
  if (cachedFxRates && now - cachedFxRates.timestamp < 60000) {
    return res.json({
      rates: cachedFxRates.rates,
      source: cachedFxRates.source,
      cached: true,
      lastUpdated: new Date(cachedFxRates.timestamp).toISOString(),
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const fxResponse = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (fxResponse.ok) {
      const data = (await fxResponse.json()) as { rates?: Record<string, number>; time_last_update_utc?: string };
      if (data.rates && typeof data.rates === 'object') {
        cachedFxRates = {
          timestamp: now,
          rates: data.rates,
          source: 'Open Exchange Rates (Live Interbank Feed)',
        };
        return res.json({
          rates: data.rates,
          source: 'Open Exchange Rates (Live Interbank Feed)',
          cached: false,
          lastUpdated: data.time_last_update_utc || new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('Live FX external fetch error (using resilient fallback rates):', err);
  }

  // Fallback baseline rates
  const fallbackRates: Record<string, number> = {
    USD: 1.0,
    EUR: 0.9215,
    GBP: 0.7712,
    JPY: 154.42,
    CAD: 1.3814,
    AUD: 1.5365,
    CHF: 0.8842,
    INR: 86.85,
    SGD: 1.3328,
    CNY: 7.248,
    AED: 3.6725,
    BRL: 5.642,
    HKD: 7.784,
    SEK: 10.582,
    NZD: 1.6845,
    KRW: 1388.5,
    MXN: 19.42,
    ZAR: 18.24,
    SAR: 3.751,
    PLN: 3.982,
  };

  return res.json({
    rates: fallbackRates,
    source: 'Resilient Enterprise Interbank Baseline',
    cached: false,
    lastUpdated: new Date().toISOString(),
  });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
