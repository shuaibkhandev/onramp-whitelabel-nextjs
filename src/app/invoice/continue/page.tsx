import { onrampService } from '@/services/onramp.service';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function InvoiceContinuePage() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get('onramp_customer_id')?.value;

  if (!customerId) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Session Expired</h1>
        <p className="mb-6">Please start again from the invoice form.</p>
        <Link href="/invoice/new" className="text-blue-600 hover:underline">
          Go back to Start
        </Link>
      </div>
    );
  }

  const phone = cookieStore.get('onramp_phone')?.value;
  const email = cookieStore.get('onramp_email')?.value;
  const amount = cookieStore.get('onramp_amount')?.value || '100';
  const fiatCurrency = (cookieStore.get('onramp_fiat_currency')?.value || 'INR').toUpperCase();
  const cryptoCurrency = (cookieStore.get('onramp_crypto_currency')?.value || 'usdt').toLowerCase();
  
  // Get chain from cookie if it exists; fallback to environment variable or 'polygon'
  const chainFromCookie = cookieStore.get('onramp_chain')?.value;
  const chain = chainFromCookie || process.env.ONRAMP_CHAIN || 'polygon';
  const receiveAddress = process.env.ONRAMP_RECEIVE_ADDRESS;

  let kycStatus = null;
  let quote = null;
  let transaction = null;
  let error = null;

  try {
    // 1. Get KYC Status
    console.log(`[InvoiceContinue] Fetching KYC status for customer: ${customerId}`);
    const kycResponse = await onrampService.getKycStatus(customerId);
    kycStatus = kycResponse.data;
    console.log(`[InvoiceContinue] KYC Status: ${kycStatus?.status}`);

    // 2. Resolve Payment Method Dynamically
    console.log(`[InvoiceContinue] Resolving payment method for ${fiatCurrency}...`);
    const paymentMethods = await onrampService.fetchPaymentMethodTypes();
    
    // Fiat Type mapping (INR=1, TRY=2, etc. from PHP service)
    const fiatTypeMap: Record<string, string> = {
      'INR': '1', 'TRY': '2', 'AED': '3', 'MXN': '4', 'VND': '5',
      'NGN': '6', 'BRL': '7', 'PEN': '8', 'COP': '9', 'CLP': '10',
      'PHP': '11', 'EUR': '12', 'IDR': '14', 'KES': '15', 'GHS': '16',
      'ZAR': '17', 'GBP': '20', 'USD': '21', 'THB': '27', 'MYR': '28', 'ARS': '29'
    };
    
    const fiatType = fiatTypeMap[fiatCurrency];
    let paymentMethodType = 'UPI'; // Fallback
    
    if (fiatType && paymentMethods[fiatType]) {
        const methodsForFiat = paymentMethods[fiatType];
        // Pick the first available method (e.g. "UPI" for INR)
        paymentMethodType = Object.keys(methodsForFiat)[0] || 'UPI';
        console.log(`[InvoiceContinue] Dynamically resolved method: ${paymentMethodType}`);
    } else {
        paymentMethodType = getPaymentMethodType(fiatCurrency);
        console.log(`[InvoiceContinue] Using fallback method: ${paymentMethodType}`);
    }

    // 3. Create Quote
    const quotePayload = {
      fromCurrency: String(fiatCurrency).toUpperCase(),
      toCurrency: String(cryptoCurrency).toLowerCase(),
      fromAmount: String(amount),
      chain: String(chain),
      paymentMethodType: String(paymentMethodType),
    };
    console.log('[InvoiceContinue] Creating Quote with payload:', JSON.stringify(quotePayload));
    const quoteResponse = await onrampService.createOnrampQuote(quotePayload);
    quote = quoteResponse.data;
    console.log(`[InvoiceContinue] Quote created. Receiving: ${quote?.toAmount}, Rate: ${quote?.rate}`);

    // Validation: Check if receiveAddress makes sense for the chain
    const isTronAddress = String(receiveAddress).startsWith('T');
    const isEvmChain = ['matic20', 'bep20', 'erc20', 'arbitrum', 'optimism'].includes(chain);
    const isTronChain = chain === 'trc20';

    if (isEvmChain && isTronAddress) {
        throw new Error(`Address Mismatch: You are using a Tron address (${receiveAddress}) but the network is set to ${chain}. Please update your .env or select TRC20.`);
    }
    if (isTronChain && !isTronAddress) {
        throw new Error(`Address Mismatch: You are using a non-Tron address but the network is set to TRC20.`);
    }

    // 4. Create Transaction
    const txPayload = {
      ...quotePayload,
      customerId: String(customerId),
      toAmount: String(quote.toAmount),
      rate: String(quote.rate),
      depositAddress: receiveAddress, // Send both for compatibility
      toAddress: receiveAddress,
    };
    console.log('[InvoiceContinue] Creating Transaction with payload:', JSON.stringify({ ...txPayload, customerId: '***' }));
    const txResponse = await onrampService.createOnrampTransaction(txPayload);
    transaction = txResponse.data;
    console.log(`[InvoiceContinue] Transaction created: ${transaction?.transactionId}`);

  } catch (e: any) {
    console.error('[InvoiceContinue] Flow Error:', e);
    // Include more data if available from our enhanced OnrampService error
    const detailedError = e.data?.error || e.message;
    error = detailedError;
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Invoice Details</h1>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Transaction Failed</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Link href="/invoice/new" className="text-sm font-medium text-red-800 hover:text-red-900 underline">
                  Try again with different settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Customer Info</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Customer ID:</span> <code className="bg-gray-100 px-1 rounded">{customerId}</code></p>
            <p><span className="text-gray-500">Phone:</span> {phone}</p>
            <p><span className="text-gray-500">Email:</span> {email || 'N/A'}</p>
            <p><span className="text-gray-500">KYC Status:</span> <span className={`font-medium ${kycStatus?.status === 'SUCCESS' ? 'text-green-600' : 'text-orange-600'}`}>{kycStatus?.status || 'Unknown'}</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Paying:</span> <span className="font-bold text-lg">{amount} {fiatCurrency}</span></p>
            <p><span className="text-gray-500">Receiving:</span> <span className="font-bold text-lg">{quote?.toAmount || '...'} {cryptoCurrency.toUpperCase()}</span></p>
            <p><span className="text-gray-500">Rate:</span> {quote?.rate || '...'}</p>
            <p><span className="text-gray-500">Chain:</span> <span className="uppercase font-medium text-blue-600">{chain}</span></p>
          </div>
        </div>
      </div>

      {transaction && (
        <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-xl font-bold mb-4 text-blue-900">Payment Instructions</h2>
          <p className="mb-4">Standard Transaction ID: <strong>{transaction.transactionId}</strong></p>
          <div className="p-4 bg-white rounded border border-blue-100">
             <p className="text-gray-700 leading-relaxed">
               Your transaction has been initialized. Please complete the payment of <strong>{amount} {fiatCurrency}</strong> as instructed by the Onramp widget. 
               The crypto will be sent to our secured wallet on the {chain.toUpperCase()} network once confirmed.
             </p>
          </div>
        </div>
      )}
      
      {!transaction && !error && (
        <div className="mt-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Finalizing your secure transaction...</p>
        </div>
      )}
    </div>
  );
}

// Helper function (Fallback mapping)
function getPaymentMethodType(fiat: string): string {
  const map: Record<string, string> = {
    'INR': 'UPI',
    'TRY': 'TRY_BANK_TRANSFER',
    'AED': 'AED-BANK-TRANSFER',
    'MXN': 'SPEI',
    'EUR': 'SEPA_BANK_TRANSFER',
    'IDR': 'IDR_BANK_TRANSFER',
    'GBP': 'FASTER_PAYMENTS',
    'USD': 'ACH',
  };
  return map[fiat] || 'UPI';
}
