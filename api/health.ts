/**
 * @file /api/health.ts
 * Serverless health check endpoint for MAS Exchanger API services.
 */

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  nodeVersion: string;
  services: {
    masApiConfigured: boolean;
    dataGovSgConfigured: boolean;
  };
}

export default async function handler(req: any, res: any) {
  // Support CORS
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, KeyId, x-api-key');
    res.setHeader('Content-Type', 'application/json');
  }

  if (req.method === 'OPTIONS') {
    if (res?.status) return res.status(200).end();
    if (res?.writeHead) {
      res.writeHead(200);
      return res.end();
    }
  }

  const masKeyId = process.env.MAS_KEY_ID || process.env.MAS_API_KEY || '';
  const dataGovKey = process.env.DATA_GOV_SG_API_KEY || process.env.PSI_API_KEY || '';

  const healthData: HealthResponse = {
    status: 'ok',
    service: 'mas-exchanger-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    environment: process.env.NODE_ENV || 'production',
    nodeVersion: process.version || 'unknown',
    services: {
      masApiConfigured: Boolean(masKeyId),
      dataGovSgConfigured: Boolean(dataGovKey),
    },
  };

  const jsonString = JSON.stringify(healthData, null, 2);

  if (res?.status && typeof res.status === 'function') {
    return res.status(200).json(healthData);
  } else if (res?.writeHead && typeof res.writeHead === 'function') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(jsonString);
  }

  // Support Web Fetch Response if in Edge runtime
  return new Response(jsonString, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
