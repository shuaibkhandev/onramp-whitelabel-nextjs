
const crypto = require('crypto');

const baseUrl = 'https://api.onramp.money';
const apiKey = 'iJl3pTyOuoi8i5cQ6g9jjT0VMgPWqJXHM0VfwTT4Ls7RE30PQp';
const apiSecret = 'hVtEmBPbok7ZfRHr5mvYkxHCjJ4A8NogKtleg6jmEEcPHXXytu';

async function checkMethods() {
  const url = `${baseUrl}/onramp/api/v2/common/public/fetchPaymentMethodType`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Supported Payment Methods:', JSON.stringify(data.data, null, 2));
  } catch (error) {
    console.error('Error fetching methods:', error);
  }
}

checkMethods();
