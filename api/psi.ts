/**
 * @file /api/psi.ts
 * Serverless API endpoint for Singapore Pollutant Standards Index (PSI) and PM2.5 air quality readings.
 * Sources from data.gov.sg / National Environment Agency (NEA).
 */

export interface PSIReadings {
  timestamp: string;
  updateTimestamp: string;
  status: 'healthy' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  psi24Hourly: {
    national: number;
    central: number;
    north: number;
    south: number;
    east: number;
    west: number;
  };
  pm25OneHourly: {
    central: number;
    north: number;
    south: number;
    east: number;
    west: number;
  };
  raw?: any;
}

export default async function handler(req: any, res: any) {
  // CORS configuration
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, api-key, x-api-key');
    res.setHeader('Content-Type', 'application/json');
  }

  if (req.method === 'OPTIONS') {
    if (res?.status) return res.status(200).end();
    if (res?.writeHead) {
      res.writeHead(200);
      return res.end();
    }
  }

  try {
    // Determine query date or date_time if provided
    let queryDate = '';
    if (req.query?.date_time) {
      queryDate = `?date_time=${encodeURIComponent(req.query.date_time)}`;
    } else if (req.query?.date) {
      queryDate = `?date=${encodeURIComponent(req.query.date)}`;
    } else if (req.url && req.url.includes('?')) {
      const urlObj = new URL(req.url, 'http://localhost');
      const dt = urlObj.searchParams.get('date_time');
      const d = urlObj.searchParams.get('date');
      if (dt) queryDate = `?date_time=${encodeURIComponent(dt)}`;
      else if (d) queryDate = `?date=${encodeURIComponent(d)}`;
    }

    const apiKey =
      process.env.DATA_GOV_SG_API_KEY ||
      process.env.PSI_API_KEY ||
      req.headers?.['x-api-key'] ||
      req.headers?.['api-key'] ||
      '';

    const targetUrl = `https://api.data.gov.sg/v1/environment/psi${queryDate}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (apiKey) {
      headers['api-key'] = apiKey;
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`data.gov.sg PSI endpoint returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const items = data.items && data.items.length > 0 ? data.items[0] : null;

    if (!items || !items.readings) {
      throw new Error('Unexpected PSI API response structure');
    }

    const psi24 = items.readings.psi_twenty_four_hourly || {};
    const pm25 = items.readings.pm25_one_hourly || {};

    const nationalPSI = psi24.national || psi24.central || 45;
    let status: 'healthy' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous' = 'healthy';
    if (nationalPSI <= 50) status = 'healthy';
    else if (nationalPSI <= 100) status = 'moderate';
    else if (nationalPSI <= 200) status = 'unhealthy';
    else if (nationalPSI <= 300) status = 'very_unhealthy';
    else status = 'hazardous';

    const payload: PSIReadings = {
      timestamp: items.timestamp || new Date().toISOString(),
      updateTimestamp: items.update_timestamp || new Date().toISOString(),
      status,
      psi24Hourly: {
        national: nationalPSI,
        central: psi24.central ?? nationalPSI,
        north: psi24.north ?? nationalPSI,
        south: psi24.south ?? nationalPSI,
        east: psi24.east ?? nationalPSI,
        west: psi24.west ?? nationalPSI,
      },
      pm25OneHourly: {
        central: pm25.central ?? 12,
        north: pm25.north ?? 12,
        south: pm25.south ?? 12,
        east: pm25.east ?? 12,
        west: pm25.west ?? 12,
      },
      raw: data,
    };

    const jsonString = JSON.stringify(payload, null, 2);

    if (res?.status && typeof res.status === 'function') {
      return res.status(200).json(payload);
    } else if (res?.writeHead && typeof res.writeHead === 'function') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(jsonString);
    }

    return new Response(jsonString, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const errorPayload = {
      error: 'Failed to fetch live PSI data',
      message: err?.message || 'Unknown error querying NEA PSI API',
      timestamp: new Date().toISOString(),
      fallbackData: {
        status: 'healthy',
        psi24Hourly: { national: 42, central: 40, north: 43, south: 41, east: 39, west: 44 },
        pm25OneHourly: { central: 11, north: 12, south: 10, east: 9, west: 13 },
      },
    };

    const jsonString = JSON.stringify(errorPayload, null, 2);
    if (res?.status && typeof res.status === 'function') {
      return res.status(502).json(errorPayload);
    } else if (res?.writeHead && typeof res.writeHead === 'function') {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      return res.end(jsonString);
    }

    return new Response(jsonString, {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
