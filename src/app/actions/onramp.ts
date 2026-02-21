'use server';

import { onrampService } from '@/services/onramp.service';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import crypto from 'crypto';

export async function createInvoice(prevState: any, formData?: FormData) {
  // If called directly via action={createInvoice}, the first arg is FormData.
  // If called via useActionState, the first arg is prevState and the second is FormData.
  const actualFormData = formData instanceof FormData ? formData : (prevState instanceof FormData ? prevState : null);

  if (!actualFormData) {
    return { error: 'Invalid form data' };
  }

  const phoneNumber = actualFormData.get('phone_number') as string;
  const email = actualFormData.get('email') as string;
  const amount = actualFormData.get('amount') as string;
  const fiatCurrency = actualFormData.get('fiat_currency') as string;
  const cryptoCurrency = actualFormData.get('crypto_currency') as string;
  const description = actualFormData.get('description') as string;
  const chain = (actualFormData.get('chain') as string) || process.env.ONRAMP_CHAIN || 'polygon';

  if (!phoneNumber) {
    return { error: 'Phone number is required' };
  }

  const payload: any = {
    phoneNumber,
    clientCustomerId: crypto.randomUUID(),
    type: 'INDIVIDUAL',
  };

  if (email) {
    payload.email = email;
  }

  // Determine KYC redirect URL. In local dev, it might need to be configurable.
  const kycRedirectUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/invoice/continue`
    : 'http://localhost:3000/invoice/continue';
  
  payload.kycRedirectUrl = kycRedirectUrl;

  try {
    const response = await onrampService.createKycUrl(payload);
    const kycUrl = response.data?.kycUrl;
    const customerId = response.data?.customerId;

    if (!kycUrl) {
      return { error: 'Unable to get KYC URL from Onramp. Please try again.' };
    }

    // Store in cookies (session-like)
    const cookieStore = await cookies();
    cookieStore.set('onramp_customer_id', customerId || '', { secure: true, httpOnly: true });
    cookieStore.set('onramp_phone', phoneNumber, { secure: true, httpOnly: true });
    cookieStore.set('onramp_email', email || '', { secure: true, httpOnly: true });
    cookieStore.set('onramp_amount', amount || '100', { secure: true, httpOnly: true });
    cookieStore.set('onramp_fiat_currency', fiatCurrency || 'INR', { secure: true, httpOnly: true });
    cookieStore.set('onramp_crypto_currency', cryptoCurrency || 'usdt', { secure: true, httpOnly: true });
    cookieStore.set('onramp_description', description || '', { secure: true, httpOnly: true });
    cookieStore.set('onramp_chain', chain, { secure: true, httpOnly: true });

    redirect(kycUrl);
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }

    // Handle "already linked to customerId" logic from PHP
    const errorData = error.data || {};
    const existingCustomerId = errorData.customerId || errorData.data?.customerId;
    const errorMessage = error.message || '';

    if (error.status === 400 && existingCustomerId && errorMessage.includes('already linked to customerId')) {
      try {
        const retryResponse = await onrampService.createKycUrl({
          customerId: existingCustomerId,
          kycRedirectUrl,
        });

        const retryKycUrl = retryResponse.data?.kycUrl;
        if (retryKycUrl) {
          const cookieStore = await cookies();
          cookieStore.set('onramp_customer_id', existingCustomerId, { secure: true, httpOnly: true });
          cookieStore.set('onramp_phone', phoneNumber, { secure: true, httpOnly: true });
          cookieStore.set('onramp_email', email || '', { secure: true, httpOnly: true });
          cookieStore.set('onramp_amount', amount || '100', { secure: true, httpOnly: true });
          cookieStore.set('onramp_fiat_currency', fiatCurrency || 'INR', { secure: true, httpOnly: true });
          cookieStore.set('onramp_crypto_currency', cryptoCurrency || 'usdt', { secure: true, httpOnly: true });
          cookieStore.set('onramp_description', description || '', { secure: true, httpOnly: true });
          cookieStore.set('onramp_chain', chain, { secure: true, httpOnly: true });

          redirect(retryKycUrl);
        }
      } catch (retryError: any) {
        if (isRedirectError(retryError)) {
          throw retryError;
        }
        // If retry fails, fall through to main error return
      }
    }

    return { error: error.message || 'An unexpected error occurred' };
  }
}

export async function lookupOfframp(prevState: any, formData?: FormData) {
  const actualFormData = formData instanceof FormData ? formData : (prevState instanceof FormData ? prevState : null);
  
  const customerId = actualFormData?.get('customer_id') as string;
  const transactionId = actualFormData?.get('transaction_id') as string;

  if (!customerId || !transactionId) {
    return { error: 'Customer ID and Transaction ID are required' };
  }

  try {
    const transaction = await onrampService.getOfframpTransaction(customerId, transactionId);
    return { transaction };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}
