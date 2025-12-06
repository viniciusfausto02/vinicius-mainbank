// src/app/api/rates/route.ts
// 
// Exchange rates endpoint - fetches from external API on server
// This avoids CORS issues and caches the result

let cachedRates: Record<string, number> | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function GET() {
  try {
    // Return cached rates if fresh
    if (cachedRates && Date.now() - lastCacheTime < CACHE_DURATION) {
      console.log('[API] Returning cached rates');
      return Response.json({ rates: cachedRates });
    }

    console.log('[API] Fetching fresh rates from external API');
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: {
        'User-Agent': 'ViniBank/1.0',
      },
    });

    if (!res.ok) {
      console.error('[API] Failed to fetch rates:', res.status);
      throw new Error(`Failed to fetch rates: ${res.status}`);
    }

    const data = await res.json();
    
    if (!data.rates) {
      console.error('[API] No rates in response:', data);
      throw new Error('No rates in API response');
    }

    // Ensure USD is 1
    data.rates.USD = 1;
    
    cachedRates = data.rates;
    lastCacheTime = Date.now();

    if (cachedRates) {
      console.log('[API] Rates fetched successfully:', {
        count: Object.keys(cachedRates).length,
        USD: cachedRates.USD,
        BRL: cachedRates.BRL,
        EUR: cachedRates.EUR,
      });
    }

    return Response.json({ rates: cachedRates });
  } catch (error) {
    console.error('[API] Error fetching rates:', error);
    
    // Return fallback rates
    return Response.json(
      { 
        error: 'Failed to fetch rates',
        rates: { USD: 1 }
      },
      { status: 500 }
    );
  }
}
