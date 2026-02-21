
const crypto = require('crypto');

const baseUrl = 'https://api.onramp.money';
const apiKey = 'iJl3pTyOuoi8i5cQ6g9jjT0VMgPWqJXHM0VfwTT4Ls7RE30PQp';
const apiSecret = 'hVtEmBPbok7ZfRHr5mvYkxHCjJ4A8NogKtleg6jmEEcPHXXytu';

function signPayload(payload, secret) {
  return crypto.createHmac('sha512', secret).update(payload).digest('hex');
}

function encodePayload(body, timestamp) {
  const json = JSON.stringify({ body, timestamp });
  return Buffer.from(json).toString('base64');
}

async function listTokens(chain) {
  const path = `onramp/api/v2/common/public/fetchTokenList?chain=${chain}`;
  const timestamp = Date.now().toString();
  const body = {}; // Empty body for GET-like if applicable, but this is a GET?
  
  // fetchTokenList is usually a GET, but let's see if we can send headers
  const url = `${baseUrl}/${path}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'apiKey': apiKey,
        'Accept': 'application/json',
      }
    });
    const data = await response.json();
    const symbols = data.data?.map(t => t.symbol) || [];
    console.log(`Chain: ${chain} | Tokens:`, symbols.join(', '));
  } catch (error) {
    console.error(`Error for ${chain}:`, error);
  }
}

async function run() {
    await listTokens('trc20');
    await listTokens('matic20');
    await listTokens('bep20');
}

run();
