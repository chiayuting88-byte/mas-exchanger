/**
 * @file /api/mas-exchange-rates.ts
 * Serverless API connection pulling live exchange rates from Monetary Authority of Singapore (MAS).
 *
 * Endpoint:
 * GET https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610ora/exchange_rates_end_of_period_daily/views/exchange_rates_end_of_period_daily?end_of_day=2026-10-14
 * Header:
 * KeyId: <MAS_KEY_ID>
 *
 * Note: No API keys are hardcoded. Key is retrieved from process.env.MAS_KEY_ID or request headers.
 */

export interface MasExchangeRateRecord {
  end_of_day?: string;
  usd_sgd?: string | number;
  myr_sgd?: string | number;
  gbp_sgd?: string | number;
  eur_sgd?: string | number;
  jpy_sgd_100?: string | number;
  aud_sgd?: string | number;
  cad_sgd?: string | number;
  chf_sgd?: string | number;
  cny_sgd?: string | number;
  hkd_sgd?: string | number;
  inr_sgd_100?: string | number;
  idr_sgd_100?: string | number;
  krw_sgd_100?: string | number;
  php_sgd_100?: string | number;
  thb_sgd_100?: string | number;
  twd_sgd_100?: string | number;
  vnd_sgd_100?: string | number;
  nzd_sgd?: string | number;
  sar_sgd?: string | number;
  aed_sgd?: string | number;
  [key: string]: any;
}

export interface MasApiResponse {
  success: boolean;
  source: 'Monetary Authority of Singapore (MAS)';
  endpoint: string;
  end_of_day: string;
  timestamp: string;
  normalizedRatesAgainstSGD?: Record<string, number>;
  data?: any;
  error?: string;
  message?: string;
}

