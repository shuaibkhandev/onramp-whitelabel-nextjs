import { getConfig, signPayload, encodePayload } from '../lib/onramp';

export class OnrampService {
  private config = getConfig();

  /**
   * Perform an authenticated POST request to the Onramp API.
   */
  private async post(path: string, body: any): Promise<any> {
    const url = `${this.config.baseUrl}/${path.replace(/^\//, '')}`;
    const timestamp = Date.now().toString();
    const payload = encodePayload(body, timestamp);
    const signature = signPayload(payload, this.config.apiSecret);

    const headers = {
      'apiKey': this.config.apiKey,
      'timestamp': timestamp,
      'payload': payload,
      'signature': signature,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    console.log('--- Onramp Request Debug ---');
    console.log('URL:', url);
    console.log('Headers:', JSON.stringify({ ...headers, signature: '***', payload: '***' }, null, 2));
    console.log('Payload Length:', payload.length);
    console.log('Timestamp:', timestamp);
    console.log('API Key Present:', !!this.config.apiKey);
    console.log('API Secret Present:', !!this.config.apiSecret);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.error || `HTTP error! status: ${response.status}`) as any;
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return response.json();
  }

  /**
   * Create user / get KYC URL (Onramp widget).
   */
  async createKycUrl(body: any): Promise<any> {
    return this.post('onramp/api/v2/whiteLabel/kyc/url', body);
  }

  /**
   * Get KYC status for a customer.
   */
  async getKycStatus(customerId: string): Promise<any> {
    return this.post('onramp/api/v2/whiteLabel/kyc/status', { customerId });
  }

  /**
   * Create an ONRAMP quote (fiat -> crypto).
   */
  async createOnrampQuote(payload: any): Promise<any> {
    return this.post('onramp/api/v2/whiteLabel/onramp/quote', payload);
  }

  /**
   * Create an ONRAMP transaction.
   */
  async createOnrampTransaction(payload: any): Promise<any> {
    return this.post('onramp/api/v2/whiteLabel/onramp/createTransaction', payload);
  }

  /**
   * Get a single ONRAMP transaction.
   */
  async getOnrampTransaction(customerId: string, transactionId: string): Promise<any> {
    return this.post('onramp/api/v2/whiteLabel/onramp/transaction', {
      customerId,
      transactionId,
    });
  }

  /**
   * Get a single OFFRAMP transaction.
   */
  async getOfframpTransaction(customerId: string, transactionId: string): Promise<any> {
    return this.post('onramp/api/v2/whiteLabel/offramp/transaction', {
      customerId,
      transactionId,
    });
  }

  /**
   * Fetch supported payment method types (public, no auth).
   */
  async fetchPaymentMethodTypes(): Promise<any> {
    const url = `${this.config.baseUrl}/onramp/api/v2/common/public/fetchPaymentMethodType`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
        return {};
    }

    const data = await response.json();
    return data.data || {};
  }

  /**
   * Convenience helper to inject configured receive wallet address into a payload.
   */
  withReceiveAddress(payload: any, overrideAddress?: string): any {
    const address = overrideAddress || this.config.receiveAddress;
    if (address && !payload.toAddress) {
      payload.toAddress = address;
    }
    return payload;
  }
}

export const onrampService = new OnrampService();
