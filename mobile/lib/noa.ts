import { NoaClient } from '@noa/api-client';

const baseUrl = process.env.EXPO_PUBLIC_NOA_API_BASE_URL?.replace(/\/$/, '');
const apiKey = process.env.EXPO_PUBLIC_NOA_API_KEY;

export const mobileSessionId = 'mobile_session';

export function getNoaClient(): NoaClient {
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_NOA_API_BASE_URL is not configured. Set it to the reachable FastAPI /api URL.');
  }
  return new NoaClient({ baseUrl, apiKey, timeoutMs: 60_000 });
}