export default async function handler(req: any, res: any) {
  // CORS Configuration
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, KeyId, keyid, key-id, x-api-key, Authorization');
    res.setHeader('Content-Type', 'application/json');
  }

  if (req.method === 'OPTIONS') {
    if (res?.status) return res.status(200).end();
    if (res?.writeHead) {
      res.writeHead(200);
      return res.end();
    }
  }

  // 1. Extract query params (end_of_day, key_id)
  let endOfDay = '2026-10-14';
  let queryKeyId = '';

  if (req.query?.end_of_day) {
    endOfDay = req.query.end_of_day;
  } else if (req.url && req.url.includes('?')) {
    const urlObj = new URL(req.url, 'http://localhost');
    const param = urlObj.searchParams.get('end_of_day');
    if (param) endOfDay = param;
    const qKey = urlObj.searchParams.get('key_id') || urlObj.searchParams.get('keyId');
    if (qKey) queryKeyId = qKey;
  }

  // 2. Resolve KeyId without hardcoding
  const headerKeyId =
    req.headers?.['keyid'] ||
    req.headers?.['key-id'] ||
    req.headers?.['KeyId'] ||
    req.headers?.['x-api-key'] ||
    req.headers?.['authorization']?.replace(/^Bearer\s+/i, '') ||
    '';

  const keyId =
    process.env.MAS_KEY_ID ||
    process.env.MAS_API_KEY ||
    headerKeyId ||
    queryKeyId;

  const masEndpoint = `https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610ora/exchange_rates_end_of_period_daily/views/exchange_rates_end_of_period_daily?end_of_day=${encodeURIComponent(
    endOfDay
  )}`;

  // If KeyId is missing, return a structured informative response
  if (!keyId) {
    const missingKeyResponse: MasApiResponse = {
      success: false,
      source: 'Monetary Authority of Singapore (MAS)',
      endpoint: masEndpoint,
      end_of_day: endOfDay,
      timestamp: new Date().toISOString(),
      error: 'Missing MAS KeyId',
      message:
        'MAS API Gateway requires a valid KeyId header. Please configure MAS_KEY_ID in your environment variables (.env.local) or pass "KeyId" in the request headers.',
    };

    const json = JSON.stringify(missingKeyResponse, null, 2);
    if (res?.status && typeof res.status === 'function') {
      return res.status(401).json(missingKeyResponse);
    } else if (res?.writeHead && typeof res.writeHead === 'function') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(json);
    }
    return new Response(json, { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  // 3. Connect to MAS Gateway
  try {
    const masResponse = await fetch(masEndpoint, {
      method: 'GET',
      headers: {
        KeyId: keyId.trim(),
        Accept: 'application/json',
      },
    });

    if (!masResponse.ok) {
      const errorText = await masResponse.text();
      throw new Error(`MAS API returned HTTP ${masResponse.status}: ${errorText.slice(0, 300)}`);
    }

    const rawData = await masResponse.json();

    // 4. Normalize MAS Statistical Bulletin records
    // MAS returns records in { result: { records: [...] } } or array
    const records: MasExchangeRateRecord[] =
      rawData?.result?.records ||
      rawData?.records ||
      (Array.isArray(rawData) ? rawData : [rawData]);

    const latestRecord = records[0] || {};
    const normalizedRates: Record<string, number> = { SGD: 1.0 };

    // MAS rates are expressed in SGD per unit (or per 100 units)
    // To normalize to "Units of Foreign Currency per 1 SGD":
    // If USD/SGD is 1.30, then 1 SGD = 1 / 1.30 = 0.7692 USD
    const parseRate = (val: any) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val);
      return null;
    };

    const addRate = (code: string, sgdCost: any, unitScale = 1) => {
      const num = parseRate(sgdCost);
      if (num && num > 0) {
        // num is SGD cost per unitScale units of foreign currency
        // Rate per 1 SGD = unitScale / num
        normalizedRates[code] = unitScale / num;
      }
    };

    addRate('USD', latestRecord.usd_sgd);
    addRate('MYR', latestRecord.myr_sgd);
    addRate('GBP', latestRecord.gbp_sgd);
    addRate('EUR', latestRecord.eur_sgd);
    addRate('JPY', latestRecord.jpy_sgd_100, 100);
    addRate('AUD', latestRecord.aud_sgd);
    addRate('CAD', latestRecord.cad_sgd);
    addRate('CHF', latestRecord.chf_sgd);
    addRate('CNY', latestRecord.cny_sgd);
    addRate('HKD', latestRecord.hkd_sgd);
    addRate('INR', latestRecord.inr_sgd_100, 100);
    addRate('IDR', latestRecord.idr_sgd_100, 100);
    addRate('KRW', latestRecord.krw_sgd_100, 100);
    addRate('PHP', latestRecord.php_sgd_100, 100);
    addRate('THB', latestRecord.thb_sgd_100, 100);
    addRate('TWD', latestRecord.twd_sgd_100, 100);
    addRate('VND', latestRecord.vnd_sgd_100, 100);
    addRate('NZD', latestRecord.nzd_sgd);
    addRate('SAR', latestRecord.sar_sgd);
    addRate('AED', latestRecord.aed_sgd);

    const payload: MasApiResponse = {
      success: true,
      source: 'Monetary Authority of Singapore (MAS)',
      endpoint: masEndpoint,
      end_of_day: latestRecord.end_of_day || endOfDay,
      timestamp: new Date().toISOString(),
      normalizedRatesAgainstSGD: normalizedRates,
      data: rawData,
    };

    const json = JSON.stringify(payload, null, 2);
    if (res?.status && typeof res.status === 'function') {
      return res.status(200).json(payload);
    } else if (res?.writeHead && typeof res.writeHead === 'function') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(json);
    }
    return new Response(json, { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    const errorResponse: MasApiResponse = {
      success: false,
      source: 'Monetary Authority of Singapore (MAS)',
      endpoint: masEndpoint,
      end_of_day: endOfDay,
      timestamp: new Date().toISOString(),
      error: 'MAS Gateway Connection Error',
      message: err?.message || 'Error executing request to eservices.mas.gov.sg gateway',
    };

    const json = JSON.stringify(errorResponse, null, 2);
    if (res?.status && typeof res.status === 'function') {
      return res.status(502).json(errorResponse);
    } else if (res?.writeHead && typeof res.writeHead === 'function') {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      return res.end(json);
    }
    return new Response(json, { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}
