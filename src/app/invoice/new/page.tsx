"use client";

import { createInvoice } from '@/app/actions/onramp';
import { useActionState } from 'react';

export default function NewInvoicePage() {
  const [state, formAction, isPending] = useActionState(createInvoice, null as any);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Create New Invoice</h1>
      
      {state?.error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {state.error}
              </p>
            </div>
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number (Required)</label>
          <input
            type="text"
            name="phone_number"
            required
            placeholder="+1234567890"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
          <input
            type="email"
            name="email"
            placeholder="user@example.com"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              name="amount"
              defaultValue="100"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fiat Currency</label>
            <input
              type="text"
              name="fiat_currency"
              defaultValue="INR"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Crypto Currency</label>
            <input
              type="text"
              name="crypto_currency"
              defaultValue="usdt"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Blockchain Network (Chain)</label>
            <select
              name="chain"
              defaultValue="trc20"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
            >
              <option value="matic20">Polygon (MATIC)</option>
              <option value="bep20">Binance Smart Chain (BSC)</option>
              <option value="trc20">Tron (TRX)</option>
              <option value="erc20">Ethereum (ERC20)</option>
              <option value="solana">Solana</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="optimism">Optimism</option>
            </select>
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700">Description</label>
           <input
             type="text"
             name="description"
             placeholder="Order #123"
             className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
           />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={`w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isPending ? 'Processing...' : 'Proceed to KYC'}
        </button>
      </form>
    </div>
  );
}
