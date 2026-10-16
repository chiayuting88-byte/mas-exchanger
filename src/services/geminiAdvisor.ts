import { GoogleGenAI } from '@google/genai';

export interface FXAdviceRequest {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  currentRate: number;
  purpose: 'travel' | 'investment' | 'remittance' | 'shopping' | 'general';
  userQuestion?: string;
}

export interface FXAdviceResponse {
  summary: string;
  timingAdvice: 'Favorable to Exchange' | 'Neutral / Hold' | 'Monitor Closely';
  recommendation: string;
  bestChannel: string;
  tips: string[];
}

export async function getFXAdvice(request: FXAdviceRequest): Promise<FXAdviceResponse> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any)?.env?.GEMINI_API_KEY || '';

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'PLACEHOLDER_API_KEY') {
    // Provide comprehensive domain-expert heuristic response if API key is not yet set
    return generateHeuristicAdvice(request);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a senior FX specialist and Singapore Monetary Authority (MAS) market analyst for the MAS Exchanger platform.
Analyze the following currency exchange scenario:
- Base / From: ${request.amount} ${request.fromCurrency}
- Target / To: ${request.toCurrency}
- Current Benchmark Rate: 1 ${request.fromCurrency} = ${request.currentRate} ${request.toCurrency}
- Primary Intent: ${request.purpose}
- Specific Question: ${request.userQuestion || 'What is the optimal timing and exchange channel for this currency pair?'}

Provide your structured recommendation in JSON format matching this schema:
{
  "summary": "1-2 concise sentences summarizing the exchange context and rate positioning",
  "timingAdvice": "Favorable to Exchange" | "Neutral / Hold" | "Monitor Closely",
  "recommendation": "Concrete tactical advice for this transfer (whether to execute now, dollar-cost-average, or hedge)",
  "bestChannel": "The recommended channel in Singapore (e.g., The Arcade Raffles Place for cash, Wise/Revolut for digital card spend, DBS Remit for overseas account deposit)",
  "tips": ["3 practical money-saving tips for this currency pair"]
}
Return strictly raw JSON with no markdown backticks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text?.trim() || '';
    const cleanJson = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      summary: parsed.summary || 'Market rate analyzed against current MAS benchmarks.',
      timingAdvice: parsed.timingAdvice || 'Favorable to Exchange',
      recommendation: parsed.recommendation || 'Standard liquidity conditions apply.',
      bestChannel: parsed.bestChannel || 'The Arcade / Wise Multi-currency',
      tips: parsed.tips || [
        'Avoid airport counter exchange desks due to 8-12% spreads.',
        'Use local multi-currency cards to bypass ATM withdrawal fees.',
        'Check Friday vs Monday spreads before weekend travel.',
      ],
    };
  } catch (err) {
    console.warn('Gemini FX advice failed, serving heuristic financial insights:', err);
    return generateHeuristicAdvice(request);
  }
}

function generateHeuristicAdvice(request: FXAdviceRequest): FXAdviceResponse {
  const { fromCurrency, toCurrency, amount, currentRate, purpose } = request;

  let timingAdvice: 'Favorable to Exchange' | 'Neutral / Hold' | 'Monitor Closely' = 'Favorable to Exchange';
  let bestChannel = 'The Arcade (Raffles Place) / Wise Multi-Currency';

  if (toCurrency === 'MYR') {
    timingAdvice = currentRate >= 3.5 ? 'Favorable to Exchange' : 'Neutral / Hold';
    bestChannel = 'The Arcade (Raffles Place) or People\'s Park Complex for Cash, or Touch \'n Go eWallet linked card';
  } else if (toCurrency === 'JPY') {
    timingAdvice = currentRate >= 110 ? 'Favorable to Exchange' : 'Monitor Closely';
    bestChannel = 'Revolut / Wise digital balance (lock in rate early) + small physical cash bundle at The Arcade';
  } else if (toCurrency === 'USD') {
    timingAdvice = 'Neutral / Hold';
    bestChannel = 'DBS Multi-Currency / Interactive Brokers for wholesale FX, or Wise for debit spend';
  } else if (toCurrency === 'EUR' || toCurrency === 'GBP') {
    timingAdvice = 'Monitor Closely';
    bestChannel = 'YouTrip or Wise digital multi-currency card to eliminate 3.25% credit card markups';
  } else if (toCurrency === 'THB' || toCurrency === 'IDR') {
    timingAdvice = 'Favorable to Exchange';
    bestChannel = 'Chinatown People\'s Park Complex (Crante / Thin Margin) or Singapore bank QR (PromptPay / QRIS via PayNow)';
  }

  const isLarge = amount >= 2500;

  return {
    summary: `The current rate of 1 ${fromCurrency} = ${currentRate.toFixed(4)} ${toCurrency} offers competitive liquidity for ${purpose}.`,
    timingAdvice,
    recommendation: isLarge
      ? `For amounts above S$2,500, avoid retail bank counters. Lock in rates using digital multi-currency wallets or visit wholesale money changers at The Arcade to save up to S$65 in spreads.`
      : `For this amount, convenient digital multi-currency debit cards (Wise, Revolut, YouTrip) or Raffles Place money changers provide near mid-market value with zero extra transaction fees.`,
    bestChannel,
    tips: [
      `Avoid Changi Airport transit area money changer kiosks where spreads can reach 6% to 10%.`,
      toCurrency === 'THB' || toCurrency === 'MYR'
        ? `Singapore PayNow connects directly to Malaysia DuitNow and Thailand PromptPay QR for zero-markup retail purchases.`
        : `Split your travel funds: 75% on a multi-currency card and 25% physical notes for emergencies and local transport.`,
      `Always choose to be charged in local destination currency (${toCurrency}) rather than home currency at merchant terminals to avoid Dynamic Currency Conversion (DCC).`,
    ],
  };
}
