import { DEFAULT_SGD_RATES, COMPARISON_PROVIDERS, MoneyChangerProvider } from '../data/currencies';

export interface RatesResponse {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  isLive: boolean;
}

const CACHE_KEY = 'mas_exchanger_rates_cache';
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function fetchExchangeRates(): Promise<RatesResponse> {
  // Check cached data
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const isFresh = Date.now() - parsed.timestamp < CACHE_DURATION_MS;
      if (isFresh && parsed.rates) {
        return {
          base: 'SGD',
          rates: { ...DEFAULT_SGD_RATES, ...parsed.rates },
          lastUpdated: new Date(parsed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isLive: true,
        };
      }
    }
  } catch {
    // ignore storage error
  }

  // 1. Check local serverless MAS API endpoint first
  try {
    const masRes = await fetch('/api/mas-exchange-rates');
    if (masRes.ok) {
      const masData = await masRes.json();
      if (masData?.success && masData?.normalizedRatesAgainstSGD) {
        const mergedRates = { ...DEFAULT_SGD_RATES, ...masData.normalizedRatesAgainstSGD };
        return {
          base: 'SGD',
          rates: mergedRates,
          lastUpdated: `MAS Official (${masData.end_of_day || 'Latest'})`,
          isLive: true,
        };
      }
    }
  } catch {
    // Ignore and proceed to public rate service
  }

  // 2. Fetch live from open API fallback
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/SGD', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        const mergedRates = { ...DEFAULT_SGD_RATES, ...data.rates };
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              rates: mergedRates,
              timestamp: Date.now(),
            })
          );
        } catch {
          // ignore storage quota error
        }
        return {
          base: 'SGD',
          rates: mergedRates,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isLive: true,
        };
      }
    }
  } catch (err) {
    console.warn('Network rate fetch failed, falling back to MAS default benchmarks', err);
  }

  return {
    base: 'SGD',
    rates: DEFAULT_SGD_RATES,
    lastUpdated: 'MAS Daily Benchmark Reference',
    isLive: false,
  };
}

export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string,
  rates: Record<string, number>
): { result: number; rate: number; inverseRate: number } {
  if (fromCode === toCode) {
    return { result: amount, rate: 1, inverseRate: 1 };
  }

  const fromRateInSGD = rates[fromCode] || 1;
  const toRateInSGD = rates[toCode] || 1;

  // Rate of 1 fromCode in toCode:
  // 1 SGD = fromRateInSGD (from)
  // 1 SGD = toRateInSGD (to)
  // Therefore 1 fromCode = toRateInSGD / fromRateInSGD
  const rate = toRateInSGD / fromRateInSGD;
  const inverseRate = rate !== 0 ? 1 / rate : 0;
  const result = amount * rate;

  return { result, rate, inverseRate };
}

export interface ProviderComparisonResult {
  provider: MoneyChangerProvider;
  receivedAmount: number;
  effectiveRate: number;
  totalCostInSGD: number;
  savingsVsBankSGD: number;
  isBest: boolean;
}

export function calculateProviderComparison(
  sendAmountSGD: number,
  targetCurrency: string,
  midMarketRate: number
): ProviderComparisonResult[] {
  const bankBenchmark = COMPARISON_PROVIDERS.find((p) => p.id === 'standard_bank_counter');
  const bankSpread = bankBenchmark ? bankBenchmark.spreadPercent : 2.75;
  const bankReceived = (sendAmountSGD - 10) * (midMarketRate * (1 - bankSpread / 100));

  const results = COMPARISON_PROVIDERS.map((provider) => {
    // Provider exchange calculation
    const netSendSGD = Math.max(0, sendAmountSGD - provider.fixedFeeSGD);
    const providerEffectiveRate = midMarketRate * (1 - provider.spreadPercent / 100);
    const receivedAmount = netSendSGD * providerEffectiveRate;

    // How much would it cost in SGD to get this amount at mid-market
    const midMarketValueSGD = receivedAmount / midMarketRate;
    const totalCostInSGD = sendAmountSGD - midMarketValueSGD;

    // Difference compared to traditional bank counter
    const diffVsBank = ((receivedAmount - bankReceived) / midMarketRate);

    return {
      provider,
      receivedAmount,
      effectiveRate: providerEffectiveRate,
      totalCostInSGD,
      savingsVsBankSGD: Math.max(0, diffVsBank),
      isBest: false,
    };
  });

  // Sort by highest received amount
  results.sort((a, b) => b.receivedAmount - a.receivedAmount);
  if (results.length > 0) {
    results[0].isBest = true;
  }

  return results;
}

export interface CashPackNote {
  denomination: number;
  count: number;
  totalValue: number;
}

export interface CashPackResult {
  notes: CashPackNote[];
  totalAllocated: number;
  remainder: number;
}

export function calculateCashPack(targetAmount: number, denominations: number[]): CashPackResult {
  const sortedDenoms = [...denominations].sort((a, b) => b - a);
  let remaining = Math.floor(targetAmount);
  const notes: CashPackNote[] = [];

  for (const denom of sortedDenoms) {
    if (remaining >= denom) {
      const count = Math.floor(remaining / denom);
      notes.push({
        denomination: denom,
        count,
        totalValue: count * denom,
      });
      remaining = remaining % denom;
    }
  }

  const totalAllocated = notes.reduce((sum, n) => sum + n.totalValue, 0);

  return {
    notes,
    totalAllocated,
    remainder: targetAmount - totalAllocated,
  };
}

export interface HistoricalPoint {
  date: string;
  rate: number;
  low: number;
  high: number;
}

export function generateHistoricalData(
  baseRate: number,
  timeframe: '7D' | '30D' | '90D' | '1Y'
): { points: HistoricalPoint[]; minRate: number; maxRate: number; changePercent: number } {
  let days = 7;
  let volatility = 0.0035;

  if (timeframe === '30D') {
    days = 30;
    volatility = 0.005;
  } else if (timeframe === '90D') {
    days = 90;
    volatility = 0.0075;
  } else if (timeframe === '1Y') {
    days = 365;
    volatility = 0.012;
  }

  const points: HistoricalPoint[] = [];
  const now = new Date();
  let current = baseRate * (1 - volatility * (days / 20) * 0.3);

  // Generate reproducible realistic curve
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);

    // subtle sine wave + pseudorandom daily walk
    const cycle = Math.sin((i / days) * Math.PI * 3) * volatility * baseRate * 0.4;
    const noise = ((Math.sin(i * 12.9898) * 43758.5453) % 1) * volatility * baseRate * 0.3;
    const rate = Math.max(0.0001, current + cycle + noise);

    points.push({
      date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      rate,
      low: rate * 0.997,
      high: rate * 1.003,
    });
  }

  // Ensure last point is exactly baseRate
  if (points.length > 0) {
    points[points.length - 1].rate = baseRate;
  }

  const rates = points.map((p) => p.rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const startRate = points[0]?.rate || baseRate;
  const endRate = baseRate;
  const changePercent = ((endRate - startRate) / startRate) * 100;

  return { points, minRate, maxRate, changePercent };
}
