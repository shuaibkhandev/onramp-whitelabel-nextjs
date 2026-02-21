'use client';

import { useState } from 'react';
import { lookupOfframp } from '@/app/actions/onramp';

export default function OfframpLookupPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await lookupOfframp(formData);
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.transaction);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Offramp Transaction Lookup</h1>
      
      <form action={handleSubmit} className="space-y-4 bg-gray-50 p-6 rounded-lg shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer ID</label>
          <input
            type="text"
            name="customer_id"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
          <input
            type="text"
            name="transaction_id"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Lookup Transaction'}
        </button>
      </form>

      {error && (
        <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Transaction Details</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
