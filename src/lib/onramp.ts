import crypto from 'crypto';

export interface OnrampConfig {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  receiveAddress?: string;
  chain: string;
}

export const getConfig = (): OnrampConfig => {
  return {
    baseUrl: process.env.ONRAMP_BASE_URL?.replace(/\/$/, '') || 'https://api.onramp.money',
    apiKey: process.env.ONRAMP_API_KEY || '',
    apiSecret: process.env.ONRAMP_SECRET_KEY || process.env.ONRAMP_API_SECRET || '',
    receiveAddress: process.env.ONRAMP_RECEIVE_ADDRESS,
    chain: process.env.ONRAMP_CHAIN || 'trc20',
  };
};

/**
 * Perform HMAC-SHA512 signing of the payload.
 */
export const signPayload = (payload: string, secret: string): string => {
  return crypto.createHmac('sha512', secret).update(payload).digest('hex');
};

/**
 * Encode payload to base64.
 */
export const encodePayload = (body: any, timestamp: string): string => {
  const obj = {
    body,
    timestamp,
  };
  const json = JSON.stringify(obj);
  return Buffer.from(json).toString('base64');
};
